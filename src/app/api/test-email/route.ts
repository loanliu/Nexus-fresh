import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail, verifySMTPConnection } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // First verify SMTP connection
    const connectionOk = await verifySMTPConnection();
    if (!connectionOk) {
      return NextResponse.json(
        { error: 'SMTP connection failed. Check your configuration.' },
        { status: 500 }
      );
    }

    // Send test email
    const result = await sendTestEmail(email);

    if (result.success) {
      return NextResponse.json({
        ok: true,
        message: 'Test email sent successfully!',
        email
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send test email',
          details: result.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in POST /api/test-email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check SMTP configuration
export async function GET() {
  try {
    const connectionOk = await verifySMTPConnection();
    
    return NextResponse.json({
      ok: connectionOk,
      smtpConfigured: !!(
        process.env.SMTP_HOST && 
        process.env.SMTP_PORT && 
        process.env.SMTP_USER && 
        process.env.SMTP_PASS
      ),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL,
      message: connectionOk 
        ? 'SMTP connection is working correctly' 
        : 'SMTP connection failed'
    });
  } catch (error) {
    console.error('Error in GET /api/test-email:', error);
    return NextResponse.json(
      { 
        ok: false,
        error: 'Failed to check SMTP configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
