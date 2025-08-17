import dotenv from 'dotenv';
dotenv.config();
const sgMail = require('@sendgrid/mail');

// Basic HTML escaping to avoid breaking the email markup
function escapeHtml(input: string | undefined): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toHtmlWithLineBreaks(input: string | undefined): string {
  return escapeHtml(input || '').replace(/\n/g, '<br />');
}

interface EmailConfig {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  fromEmail?: string;
  fromName?: string;
}

interface WeeklyReportData {
  projectsCompleted: number;
  totalNotes: number;
  totalTodos: number;
  completedTodos: number;
  reportContent: string;
  dateRange: string;
  aiNarrative?: string;
  narrativeOnly?: boolean;
}

class EmailService {
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.warn('SendGrid API key not configured. Email functionality will be disabled.');
      return;
    }

    sgMail.setApiKey(apiKey);
    this.isConfigured = true;
    console.log('SendGrid email service initialized successfully');
  }

  async sendEmail(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'SendGrid not configured. Please set SENDGRID_API_KEY environment variable.'
      };
    }

    try {
      const msg = {
        to: config.to,
        from: {
          email: config.fromEmail || process.env.SENDGRID_FROM_EMAIL || 'progress@evosgpt.eu',
          name: config.fromName || process.env.SENDGRID_FROM_NAME || 'Progress Tracker'
        },
        subject: config.subject,
        text: config.text,
        html: config.html,
      };

      await sgMail.send(msg);
      
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendWeeklyReport(reportData: WeeklyReportData, recipientEmail?: string | string[]): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'SendGrid not configured. Please set SENDGRID_API_KEY environment variable.'
      };
    }

    const recipient = recipientEmail || process.env.DEFAULT_REPORT_EMAIL;
    
    if (!recipient) {
      return {
        success: false,
        error: 'No recipient email configured. Please set DEFAULT_REPORT_EMAIL or provide recipient.'
      };
    }

    const { subject, html, text } = this.buildWeeklyReportMessage(reportData);
    return this.sendEmail({ to: recipient, subject, html, text });
  }

  // Build message for preview or sending
  buildWeeklyReportMessage(reportData: WeeklyReportData, subjectOverride?: string): { subject: string; html: string; text: string } {
    const subject = subjectOverride || `Weekly Progress Report - ${reportData.dateRange}`;
    const html = this.generateWeeklyReportHTML(reportData);
    const text = this.generateWeeklyReportText(reportData);
    return { subject, html, text };
  }

  private generateWeeklyReportHTML(data: WeeklyReportData): string {
    const siteUrl = process.env.SITE_URL || 'https://tracker.evosgpt.eu';
    const aiNarrativeBox = data.aiNarrative
      ? `<tr>
            <td style="padding:12px;border:1px solid #ffe082;background-color:#fff8e1;">
              <strong style="font-family:Arial,sans-serif;font-size:14px;color:#333;">AI Summary</strong>
              <div style="margin-top:8px;font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;">${toHtmlWithLineBreaks(data.aiNarrative)}</div>
            </td>
         </tr>
         <tr><td height="16" style="line-height:16px;font-size:0;">&nbsp;</td></tr>`
      : '';

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Weekly Progress Report</title>
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
                <!-- Header -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="font-family:Arial,sans-serif;color:#333333;">
                      <p style="margin:0;font-size:22px;line-height:28px;font-weight:bold;">Weekly Progress Report</p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family:Arial,sans-serif;color:#666666;">
                      <p style="margin:8px 0 0 0;font-size:14px;">${escapeHtml(data.dateRange)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td height="16" style="line-height:16px;font-size:0;">&nbsp;</td></tr>
            <!-- Stats -->
            <tr>
              <td style="padding:0 16px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa;">
                  <tr>
                    <td style="padding:16px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td width="33%" align="center" style="font-family:Arial,sans-serif;">
                            <span style="display:block;font-size:22px;font-weight:bold;color:#007bff;">${data.projectsCompleted}</span>
                            <span style="display:block;font-size:12px;color:#666666;">Projects Active</span>
                          </td>
                          <td width="33%" align="center" style="font-family:Arial,sans-serif;">
                            <span style="display:block;font-size:22px;font-weight:bold;color:#007bff;">${data.totalNotes}</span>
                            <span style="display:block;font-size:12px;color:#666666;">Notes Created</span>
                          </td>
                          <td width="33%" align="center" style="font-family:Arial,sans-serif;">
                            <span style="display:block;font-size:22px;font-weight:bold;color:#007bff;">${data.completedTodos}/${data.totalTodos}</span>
                            <span style="display:block;font-size:12px;color:#666666;">Tasks Completed</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td height="16" style="line-height:16px;font-size:0;">&nbsp;</td></tr>
            <!-- Content with left color bar (no CSS borders for Outlook) -->
            <tr>
              <td style="padding:0 16px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="4" style="background-color:#28a745;">&nbsp;</td>
                    <td style="padding:12px 12px 12px 12px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="font-family:Arial,sans-serif;font-size:18px;color:#333333;font-weight:bold;">Weekly Summary</td>
                        </tr>
                        ${data.narrativeOnly ? aiNarrativeBox : aiNarrativeBox + `<tr><td style="font-family:Arial,sans-serif;font-size:14px;color:#333333;line-height:1.5;">${toHtmlWithLineBreaks(data.reportContent)}</td></tr>`}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td height="16" style="line-height:16px;font-size:0;">&nbsp;</td></tr>
            <!-- Footer -->
            <tr>
              <td style="padding:0 24px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="font-family:Arial,sans-serif;font-size:12px;color:#666666;">
                      <p style="margin:0;">Generated automatically by Progress Tracker</p>
                      <p style="margin:8px 0 0 0;"><a href="${siteUrl}" style="color:#007bff;text-decoration:underline;">View your dashboard</a></p>
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
</html>`;
  }

  private generateWeeklyReportText(data: WeeklyReportData): string {
    const siteUrl = process.env.SITE_URL || 'https://tracker.evosgpt.eu';
    const header = `WEEKLY PROGRESS REPORT\n${data.dateRange}`;

    if (data.narrativeOnly && data.aiNarrative) {
      return `${header}\n\n${data.aiNarrative}\n\n--\nGenerated automatically by Progress Tracker\nView your dashboard: ${siteUrl}`.trim();
    }

    const stats = `WEEKLY STATISTICS:\n- Active Projects: ${data.projectsCompleted}\n- Notes Created: ${data.totalNotes}\n- Tasks Completed: ${data.completedTodos}/${data.totalTodos}`;
    const narrativeBlock = data.aiNarrative ? `AI SUMMARY:\n${data.aiNarrative}\n\n` : '';
    const summary = `SUMMARY:\n${data.reportContent}`;

    return `${header}\n\n${stats}\n\n${narrativeBlock}${summary}\n\n--\nGenerated automatically by Progress Tracker\nView your dashboard: ${siteUrl}`.trim();
  }

  // Test email functionality
  async sendTestEmail(recipientEmail: string): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: recipientEmail,
      subject: 'Progress Tracker - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🎉 Test Email Successful!</h2>
          <p>Your SendGrid integration is working correctly.</p>
          <p>You'll receive weekly progress reports at this email address.</p>
        </div>
      `,
      text: 'Test Email Successful! Your SendGrid integration is working correctly.'
    });
  }
}

export default new EmailService();