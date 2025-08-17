import express from 'express';
import { pool } from '../server';
import { z } from 'zod';
import llmService from '../services/llm';
import emailService from '../services/email';
import settingsService from '../services/settings';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

  // Validation schema
const generateReportSchema = z.object({
  project_id: z.string().uuid(),
  report_type: z.enum(['status', 'summary', 'stakeholder']),
  recipient: z.string().optional(),
  send_email: z.boolean().optional(),
});

const weeklyReportSchema = z.object({
  recipient: z.string().email().optional(),
  send_email: z.boolean().optional().default(true),
  template: z.enum(['self','manager','company']).optional(),
  project_id: z.string().uuid().optional(),
  narrativeOnly: z.boolean().optional(),
  sections: z.object({
    includeNotes: z.boolean().optional(),
    includeTodos: z.boolean().optional(),
  }).optional()
});

// helper to tailor narrative prompt per template
function buildNarrativePrompt(template: 'self'|'manager'|'company'|undefined, raw: string): string {
  const base = 'Write a concise, friendly weekly summary for a progress tracking email using the RAW SUMMARY below.';
  const tones: Record<string, string> = {
    self: 'Focus on detailed learnings, what worked, and next small steps. Keep it practical and reflective.',
    manager: 'Prioritize outcomes, business value, blockers, and clear next actions. Keep it tight and executive-friendly.',
    company: 'Highlight milestones, benefits, and impact in accessible language. Keep it engaging and positive.'
  };
  const tone = template ? tones[template] : tones.manager;
  return `${base}\nTone: ${tone}\n\nRAW SUMMARY\n${raw}`;
}

// GET /api/reports?project_id=uuid - Get reports for a project
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }
    
    const result = await pool.query(
      'SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC',
      [project_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/reports/generate - Generate a new report
router.post('/generate', async (req, res) => {
  try {
    const validatedData = generateReportSchema.parse(req.body);
    
    // Get project info
    const projectResult = await pool.query(
      'SELECT name, description FROM projects WHERE id = ?',
      [validatedData.project_id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    
    // Get notes for the project
    const notesResult = await pool.query(
      'SELECT content, enhanced_content FROM notes WHERE project_id = ? ORDER BY created_at DESC',
      [validatedData.project_id]
    );
    
    const notes = notesResult.rows.map(note => 
      note.enhanced_content || note.content
    );
    
    // Get todos for the project
    const todosResult = await pool.query(
      'SELECT title, description, status, priority FROM todos WHERE project_id = ? ORDER BY created_at DESC',
      [validatedData.project_id]
    );
    
    const todos = todosResult.rows.map(todo => 
      `${todo.title} (${todo.status}, ${todo.priority} priority)${todo.description ? ': ' + todo.description : ''}`
    );
    
    // Include timeline context (upcoming deadlines and milestones) to help the LLM generate richer reports
    const upcomingTodosResult = await pool.query(
      `SELECT title, description, status, due_date
       FROM todos
       WHERE project_id = ?
         AND due_date IS NOT NULL AND due_date != ''
         AND due_date >= date('now') AND due_date <= date('now', '+30 days')
       ORDER BY due_date ASC`,
      [validatedData.project_id]
    );
    const upcomingMilestonesResult = await pool.query(
      `SELECT title, description, status, target_date
       FROM milestones
       WHERE project_id = ?
         AND target_date IS NOT NULL AND target_date != ''
         AND target_date >= date('now') AND target_date <= date('now', '+30 days')
       ORDER BY target_date ASC`,
      [validatedData.project_id]
    );
    const timelineTodos = upcomingTodosResult.rows.map((t: any) => 
      `Deadline: ${t.title} due ${t.due_date}${t.status ? ` (${t.status})` : ''}${t.description ? ' — ' + t.description : ''}`
    );
    const timelineMilestones = upcomingMilestonesResult.rows.map((m: any) => 
      `Milestone: ${m.title}${m.status ? ` (${m.status})` : ''}${m.target_date ? `, target ${m.target_date}` : ''}${m.description ? ' — ' + m.description : ''}`
    );
    const todosWithTimeline = [...todos, ...timelineTodos, ...timelineMilestones];
    
    // Generate report with LLM
    const llmResult = await llmService.generateReport({
      projectName: project.name,
      notes,
      todos: todosWithTimeline,
      reportType: validatedData.report_type,
      recipient: validatedData.recipient
    });
    
    if (!llmResult.success) {
      return res.status(500).json({ error: 'Failed to generate report', details: llmResult.error });
    }
    
    // Save report to database
    const reportTitle = `${validatedData.report_type.charAt(0).toUpperCase() + validatedData.report_type.slice(1)} Report - ${project.name}`;
    const reportId = uuidv4();
    
    await pool.query(
      'INSERT INTO reports (id, project_id, title, content, report_type, recipient) VALUES (?, ?, ?, ?, ?, ?)',
      [
        reportId,
        validatedData.project_id,
        reportTitle,
        llmResult.data,
        validatedData.report_type,
        validatedData.recipient
      ]
    );
    
    // Fetch the created report
    const result = await pool.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    const savedReport = result.rows[0];
    
    // Send email if requested
    if (validatedData.send_email && validatedData.recipient) {
      try {
        const emailResult = await emailService.sendEmail({
          to: validatedData.recipient,
          subject: `${reportTitle} - ${(() => { const d=new Date(); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}`,
          html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${reportTitle}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f4;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f4;">
      <tr>
        <td align="center">
          <!--[if mso]>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td>
          <![endif]-->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;">
            <tr><td height="24" style="line-height:24px;font-size:0;">&nbsp;</td></tr>
            <tr>
              <td style="padding:0 24px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="left" style="font-family:Arial,sans-serif;color:#333333;">
                      <h2 style="margin:0;font-size:18px;line-height:24px;font-weight:bold;">${reportTitle}</h2>
                    </td>
                  </tr>
                </table>
                <div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa;">
                  <tr>
                    <td style="padding:16px;font-family:Arial,sans-serif;font-size:14px;color:#333333;line-height:1.5;">
                      ${String(llmResult.data || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br />')}
                    </td>
                  </tr>
                </table>
                <div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="font-family:Arial,sans-serif;font-size:12px;color:#666666;">
                      <p style="margin:0;">Generated by Progress Tracker</p>
                      <p style="margin:8px 0 0 0;"><a href="${process.env.SITE_URL || 'https://tracker.evosgpt.eu'}" style="color:#007bff;text-decoration:underline;">View Dashboard</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td height="24" style="line-height:24px;font-size:0;">&nbsp;</td></tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
  </body>
</html>
          `,
          text: `${reportTitle}\n\n${String(llmResult.data || '').replace(/\n+/g, '\n')}`
        });
        
        if (emailResult.success) {
          savedReport.email_sent = true;
          savedReport.email_recipient = validatedData.recipient;
        }
      } catch (emailError) {
        console.warn('Failed to send report email:', emailError);
      }
    }
    
    res.status(201).json(savedReport);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

  // POST /api/reports/weekly - Generate and send weekly report
router.post('/weekly', async (req, res) => {
  try {
    const validatedData = weeklyReportSchema.parse(req.body);
    
    // Get the date range for the last week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    const dateRange = `${fmt(startDate)} - ${fmt(endDate)}`;
    
    // Get all projects
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
      SELECT n.content, n.enhanced_content, p.name as project_name, p.description as project_description
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
    
    // Timeline: milestones completed last 7 days and upcoming next 7 days; upcoming task deadlines next 7 days
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
    
    // Generate content summary with customizable sections; include AI project status if enabled
    const includeNotes = validatedData.sections?.includeNotes !== false; // default true
    const includeTodos = validatedData.sections?.includeTodos !== false; // default true

    let reportContent = "Weekly Activity Summary:\n\n";

    // Insert AI status report for primary project when enabled
    try {
      const useAI = await settingsService.get('weekly_use_ai_status', true);
      const primaryProjectId = await settingsService.get('primary_project_id', '');
      if (useAI && primaryProjectId) {
        const projectRes = await pool.query('SELECT name, description FROM projects WHERE id = ?', [primaryProjectId]);
        if (projectRes.rows.length > 0) {
          const llmStatus = await llmService.generateReport({
            projectName: projectRes.rows[0].name,
            notes: [],
            todos: [],
            reportType: 'status',
            recipient: undefined
          });
          if (llmStatus.success) {
            reportContent += `📣 Project Status (AI) — ${projectRes.rows[0].name}:\n${llmStatus.data}\n\n`;
          }
        }
      }
    } catch (e) {
      // Non-fatal; continue without AI insert
    }
    
    const narrativeOnly = await settingsService.get('weekly_narrative_only', true);

    if (!narrativeOnly && includeNotes && recentNotesResult.rows.length > 0) {
      reportContent += "📝 Recent Notes:\n";
      recentNotesResult.rows.forEach((note: any) => {
        const content = note.enhanced_content || note.content;
        reportContent += `• [${note.project_name}] ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\n`;
      });
      reportContent += "\n";
    }
    
    if (!narrativeOnly && includeTodos && recentTodosResult.rows.length > 0) {
      reportContent += "✅ Recent Tasks:\n";
      recentTodosResult.rows.forEach((todo: any) => {
        const status = todo.status === 'completed' ? '✅' : '🔄';
        reportContent += `${status} [${todo.project_name}] ${todo.title}\n`;
      });
      reportContent += "\n";
    }
    
    if (!narrativeOnly) {
      if (upcomingMilestonesNextWeekResult.rows.length > 0) {
        reportContent += "🎯 Upcoming Milestones (next 7 days):\n";
        upcomingMilestonesNextWeekResult.rows.forEach((m: any) => {
          reportContent += `• [${m.project_name}] ${m.title}${m.target_date ? ` — ${m.target_date}` : ''}\n`;
        });
        reportContent += "\n";
      }
      if (completedMilestonesResult.rows.length > 0) {
        reportContent += "🏁 Milestones Completed (last 7 days):\n";
        completedMilestonesResult.rows.forEach((m: any) => {
          reportContent += `• [${m.project_name}] ${m.title}${m.target_date ? ` — ${m.target_date}` : ''}\n`;
        });
        reportContent += "\n";
      }
      if (upcomingDeadlinesNextWeekResult.rows.length > 0) {
        reportContent += "⏰ Upcoming Deadlines (next 7 days):\n";
        upcomingDeadlinesNextWeekResult.rows.forEach((t: any) => {
          reportContent += `• [${t.project_name}] ${t.title}${t.due_date ? ` — due ${t.due_date}` : ''}\n`;
        });
        reportContent += "\n";
      }
    }
    
    if (!narrativeOnly && (includeNotes && recentNotesResult.rows.length === 0) && (includeTodos && recentTodosResult.rows.length === 0)) {
      reportContent += "No recent activity recorded this week.\n";
    }
    
    reportContent += `\nOverall Progress:\n`;
    reportContent += `• ${projectsCompleted} active projects\n`;
    reportContent += `• ${totalNotes} new notes created\n`;
    reportContent += `• ${completedTodos}/${totalTodos} tasks completed\n`;
    
    // Optional LLM narrative to polish the weekly email using real recent notes/todos
    let aiNarrative: string | undefined;
    try {
      const llmNotes = includeNotes ? recentNotesResult.rows.map((note: any) => {
        const content = note.enhanced_content || note.content || '';
        return `[${note.project_name}] ${content}`;
      }) : [];
      const llmTodosBase = includeTodos ? recentTodosResult.rows.map((todo: any) => {
        const desc = todo.description ? ` — ${todo.description}` : '';
        return `[${todo.project_name}] ${todo.title} (${todo.status})${desc}`;
      }) : [];
      const llmTimelineExtras: string[] = [];
      upcomingMilestonesNextWeekResult.rows.forEach((m: any) => {
        llmTimelineExtras.push(`[${m.project_name}] Milestone: ${m.title}${m.target_date ? ` (target ${m.target_date})` : ''}`);
      });
      completedMilestonesResult.rows.forEach((m: any) => {
        llmTimelineExtras.push(`[${m.project_name}] Milestone completed: ${m.title}${m.target_date ? ` (target ${m.target_date})` : ''}`);
      });
      upcomingDeadlinesNextWeekResult.rows.forEach((t: any) => {
        llmTimelineExtras.push(`[${t.project_name}] Deadline: ${t.title}${t.due_date ? ` (due ${t.due_date})` : ''}`);
      });
      const llmTodos = [...llmTodosBase, ...llmTimelineExtras];
      const reportType = (validatedData.template === 'manager') ? 'status' : 'summary';
      const narrative = await llmService.generateReport({
        projectName: 'All Projects',
        notes: llmNotes,
        todos: llmTodos,
        reportType: reportType as any,
        recipient: validatedData.template
      });
      if (narrative.success) aiNarrative = narrative.data;
    } catch {}

    const weeklyReportData = {
      projectsCompleted,
      totalNotes,
      totalTodos,
      completedTodos,
      reportContent,
      dateRange,
      narrativeOnly
    };
    if (aiNarrative) (weeklyReportData as any).aiNarrative = aiNarrative;
    
    // Send email if requested
    if (validatedData.send_email) {
      const profiles = await settingsService.getWeeklyProfiles().catch(() => []);
      const extraRecipients = (await settingsService.get('weekly_report_recipients', '[]') as unknown as string);
      const parsedExtra = (() => { try { return JSON.parse(extraRecipients) as string[]; } catch { return []; } })();
      const aggregateRecipients: string[] = [];
      aggregateRecipients.push(validatedData.recipient || (await settingsService.getWeeklyReportEmail()));
      aggregateRecipients.push(...parsedExtra.filter(Boolean));
      profiles.filter((p: any) => p.enabled).forEach((p: any) => aggregateRecipients.push(...p.recipients));
      const uniqueRecipients = Array.from(new Set(aggregateRecipients.filter(Boolean)));

      const emailResult = await emailService.sendWeeklyReport(
        weeklyReportData,
        uniqueRecipients.length ? uniqueRecipients : validatedData.recipient
      );
      
      if (emailResult.success) {
        res.json({
          success: true,
          message: 'Weekly report generated and sent successfully',
          data: weeklyReportData,
          email_sent: true,
          recipient: validatedData.recipient || process.env.DEFAULT_REPORT_EMAIL
        });
      } else {
        // Return 200 with success=false so the frontend can display the error message
        res.json({
          success: false,
          message: 'Report generated but email failed to send',
          error: emailResult.error,
          data: weeklyReportData,
          email_sent: false
        });
      }
    } else {
      res.json({
        success: true,
        message: 'Weekly report generated successfully',
        data: weeklyReportData,
        email_sent: false
      });
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

// POST /api/reports/weekly/preview - Build and return email HTML/Text
router.post('/weekly/preview', async (req, res) => {
  try {
    const validatedData = weeklyReportSchema.parse({ ...req.body, send_email: false });

    // Reuse the same data generation path as /weekly
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    const dateRange = `${fmt(startDate)} - ${fmt(endDate)}`;

    const projectsResult = await pool.query("SELECT * FROM projects WHERE status = 'active'");
    const projectsCompleted = projectsResult.rows.length;

    const notesResult = await pool.query("SELECT COUNT(*) as count FROM notes WHERE created_at >= date('now', '-7 days')");
    const totalNotes = notesResult.rows[0]?.count || 0;
    const todosResult = await pool.query("SELECT COUNT(*) as total FROM todos WHERE created_at >= date('now', '-7 days')");
    const totalTodos = todosResult.rows[0]?.total || 0;
    const completedTodosResult = await pool.query("SELECT COUNT(*) as completed FROM todos WHERE status = 'completed' AND updated_at >= date('now', '-7 days')");
    const completedTodos = completedTodosResult.rows[0]?.completed || 0;

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
    
    // Timeline: milestones completed last 7 days and upcoming next 7 days; upcoming task deadlines next 7 days
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

    const includeNotes = validatedData.sections?.includeNotes !== false;
    const includeTodos = validatedData.sections?.includeTodos !== false;
    let reportContent = 'Weekly Activity Summary:\n\n';
    if (includeNotes && recentNotesResult.rows.length > 0) {
      reportContent += '📝 Recent Notes:\n';
      recentNotesResult.rows.forEach((note: any) => {
        const content = note.enhanced_content || note.content;
        reportContent += `• [${note.project_name}] ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\n`;
      });
      reportContent += '\n';
    }
    if (includeTodos && recentTodosResult.rows.length > 0) {
      reportContent += '✅ Recent Tasks:\n';
      recentTodosResult.rows.forEach((todo: any) => {
        const status = todo.status === 'completed' ? '✅' : '🔄';
        reportContent += `${status} [${todo.project_name}] ${todo.title}\n`;
      });
      reportContent += '\n';
    }
    if ((includeNotes && recentNotesResult.rows.length === 0) && (includeTodos && recentTodosResult.rows.length === 0)) {
      reportContent += 'No recent activity recorded this week.\n';
    }
    
    // Append timeline sections
    if (upcomingMilestonesNextWeekResult.rows.length > 0) {
      reportContent += '🎯 Upcoming Milestones (next 7 days):\n';
      upcomingMilestonesNextWeekResult.rows.forEach((m: any) => {
        reportContent += `• [${m.project_name}] ${m.title}${m.target_date ? ` — ${m.target_date}` : ''}\n`;
      });
      reportContent += '\n';
    }
    if (completedMilestonesResult.rows.length > 0) {
      reportContent += '🏁 Milestones Completed (last 7 days):\n';
      completedMilestonesResult.rows.forEach((m: any) => {
        reportContent += `• [${m.project_name}] ${m.title}${m.target_date ? ` — ${m.target_date}` : ''}\n`;
      });
      reportContent += '\n';
    }
    if (upcomingDeadlinesNextWeekResult.rows.length > 0) {
      reportContent += '⏰ Upcoming Deadlines (next 7 days):\n';
      upcomingDeadlinesNextWeekResult.rows.forEach((t: any) => {
        reportContent += `• [${t.project_name}] ${t.title}${t.due_date ? ` — due ${t.due_date}` : ''}\n`;
      });
      reportContent += '\n';
    }

    // AI narrative using recent notes/todos with primary project focus when available
    let aiNarrative: string | undefined;
    try {
      // Optional primary project focus
      let projectNameForNarrative = 'All Projects';
      try {
        const primaryProjectId = await settingsService.get('primary_project_id', '');
        if (primaryProjectId) {
          const projRes = await pool.query('SELECT name, description FROM projects WHERE id = ?', [primaryProjectId]);
          if (projRes.rows.length) {
            projectNameForNarrative = projRes.rows[0].name;
          }
        }
      } catch {}

      const llmNotes = includeNotes ? (() => {
        const arr = recentNotesResult.rows.map((note: any) => {
          const content = note.enhanced_content || note.content || '';
          return `[${note.project_name}] ${content}`;
        });
        const anyWithDesc = recentNotesResult.rows.find((n: any) => n.project_description);
        if (anyWithDesc) arr.unshift(`Project context: ${anyWithDesc.project_description}`);
        return arr;
      })() : [];
      const llmTodosBase = includeTodos ? recentTodosResult.rows.map((todo: any) => {
        const desc = todo.description ? ` — ${todo.description}` : '';
        return `[${todo.project_name}] ${todo.title} (${todo.status})${desc}`;
      }) : [];
      const llmTimelineExtras: string[] = [];
      upcomingMilestonesNextWeekResult.rows.forEach((m: any) => {
        llmTimelineExtras.push(`[${m.project_name}] Milestone: ${m.title}${m.target_date ? ` (target ${m.target_date})` : ''}`);
      });
      completedMilestonesResult.rows.forEach((m: any) => {
        llmTimelineExtras.push(`[${m.project_name}] Milestone completed: ${m.title}${m.target_date ? ` (target ${m.target_date})` : ''}`);
      });
      upcomingDeadlinesNextWeekResult.rows.forEach((t: any) => {
        llmTimelineExtras.push(`[${t.project_name}] Deadline: ${t.title}${t.due_date ? ` (due ${t.due_date})` : ''}`);
      });
      const llmTodos = [...llmTodosBase, ...llmTimelineExtras];
      const reportType = (validatedData.template === 'manager') ? 'status' : 'summary';
      const narrative = await llmService.generateReport({ projectName: projectNameForNarrative, notes: llmNotes, todos: llmTodos, reportType: reportType as any, recipient: validatedData.template });
      if (narrative.success) aiNarrative = narrative.data;
    } catch {}

    const weeklyReportData: any = { projectsCompleted, totalNotes, totalTodos, completedTodos, reportContent, dateRange };
    if (aiNarrative) weeklyReportData.aiNarrative = aiNarrative;
    if (validatedData.sections) weeklyReportData.narrativeOnly = await settingsService.get('weekly_narrative_only', true);

    const message = emailService.buildWeeklyReportMessage(weeklyReportData);
    res.json({ success: true, subject: message.subject, html: message.html, text: message.text, data: weeklyReportData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error previewing weekly report:', error);
    res.status(500).json({ error: 'Failed to preview weekly report' });
  }
});

// POST /api/reports/test-email - Test email functionality
router.post('/test-email', async (req, res) => {
  try {
    const { recipient } = req.body;
    
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }
    
    const result = await emailService.sendTestEmail(recipient);
    
    // Always return 200 and indicate success via flag so frontend can show message without throwing
    res.json({
      success: !!result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
      error: result.success ? undefined : result.error,
      recipient
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// GET /api/reports/scheduler/status - Get scheduler status
router.get('/scheduler/status', async (req, res) => {
  try {
    const schedulerService = require('../services/scheduler').default;
    const status = await schedulerService.getStatus();
    
    res.json({
      success: true,
      data: {
        scheduler: status,
        environment: {
          sendgridConfigured: !!process.env.SENDGRID_API_KEY,
          defaultRecipient: process.env.DEFAULT_REPORT_EMAIL,
          reportsEnabled: process.env.WEEKLY_REPORTS_ENABLED !== 'false'
        }
      }
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({ error: 'Failed to get scheduler status' });
  }
});

// POST /api/reports/scheduler/trigger - Manually trigger weekly report
router.post('/scheduler/trigger', async (req, res) => {
  try {
    const schedulerService = require('../services/scheduler').default;
    const result = await schedulerService.triggerWeeklyReport();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Weekly report triggered successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to trigger weekly report',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error triggering weekly report:', error);
    res.status(500).json({ error: 'Failed to trigger weekly report' });
  }
});

// POST /api/reports/scheduler/restart - Restart scheduler with latest settings
router.post('/scheduler/restart', async (req, res) => {
  try {
    const schedulerService = require('../services/scheduler').default;
    await schedulerService.restartWithNewSettings();
    const status = await schedulerService.getStatus();
    res.json({ success: true, message: 'Scheduler restarted', data: status });
  } catch (error) {
    console.error('Error restarting scheduler:', error);
    res.status(500).json({ error: 'Failed to restart scheduler' });
  }
});

// GET /api/reports/:id - Get single report
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// DELETE /api/reports/:id - Delete report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reports WHERE id = ?', [id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
