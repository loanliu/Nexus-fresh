import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { projectId, userId, role = 'super_admin' } = await req.json();

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Project ID and User ID required' }, { status: 400 });
    }

    console.log('🔧 Adding membership for user:', userId, 'project:', projectId, 'role:', role);

    // First, delete any existing memberships to avoid duplicates
    const { error: deleteError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (deleteError) {
      console.log('⚠️ Error deleting existing membership (might not exist):', deleteError.message);
    }

    // Add user as super_admin to the project
    const { data: newMembership, error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: role
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
      message: 'Successfully added membership', 
      membership: newMembership 
    });

  } catch (error) {
    console.error('Add membership error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
