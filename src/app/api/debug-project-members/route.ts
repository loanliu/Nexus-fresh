import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;
    console.log('🔍 Debugging for user:', userId);

    // Check what projects exist
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .limit(10);

    console.log('🔍 Projects:', projects);

    // Check project_members table structure
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('*')
      .eq('user_id', userId);

    console.log('🔍 User memberships:', members);

    // Check if user is owner of any projects
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId);

    console.log('🔍 Owned projects:', ownedProjects);

    return NextResponse.json({
      userId,
      projects: projects || [],
      memberships: members || [],
      ownedProjects: ownedProjects || [],
      errors: {
        projects: projectsError?.message,
        members: membersError?.message,
        owned: ownedError?.message
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
