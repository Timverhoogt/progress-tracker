import { getDatabase } from '../database/sqlite';

interface Setting {
  key: string;
  value: string;
  type: 'string' | 'boolean' | 'number';
  description: string;
  created_at: string;
  updated_at: string;
}

interface SettingsUpdate {
  [key: string]: string | boolean | number;
}

export interface WeeklyReportProfile {
  id: string;
  name: string;
  cron: string;
  recipients: string[];
  template: 'self' | 'manager' | 'company';
  enabled: boolean;
  sections?: {
    includeNotes?: boolean;
    includeTodos?: boolean;
  };
}

class SettingsService {
  private cache: Map<string, Setting> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache

  constructor() {
    // Defer cache refresh until first access to avoid circular startup timing
    this.cacheExpiry = 0;
  }

  // Refresh cache from database
  private async refreshCache(): Promise<void> {
    try {
      const pool = getDatabase();
      const result = await pool.query('SELECT * FROM settings');
      this.cache.clear();
      
      result.rows.forEach((row: Setting) => {
        this.cache.set(row.key, row);
      });
      
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    } catch (error) {
      console.error('Failed to refresh settings cache:', error);
    }
  }

  // Get a setting value with type conversion
  async get<T = string>(key: string, defaultValue?: T): Promise<T> {
    if (Date.now() > this.cacheExpiry) {
      await this.refreshCache();
    }

    const setting = this.cache.get(key);
    if (!setting) {
      return defaultValue as T;
    }

    return this.convertValue(setting.value, setting.type) as T;
  }

  // Get all settings
  async getAll(): Promise<Record<string, any>> {
    if (Date.now() > this.cacheExpiry) {
      await this.refreshCache();
    }

    const settings: Record<string, any> = {};
    this.cache.forEach((setting, key) => {
      settings[key] = this.convertValue(setting.value, setting.type);
    });

    return settings;
  }

  // Get settings with metadata
  async getAllWithMetadata(): Promise<Setting[]> {
    if (Date.now() > this.cacheExpiry) {
      await this.refreshCache();
    }

    return Array.from(this.cache.values()).map(setting => ({
      ...setting,
      value: this.convertValue(setting.value, setting.type)
    }));
  }

  // Set a single setting
  async set(key: string, value: string | boolean | number, type?: 'string' | 'boolean' | 'number', description?: string): Promise<void> {
    const stringValue = String(value);
    const settingType = type || this.inferType(value);
    
    try {
      const pool = getDatabase();
      // Check if setting exists
      const existing = await pool.query('SELECT key FROM settings WHERE key = ?', [key]);
      
      if (existing.rows.length > 0) {
        // Update existing setting
        await pool.query(
          "UPDATE settings SET value = ?, type = ?, updated_at = datetime('now') WHERE key = ?",
          [stringValue, settingType, key]
        );
      } else {
        // Insert new setting
        await pool.query(
          'INSERT INTO settings (key, value, type, description) VALUES (?, ?, ?, ?)',
          [key, stringValue, settingType, description || '']
        );
      }

      // Update cache
      const updatedSetting: Setting = {
        key,
        value: stringValue,
        type: settingType,
        description: description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.cache.set(key, updatedSetting);
    } catch (error) {
      console.error('Failed to set setting:', error);
      throw error;
    }
  }

  // Update multiple settings at once
  async update(settings: SettingsUpdate | Record<string, any>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(settings)) {
        if ((key === 'weekly_report_recipients' || key === 'weekly_report_profiles') && Array.isArray(value)) {
          await this.set(key, JSON.stringify(value), 'string', 'List of recipient emails for weekly reports');
        } else {
          await this.set(key, value as string | boolean | number);
        }
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  // Delete a setting
  async delete(key: string): Promise<void> {
    try {
      const pool = getDatabase();
      await pool.query('DELETE FROM settings WHERE key = ?', [key]);
      this.cache.delete(key);
    } catch (error) {
      console.error('Failed to delete setting:', error);
      throw error;
    }
  }

  // Get email-specific settings
  async getEmailSettings(): Promise<{
    weekly_report_email: string;
    weekly_report_recipients: string[];
    weekly_reports_enabled: boolean;
    weekly_report_schedule: string;
    sendgrid_from_email: string;
    sendgrid_from_name: string;
    timezone: string;
    primary_project_id: string;
    weekly_report_profiles: WeeklyReportProfile[];
    weekly_use_ai_status: boolean;
    weekly_narrative_only: boolean;
  }> {
    return {
      weekly_report_email: await this.get('weekly_report_email', process.env.DEFAULT_REPORT_EMAIL || ''),
      weekly_report_recipients: JSON.parse(await this.get('weekly_report_recipients', '[]') as unknown as string),
      weekly_reports_enabled: await this.get('weekly_reports_enabled', true),
      weekly_report_schedule: await this.get('weekly_report_schedule', '0 9 * * 1'),
      sendgrid_from_email: await this.get('sendgrid_from_email', process.env.SENDGRID_FROM_EMAIL || 'progress@evosgpt.eu'),
      sendgrid_from_name: await this.get('sendgrid_from_name', process.env.SENDGRID_FROM_NAME || 'Progress Tracker'),
      timezone: await this.get('timezone', process.env.TIMEZONE || 'Europe/Amsterdam'),
      primary_project_id: await this.get('primary_project_id', ''),
      weekly_report_profiles: JSON.parse(await this.get('weekly_report_profiles', '[]') as unknown as string),
      weekly_use_ai_status: await this.get('weekly_use_ai_status', true),
      weekly_narrative_only: await this.get('weekly_narrative_only', true)
    };
  }

  // Helper methods for specific settings
  async getWeeklyReportEmail(): Promise<string> {
    return this.get('weekly_report_email', process.env.DEFAULT_REPORT_EMAIL || '');
  }

  async setWeeklyReportEmail(email: string): Promise<void> {
    await this.set('weekly_report_email', email, 'string', 'Email address for weekly reports');
  }

  async setWeeklyReportRecipients(emails: string[]): Promise<void> {
    await this.set('weekly_report_recipients', JSON.stringify(emails), 'string', 'List of recipient emails for weekly reports');
  }

  async isWeeklyReportsEnabled(): Promise<boolean> {
    return this.get('weekly_reports_enabled', true);
  }

  async setWeeklyReportsEnabled(enabled: boolean): Promise<void> {
    await this.set('weekly_reports_enabled', enabled, 'boolean', 'Enable/disable automatic weekly reports');
  }

  async getWeeklyReportSchedule(): Promise<string> {
    return this.get('weekly_report_schedule', '0 9 * * 1');
  }

  async setWeeklyReportSchedule(schedule: string): Promise<void> {
    await this.set('weekly_report_schedule', schedule, 'string', 'Cron schedule for weekly reports');
  }

  // Convert string value to appropriate type
  private convertValue(value: string, type: string): any {
    switch (type) {
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'number':
        return Number(value);
      case 'string':
      default:
        return value;
    }
  }

  // Infer type from value
  private inferType(value: any): 'string' | 'boolean' | 'number' {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'string';
  }

  // Initialize default settings if they don't exist
  async initializeDefaults(): Promise<void> {
    const defaults = [
      { key: 'weekly_report_email', value: process.env.DEFAULT_REPORT_EMAIL || '', type: 'string', description: 'Email address for weekly reports' },
      { key: 'weekly_report_recipients', value: '[]', type: 'string', description: 'List of recipient emails for weekly reports' },
      { key: 'weekly_reports_enabled', value: 'true', type: 'boolean', description: 'Enable/disable automatic weekly reports' },
      { key: 'weekly_report_schedule', value: '0 9 * * 1', type: 'string', description: 'Cron schedule for weekly reports (default: Monday 9 AM)' },
      { key: 'sendgrid_from_email', value: process.env.SENDGRID_FROM_EMAIL || 'progress@evosgpt.eu', type: 'string', description: 'From email address for SendGrid' },
      { key: 'sendgrid_from_name', value: process.env.SENDGRID_FROM_NAME || 'Progress Tracker', type: 'string', description: 'From name for SendGrid' },
      { key: 'timezone', value: process.env.TIMEZONE || 'Europe/Amsterdam', type: 'string', description: 'Timezone for scheduling' },
      { key: 'primary_project_id', value: '', type: 'string', description: 'Primary project to focus weekly reports on' },
      { key: 'weekly_report_profiles', value: '[]', type: 'string', description: 'Array of weekly report profiles (JSON)'},
      { key: 'weekly_use_ai_status', value: 'true', type: 'boolean', description: 'Use AI status report for primary project in weekly emails' },
      { key: 'weekly_narrative_only', value: 'true', type: 'boolean', description: 'Use AI narrative only (no raw lists) in weekly emails' },
      { key: 'llm_tone', value: 'professional', type: 'string', description: 'Tone style for AI responses' },
      { key: 'llm_detail_level', value: 'balanced', type: 'string', description: 'Response detail level preference' },
      { key: 'llm_language', value: 'auto', type: 'string', description: 'Preferred response language' },
      { key: 'llm_system_prompt_mode', value: 'generated', type: 'string', description: 'System prompt mode: generated or custom' },
      { key: 'llm_system_prompt', value: '', type: 'string', description: 'Custom global system prompt prepended to all AI requests' },
      { key: 'llm_preset_template', value: 'default', type: 'string', description: 'Selected prompt template preset' }
    ];

    for (const defaultSetting of defaults) {
      const pool = getDatabase();
      const existing = await pool.query('SELECT key FROM settings WHERE key = ?', [defaultSetting.key]);
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO settings (key, value, type, description) VALUES (?, ?, ?, ?)',
          [defaultSetting.key, defaultSetting.value, defaultSetting.type, defaultSetting.description]
        );
      }
    }

    await this.refreshCache();
  }

  async getWeeklyProfiles(): Promise<WeeklyReportProfile[]> {
    try {
      const json = await this.get<string>('weekly_report_profiles', '[]');
      return JSON.parse(json || '[]');
    } catch {
      return [];
    }
  }
}

export default new SettingsService();