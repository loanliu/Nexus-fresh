import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServerUserId } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Creating new project...');
    
    // Get user ID
    let userId = await getServerUserId(req);
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'Please log in to create projects',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const projectData = await req.json();
    console.log('🔍 Project data:', projectData);

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        created_by: userId
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Error creating project:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project', details: projectError.message },
        { status: 500 }
      );
    }

    console.log('✅ Project created:', project);

    // Add the creator as the owner
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        role: 'owner'
      })
      .select()
      .single();

    if (membershipError) {
      console.error('❌ Error creating membership:', membershipError);
      // Don't fail the request, just log the error
    } else {
      console.log('✅ Membership created:', membership);
    }

    return NextResponse.json({
      ok: true,
      project: {
        ...project,
        membership
      }
    });

  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Getting projects...');
    
    // Get user ID
    let userId = await getServerUserId(req);
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'Please log in to view projects',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Get projects where user is a member
    const { data: memberProjects, error: memberError } = await supabase
      .from('project_members')
      .select(`
        project:projects (
          *,
          tasks (
            id,
            title,
            description,
            status,
            priority,
            due_date,
            effort,
            estimated_hours,
            actual_hours
          )
        )
      `)
      .eq('user_id', userId);

    if (memberError) {
      console.error('❌ Error fetching projects:', memberError);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: memberError.message },
        { status: 500 }
      );
    }

    // Extract projects from the nested structure
    const projects = memberProjects
      ?.map(member => member.project)
      .filter(project => project && !project.is_archived) || [];

    console.log('✅ Projects found:', projects.length);

    return NextResponse.json({
      ok: true,
      projects
    });

  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
