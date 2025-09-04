import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authenticated user found' 
      });
    }

    // Get the user's email
    const userEmail = user.email;
    
    if (!userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'User email not found' 
      });
    }

    // Query the auth.users table to get the UUID
    console.log('Attempting to call get_user_uuid_by_email function...');
    console.log('User email:', userEmail);
    
    const { data: authUser, error: authError } = await supabase
      .rpc('get_user_uuid_by_email', { user_email: userEmail });

    if (authError) {
      console.error('Failed to get user UUID:', authError);
      console.error('Auth error details:', {
        message: authError.message,
        details: authError.details,
        hint: authError.hint,
        code: authError.code
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get user UUID',
        details: authError
      });
    }
    
    console.log('Successfully retrieved user UUID:', authUser);

    return NextResponse.json({ 
      success: true, 
      user_id: authUser,
      email: userEmail
    });

  } catch (error) {
    console.error('Get user UUID error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Exception occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
