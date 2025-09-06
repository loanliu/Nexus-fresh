import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('🔍 Getting all projects...');

    // Get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
      return NextResponse.json({ 
        error: 'Failed to fetch projects', 
        details: projectsError.message 
      }, { status: 500 });
    }

    console.log('📋 Projects found:', projects);

    // Also get project members to see what's there
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('*');

    if (membersError) {
      console.error('❌ Error fetching members:', membersError);
    } else {
      console.log('👥 Project members found:', members);
    }

    return NextResponse.json({ 
      message: 'Projects and members retrieved successfully',
      projects: projects || [],
      members: members || [],
      count: projects?.length || 0
    });

  } catch (error) {
    console.error('Debug projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
