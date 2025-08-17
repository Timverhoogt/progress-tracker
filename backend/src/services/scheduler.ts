const cron = require('node-cron');
import emailService from './email';
import settingsService from './settings';
import { pool } from '../server';

interface WeeklyReportData {
  projectsCompleted: number;
  totalNotes: number;
  totalTodos: number;
  completedTodos: number;
  reportContent: string;
  dateRange: string;
}

class SchedulerService {
  private scheduledTask: any | null = null;

  constructor() {
    // Initialize async, will be called from server startup
    setTimeout(() => this.initializeWeeklyReports(), 1000);
  }

  private async initializeWeeklyReports() {
    try {
      const emailSettings = await settingsService.getEmailSettings();
      
      if (!emailSettings.weekly_reports_enabled) {
        console.log('Weekly reports are disabled in settings');
        return;
      }

      // Schedule weekly reports
      this.scheduledTask = cron.schedule(emailSettings.weekly_report_schedule, async () => {
        console.log('Running scheduled weekly report generation...');
        await this.generateAndSendWeeklyReport();
      }, {
        scheduled: true,
        timezone: emailSettings.timezone
      });

      console.log(`Weekly reports scheduled with cron pattern: ${emailSettings.weekly_report_schedule}`);
      console.log(`Timezone: ${emailSettings.timezone}`);
    } catch (error) {
      console.error('Failed to schedule weekly reports:', error);
    }
  }

  private async generateAndSendWeeklyReport(): Promise<void> {
    try {
      const reportData = await this.generateWeeklyReportData();
      
      const recipient = await settingsService.getWeeklyReportEmail();
      if (!recipient) {
        console.warn('No weekly report email configured, skipping weekly report');
        return;
      }

      const emailResult = await emailService.sendWeeklyReport(reportData, recipient);
      
      if (emailResult.success) {
        console.log(`Weekly report sent successfully to ${recipient}`);
        
        // Log the report sending activity
        await this.logReportActivity(recipient, true, null);
      } else {
        console.error('Failed to send weekly report:', emailResult.error);
        await this.logReportActivity(recipient, false, emailResult.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error in scheduled weekly report generation:', error);
      const fallbackEmail = await settingsService.getWeeklyReportEmail().catch(() => 'unknown');
      await this.logReportActivity(
        fallbackEmail,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async generateWeeklyReportData(): Promise<WeeklyReportData> {
    // Get the date range for the last week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    
    // Get all active projects
    const projectsResult = await pool.query("SELECT * FROM projects WHERE status = 'active'");
    const projectsCompleted = projectsResult.rows.length;
    
    // Get notes from the last week
    const notesResult = await pool.query(
      "SELECT COUNT(*) as count FROM notes WHERE created_at >= date('now', '-7 days')"
    );
    const totalNotes = notesResult.rows[0]?.count || 0;
    
    // Get todos from the last week
    const todosResult = await pool.query(
      "SELECT COUNT(*) as total FROM todos WHERE created_at >= date('now', '-7 days')"
    );
    const totalTodos = todosResult.rows[0]?.total || 0;
    
    const completedTodosResult = await pool.query(
      "SELECT COUNT(*) as completed FROM todos WHERE status = 'completed' AND updated_at >= date('now', '-7 days')"
    );
    const completedTodos = completedTodosResult.rows[0]?.completed || 0;
    
    // Get recent project activity for report content
    const recentNotesResult = await pool.query(`
      SELECT n.content, n.enhanced_content, p.name as project_name
      FROM notes n
      JOIN projects p ON n.project_id = p.id
      WHERE n.created_at >= date('now', '-7 days')
      ORDER BY n.created_at DESC
      LIMIT 10
    `);
    
    const recentTodosResult = await pool.query(`
      SELECT t.title, t.description, t.status, p.name as project_name
      FROM todos t
      JOIN projects p ON t.project_id = p.id
      WHERE t.updated_at >= date('now', '-7 days')
      ORDER BY t.updated_at DESC
      LIMIT 10
    `);
    
    // Timeline windows: completed milestones last 7 days and upcoming milestones/deadlines next 7 days
    const completedMilestonesResult = await pool.query(`
      SELECT m.title, m.description, m.status, m.target_date, p.name as project_name
      FROM milestones m
      JOIN projects p ON m.project_id = p.id
      WHERE m.status = 'completed'
        AND m.target_date IS NOT NULL AND m.target_date != ''
        AND m.target_date >= date('now', '-7 days') AND m.target_date <= date('now')
      ORDER BY m.target_date DESC
      LIMIT 10
    `);
    const upcomingMilestonesNextWeekResult = await pool.query(`
      SELECT m.title, m.description, m.status, m.target_date, p.name as project_name
      FROM milestones m
      JOIN projects p ON m.project_id = p.id
      WHERE m.target_date IS NOT NULL AND m.target_date != ''
        AND m.target_date > date('now') AND m.target_date <= date('now', '+7 days')
      ORDER BY m.target_date ASC
      LIMIT 10
    `);
    const upcomingDeadlinesNextWeekResult = await pool.query(`
      SELECT t.title, t.description, t.status, t.due_date, p.name as project_name
      FROM todos t
      JOIN projects p ON t.project_id = p.id
      WHERE t.due_date IS NOT NULL AND t.due_date != ''
        AND t.due_date > date('now') AND t.due_date <= date('now', '+7 days')
      ORDER BY t.due_date ASC
      LIMIT 10
    `);
    
    // Generate content summary
    let reportContent = "Weekly Activity Summary:\n\n";
    
    if (recentNotesResult.rows.length > 0) {
      reportContent += "📝 Recent Notes:\n";
      recentNotesResult.rows.forEach((note: any) => {
        const content = note.enhanced_content || note.content;
        reportContent += `• [${note.project_name}] ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\n`;
      });
      reportContent += "\n";
    }
    
    if (recentTodosResult.rows.length > 0) {
      reportContent += "✅ Recent Tasks:\n";
      recentTodosResult.rows.forEach((todo: any) => {
        const status = todo.status === 'completed' ? '✅' : '🔄';
        reportContent += `${status} [${todo.project_name}] ${todo.title}\n`;
      });
      reportContent += "\n";
    }
    
    if (recentNotesResult.rows.length === 0 && recentTodosResult.rows.length === 0) {
      reportContent += "No recent activity recorded this week.\n";
    }
    
    reportContent += `\nOverall Progress:\n`;
    reportContent += `• ${projectsCompleted} active projects\n`;
    reportContent += `• ${totalNotes} new notes created\n`;
    reportContent += `• ${completedTodos}/${totalTodos} tasks completed\n`;
    
    // Enrich with timeline summary
    if (upcomingMilestonesNextWeekResult.rows.length > 0) {
      reportContent += `\n🎯 Upcoming Milestones (next 7 days):\n`;
      upcomingMilestonesNextWeekResult.rows.forEach((m: any) => {
        reportContent += `• [${m.project_name}] ${m.title}${m.target_date ? ` — ${m.target_date}` : ''}\n`;
      });
    }
    if (completedMilestonesResult.rows.length > 0) {
      reportContent += `\n🏁 Milestones Completed (last 7 days):\n`;
      completedMilestonesResult.rows.forEach((m: any) => {
        reportContent += `• [${m.project_name}] ${m.title}${m.target_date ? ` — ${m.target_date}` : ''}\n`;
      });
    }
    if (upcomingDeadlinesNextWeekResult.rows.length > 0) {
      reportContent += `\n⏰ Upcoming Deadlines (next 7 days):\n`;
      upcomingDeadlinesNextWeekResult.rows.forEach((t: any) => {
        reportContent += `• [${t.project_name}] ${t.title}${t.due_date ? ` — due ${t.due_date}` : ''}\n`;
      });
    }
    
    // Add motivational message based on activity
    const activityLevel = totalNotes + completedTodos;
    if (activityLevel > 10) {
      reportContent += `\n🎉 Great week! You've been very productive with ${activityLevel} activities completed.`;
    } else if (activityLevel > 5) {
      reportContent += `\n👍 Good progress this week with ${activityLevel} activities.`;
    } else if (activityLevel > 0) {
      reportContent += `\n📊 Some progress made this week. Keep building momentum!`;
    } else {
      reportContent += `\n🌱 A quiet week - consider setting some goals for the upcoming week.`;
    }
    
    return {
      projectsCompleted,
      totalNotes,
      totalTodos,
      completedTodos,
      reportContent,
      dateRange
    };
  }

  private async logReportActivity(recipient: string, success: boolean, error: string | null): Promise<void> {
    try {
      // Create a simple log entry - you might want to create a dedicated table for this
      await pool.query(
        'INSERT INTO reports (id, project_id, title, content, report_type, recipient) VALUES (?, ?, ?, ?, ?, ?)',
        [
          `weekly-${Date.now()}`,
          null, // No specific project for weekly reports
          `Automated Weekly Report - ${success ? 'Success' : 'Failed'}`,
          error ? `Error: ${error}` : 'Weekly report sent successfully',
          'weekly_automated',
          recipient
        ]
      );
    } catch (logError) {
      console.error('Failed to log report activity:', logError);
    }
  }

  // Manual trigger for testing
  async triggerWeeklyReport(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.generateAndSendWeeklyReport();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get next scheduled run time
  getNextRun(): Date | null {
    if (this.scheduledTask && typeof this.scheduledTask.nextDates === 'function') {
      try {
        const next = this.scheduledTask.nextDates();
        // node-cron >=3 returns a luxon DateTime; handle both cases
        // @ts-ignore
        return typeof next?.toDate === 'function' ? next.toDate() : (next || null);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Stop the scheduler
  stopScheduler(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      console.log('Weekly report scheduler stopped');
    }
  }

  // Start the scheduler
  startScheduler(): void {
    if (this.scheduledTask) {
      this.scheduledTask.start();
      console.log('Weekly report scheduler started');
    }
  }

  // Get scheduler status
  async getStatus(): Promise<{ isRunning: boolean; nextRun: Date | null; cronPattern: string; emailSettings: any }> {
    const emailSettings = await settingsService.getEmailSettings();
    const isRunning = (() => {
      if (!this.scheduledTask) return false;
      if (typeof this.scheduledTask.getStatus === 'function') {
        try {
          const status = this.scheduledTask.getStatus(); // 'scheduled' | 'stopped'
          return status !== 'stopped';
        } catch {}
      }
      // Fallback: if task exists, consider scheduled
      return true;
    })();
    return {
      isRunning,
      nextRun: this.getNextRun(),
      cronPattern: emailSettings.weekly_report_schedule,
      emailSettings
    };
  }

  // Restart scheduler with new settings
  async restartWithNewSettings(): Promise<void> {
    this.stopScheduler();
    await this.initializeWeeklyReports();
  }
}

export default new SchedulerService();