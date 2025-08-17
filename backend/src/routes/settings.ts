import express from 'express';
import { z } from 'zod';
import settingsService, { WeeklyReportProfile } from '../services/settings';

const router = express.Router();

// Validation schemas
const updateSettingsSchema = z.object({
  weekly_report_email: z.string().email().optional(),
  weekly_report_recipients: z.array(z.string().email()).optional(),
  weekly_reports_enabled: z.boolean().optional(),
  weekly_report_schedule: z.string().optional(),
  sendgrid_from_email: z.string().email().optional(),
  sendgrid_from_name: z.string().optional(),
  timezone: z.string().optional(),
  primary_project_id: z.string().optional(),
  weekly_report_profiles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    cron: z.string(),
    recipients: z.array(z.string().email()),
    template: z.enum(['self','manager','company']),
    enabled: z.boolean(),
    sections: z.object({
      includeNotes: z.boolean().optional(),
      includeTodos: z.boolean().optional(),
    }).optional()
  })).optional(),
  weekly_use_ai_status: z.boolean().optional(),
  weekly_narrative_only: z.boolean().optional(),
  llm_tone: z.enum(['professional','friendly','formal','concise','enthusiastic','analytical','creative']).optional(),
  llm_detail_level: z.enum(['brief','balanced','detailed','comprehensive']).optional(),
  llm_language: z.enum(['auto','english','dutch','german','french','spanish']).optional(),
  llm_system_prompt_mode: z.enum(['generated','custom']).optional(),
  llm_system_prompt: z.string().optional(),
  llm_preset_template: z.enum(['default','consultant','analyst','manager','technical','creative']).optional(),
});

const setSingleSettingSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.boolean(), z.number()]),
  type: z.enum(['string', 'boolean', 'number']).optional(),
  description: z.string().optional(),
});

// GET /api/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await settingsService.getAll();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /api/settings/email - Get email-specific settings
router.get('/email', async (req, res) => {
  try {
    const emailSettings = await settingsService.getEmailSettings();
    res.json({ success: true, data: emailSettings });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
});

// Profiles CRUD (minimal)
router.get('/profiles', async (req, res) => {
  try {
    const profiles = await settingsService.get('weekly_report_profiles', '[]') as unknown as string;
    res.json({ success: true, data: JSON.parse((profiles as string) || '[]') });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

router.put('/profiles', async (req, res) => {
  try {
    const parsed = updateSettingsSchema.shape.weekly_report_profiles.parse(req.body);
    await settingsService.set('weekly_report_profiles', JSON.stringify(parsed), 'string', 'Weekly report profiles');
    const updated = await settingsService.get('weekly_report_profiles', '[]');
    res.json({ success: true, data: JSON.parse(updated as string) });
  } catch (error) {
    console.error('Error updating profiles:', error);
    res.status(400).json({ error: 'Failed to update profiles' });
  }
});

// GET /api/settings/metadata - Get all settings with metadata
router.get('/metadata', async (req, res) => {
  try {
    const settings = await settingsService.getAllWithMetadata();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings metadata:', error);
    res.status(500).json({ error: 'Failed to fetch settings metadata' });
  }
});

// GET /api/settings/:key - Get single setting
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await settingsService.get(key);
    
    if (value === undefined) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ success: true, data: { key, value } });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// PUT /api/settings - Update multiple settings
router.put('/', async (req, res) => {
  try {
    const validatedData = updateSettingsSchema.parse(req.body);
    
    await settingsService.update(validatedData);
    
    // Restart scheduler to apply any changes related to weekly reports
    try {
      const schedulerService = require('../services/scheduler').default;
      await schedulerService.restartWithNewSettings();
    } catch (e) {
      console.warn('Scheduler restart failed after settings update:', e);
    }
    
    // Get updated settings to return
    const updatedSettings = await settingsService.getEmailSettings();
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// PUT /api/settings/:key - Update single setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const validatedData = setSingleSettingSchema.parse({ key, ...req.body });
    
    await settingsService.set(
      validatedData.key,
      validatedData.value,
      validatedData.type,
      validatedData.description
    );
    
    // Restart scheduler for any potentially related changes
    try {
      const schedulerService = require('../services/scheduler').default;
      await schedulerService.restartWithNewSettings();
    } catch (e) {
      console.warn('Scheduler restart failed after single setting update:', e);
    }

    const updatedValue = await settingsService.get(key);
    
    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: { key, value: updatedValue }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// POST /api/settings - Create new setting
router.post('/', async (req, res) => {
  try {
    const validatedData = setSingleSettingSchema.parse(req.body);
    
    await settingsService.set(
      validatedData.key,
      validatedData.value,
      validatedData.type,
      validatedData.description
    );
    
    const newValue = await settingsService.get(validatedData.key);
    
    res.status(201).json({
      success: true,
      message: 'Setting created successfully',
      data: { key: validatedData.key, value: newValue }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating setting:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
});

// DELETE /api/settings/:key - Delete setting
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    await settingsService.delete(key);
    
    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// POST /api/settings/email/test - Test email with current settings
router.post('/email/test', async (req, res) => {
  try {
    const { recipient } = req.body;
    
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }
    
    // Import email service here to avoid circular dependency
    const emailService = require('../services/email').default;
    const result = await emailService.sendTestEmail(recipient);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        recipient
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// PUT /api/settings/email/quick - Quick update for email settings
router.put('/email/quick', async (req, res) => {
  try {
    const { email, enabled, recipients, fromEmail, fromName } = req.body;
    
    if (email !== undefined) {
      if (!z.string().email().safeParse(email).success) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      await settingsService.setWeeklyReportEmail(email);
    }
    if (recipients !== undefined) {
      if (!Array.isArray(recipients) || !recipients.every((e) => z.string().email().safeParse(e).success)) {
        return res.status(400).json({ error: 'Recipients must be an array of valid email addresses' });
      }
      await settingsService.setWeeklyReportRecipients(recipients);
    }
    
    if (enabled !== undefined) {
      await settingsService.setWeeklyReportsEnabled(Boolean(enabled));
    }
    if (fromEmail !== undefined) {
      if (!z.string().email().safeParse(fromEmail).success) {
        return res.status(400).json({ error: 'Invalid from email format' });
      }
      await settingsService.set('sendgrid_from_email', fromEmail, 'string', 'From email address for SendGrid');
    }
    if (fromName !== undefined) {
      await settingsService.set('sendgrid_from_name', String(fromName), 'string', 'From name for SendGrid');
    }
    
    // Restart scheduler to apply changes immediately
    try {
      const schedulerService = require('../services/scheduler').default;
      await schedulerService.restartWithNewSettings();
    } catch (e) {
      console.warn('Scheduler restart failed after email settings quick update:', e);
    }

    const updatedSettings = await settingsService.getEmailSettings();
    
    res.json({
      success: true,
      message: 'Email settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ error: 'Failed to update email settings' });
  }
});

export default router;