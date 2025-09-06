import nodemailer from 'nodemailer';

// SMTP configuration from environment variables
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // For development/testing
  },
};

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Verify connection configuration
export async function verifySMTPConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
}

// Send invite email
export async function sendInviteEmail(
  to: string,
  inviteLink: string,
  projectName: string,
  inviterName?: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('SMTP not configured, skipping email send');
      return { 
        success: false, 
        error: 'SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.' 
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    
    // Use your verified email address
    const fromAddress = 'loan@nextgen-aisolutions.com';
    
    const mailOptions = {
      from: {
        name: 'Loan Liu',
        address: fromAddress
      },
      to: to,
      subject: `You're invited to join "${projectName}" on Nexus`,
      html: generateInviteEmailHTML(inviteLink, projectName, inviterName, customMessage),
      text: generateInviteEmailText(inviteLink, projectName, inviterName, customMessage),
    };

    console.log('Sending invite email:', {
      from: fromAddress,
      to: to,
      projectName: projectName,
      inviterName,
      customMessage
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('Invite email sent successfully:', result.messageId);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send invite email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Generate HTML email template
function generateInviteEmailHTML(
  inviteLink: string,
  projectName: string,
  inviterName?: string,
  customMessage?: string
): string {
  console.log('🔍 Generating HTML email with custom message:', customMessage);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Project Invitation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 16px;
          color: #6b7280;
        }
        .project-card {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
          border-left: 4px solid #2563eb;
        }
        .project-name {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .cta-button {
          display: inline-block;
          background: #2563eb;
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
          transition: background-color 0.2s;
        }
        .cta-button:hover {
          background: #1d4ed8;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .link-fallback {
          margin-top: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
          font-size: 14px;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Nexus</div>
          <h1 class="title">You're Invited!</h1>
          <p class="subtitle">
            ${inviterName ? `${inviterName} has invited you to join` : 'You have been invited to join'} a project
          </p>
        </div>

        <div class="project-card">
          <div class="project-name">${projectName}</div>
          <p>Join this project to collaborate on tasks, manage deadlines, and work together effectively.</p>
          ${customMessage ? `<div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #2563eb;"><strong>Personal message from ${inviterName || 'the project owner'}:</strong><br>${customMessage}</div>` : ''}
        </div>

        <div style="text-align: center;">
          <a href="${inviteLink}" class="cta-button">Accept Invitation</a>
        </div>

        <div class="link-fallback">
          <p><strong>If the button doesn't work, copy and paste this link:</strong></p>
          <p>${inviteLink}</p>
        </div>

        <div class="footer">
          <p>This invitation will expire in 7 days.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p>© 2025 Nexus Project Management. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate plain text email
function generateInviteEmailText(
  inviteLink: string,
  projectName: string,
  inviterName?: string,
  customMessage?: string
): string {
  return `
You're Invited to Join a Project on Nexus!

${inviterName ? `${inviterName} has invited you to join` : 'You have been invited to join'} the project "${projectName}".

Join this project to collaborate on tasks, manage deadlines, and work together effectively.

${customMessage ? `\nPersonal message from ${inviterName || 'the project owner'}:\n${customMessage}\n` : ''}

Accept your invitation by clicking this link:
${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
Nexus Project Management
© 2025 All rights reserved.
  `;
}

// Send test email (for debugging)
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('SMTP not configured, cannot send test email');
      return { 
        success: false, 
        error: 'SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.' 
      };
    }

    const fromAddress = 'loan@nextgen-aisolutions.com';
    
    const mailOptions = {
      from: {
        name: 'Loan Liu',
        address: fromAddress
      },
      to: to,
      subject: 'Nexus SMTP Test Email',
      html: `
        <h1>SMTP Test Successful!</h1>
        <p>Your email configuration is working correctly.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>From: ${fromAddress}</p>
      `,
      text: `SMTP Test Successful! Your email configuration is working correctly.\nTime: ${new Date().toISOString()}\nFrom: ${fromAddress}`
    };

    console.log('Sending test email:', {
      from: fromAddress,
      to: to
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', result.messageId);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send test email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
