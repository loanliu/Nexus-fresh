import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { feedback, instruction } = await request.json();

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback text is required' },
        { status: 400 }
      );
    }

    // Simple AI-like improvement rules (no external API needed)
    const improvedFeedback = improveFeedbackText(feedback);

    return NextResponse.json({
      success: true,
      improvedFeedback,
      originalFeedback: feedback,
      message: 'AI feedback improvement applied'
    });

  } catch (error) {
    console.error('Error improving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to improve feedback' },
      { status: 500 }
    );
  }
}

function improveFeedbackText(feedback: string): string {
  // Apply basic improvements to make feedback more constructive
  let improved = feedback.trim();
  
  // Ensure it starts with a capital letter
  if (improved.length > 0) {
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  }
  
  // Add period if missing
  if (improved.length > 0 && !improved.match(/[.!?]$/)) {
    improved += '.';
  }
  
  // Replace common informal phrases with more constructive ones
  const improvements = [
    { pattern: /this sucks/gi, replacement: 'this could be improved' },
    { pattern: /i hate/gi, replacement: 'I find it challenging that' },
    { pattern: /doesn't work/gi, replacement: 'is not functioning as expected' },
    { pattern: /bad/gi, replacement: 'could be better' },
    { pattern: /terrible/gi, replacement: 'needs significant improvement' },
    { pattern: /awful/gi, replacement: 'requires attention' },
    { pattern: /stupid/gi, replacement: 'confusing' },
    { pattern: /dumb/gi, replacement: 'unclear' },
  ];
  
  improvements.forEach(({ pattern, replacement }) => {
    improved = improved.replace(pattern, replacement);
  });
  
  // Add constructive framing if feedback is very short
  if (improved.length < 20) {
    improved = `I would like to provide feedback: ${improved}`;
  }
  
  // Add suggestion prompt if it's just complaints
  if (improved.match(/problem|issue|bug|error|fail/i) && !improved.match(/suggest|recommend|could|should|would/i)) {
    improved += ' I would appreciate if this could be addressed in future updates.';
  }
  
  return improved;
}
