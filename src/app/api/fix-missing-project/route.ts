import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServerUserId } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 Fixing missing project...');
    
    // Get user ID
    let userId = await getServerUserId(req);
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'Please log in to fix projects',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const { projectId, projectName = 'My Project' } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
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

    // Check if project already exists
    const { data: existingProject, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (existingProject) {
      console.log('✅ Project already exists:', projectId);
      return NextResponse.json({
        message: 'Project already exists',
        project: existingProject
      });
    }

    // Create the missing project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        name: projectName,
        description: 'Project restored from membership data',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

    console.log('✅ Project created successfully:', project);

    return NextResponse.json({
      message: 'Project created successfully',
      project
    });

  } catch (error) {
    console.error('Error in fix-missing-project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
