import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated', 
        details: userError?.message 
      }, { status: 401 });
    }

    console.log('🔧 Fixing project ownership for user:', user.id);

    // Get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
      return NextResponse.json({ 
        error: 'Failed to fetch projects', 
        details: projectsError.message 
      }, { status: 500 });
    }

    console.log('📋 Found projects:', projects?.length || 0);

    if (!projects || projects.length === 0) {
      return NextResponse.json({ 
        message: 'No projects found to fix ownership for',
        projects: [],
        added: []
      });
    }

    // Get existing project memberships for this user
    const { data: existingMemberships, error: membershipsError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('❌ Error fetching existing memberships:', membershipsError);
      return NextResponse.json({ 
        error: 'Failed to fetch existing memberships', 
        details: membershipsError.message 
      }, { status: 500 });
    }

    const existingProjectIds = new Set(existingMemberships?.map(m => m.project_id) || []);
    console.log('👥 Existing memberships:', existingProjectIds.size);

    // Find projects that don't have ownership records
    const projectsToFix = projects.filter(p => !existingProjectIds.has(p.id));
    console.log('🔧 Projects needing ownership fix:', projectsToFix.length);

    if (projectsToFix.length === 0) {
      return NextResponse.json({ 
        message: 'All projects already have ownership records',
        projects: projects,
        added: []
      });
    }

    // Add ownership records for missing projects
    const ownershipRecords = projectsToFix.map(project => ({
      project_id: project.id,
      user_id: user.id,
      role: 'owner',
      joined_at: project.created_at
    }));

    const { data: addedMemberships, error: insertError } = await supabase
      .from('project_members')
      .insert(ownershipRecords)
      .select();

    if (insertError) {
      console.error('❌ Error adding ownership records:', insertError);
      return NextResponse.json({ 
        error: 'Failed to add ownership records', 
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('✅ Successfully added ownership records:', addedMemberships?.length || 0);

    return NextResponse.json({ 
      message: `Successfully added ownership for ${addedMemberships?.length || 0} projects`,
      projects: projects,
      added: addedMemberships || [],
      total_projects: projects.length,
      fixed_count: addedMemberships?.length || 0
    });

  } catch (error) {
    console.error('Fix project ownership error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
