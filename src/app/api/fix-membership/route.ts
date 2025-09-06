import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    console.log('🔧 Fixing membership for user:', userId, 'project:', projectId);

    // First, let's check if the user is already a member
    const { data: existingMembership, error: checkError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      console.log('✅ User already has membership:', existingMembership);
      return NextResponse.json({ 
        message: 'User already has membership', 
        membership: existingMembership 
      });
    }

    // Add user as super_admin to the project
    const { data: newMembership, error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: 'super_admin'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error adding membership:', insertError);
      return NextResponse.json({ 
        error: 'Failed to add membership', 
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('✅ Successfully added membership:', newMembership);
    return NextResponse.json({ 
      message: 'Successfully added super_admin membership', 
      membership: newMembership 
    });

  } catch (error) {
    console.error('Fix membership error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
