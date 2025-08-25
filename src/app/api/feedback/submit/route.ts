import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.feedback) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      );
    }

    // n8n webhook URL (production)
    const webhookUrl = 'https://loanliu.app.n8n.cloud/webhook/8bc98d75-a611-46e6-b7f5-a5c12b3b3299';
    
    // Add additional metadata
    const feedbackData = {
      feedback: body.feedback.trim(),
      timestamp: new Date().toISOString(),
      userAgent: body.userAgent || 'Unknown',
      url: body.url || 'Unknown',
      userId: body.userId || 'Anonymous',
      source: 'Nexus App Feedback',
    };

    console.log('Sending feedback to n8n:', feedbackData);

    // Send to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      console.error('n8n webhook error:', response.status, response.statusText);
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log('Feedback sent successfully to n8n');

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      timestamp: feedbackData.timestamp,
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
