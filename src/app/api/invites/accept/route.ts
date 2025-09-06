import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserId } from '@/lib/auth';
import { getServerUserId } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    let userId = await getServerUserId(req);
    if (!userId) {
      userId = await getUserId(req);
    }
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'Please log in to accept the invite',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { token } = body;

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: 'Missing required field: token' },
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

    // Look up invite by token
    const { data: invite, error: inviteError } = await supabase
      .from('project_invites')
      .select(`
        id,
        project_id,
        email,
        role,
        status,
        expires_at,
        inviter_id
      `)
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invite token' },
        { status: 404 }
      );
    }

    // Check if invite is still pending
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invite has already been used or revoked' },
        { status: 400 }
      );
    }

    // Check if invite is expired
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (now > expiresAt) {
      // Update invite status to expired
      await supabase
        .from('project_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);

      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 400 }
      );
    }

    // Get current user's email to verify it matches the invite
    // First try to get from auth.users (OAuth users and Magic Link users)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let userEmail = user?.email;

    console.log('🔍 Auth user check:', {
      hasUser: !!user,
      userEmail: user?.email,
      userId: userId,
      error: userError?.message,
      userObject: user ? {
        id: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role
      } : null
    });

    // If we have a userId but no user from auth, try to get user directly from auth.users table
    if (!userEmail && userId) {
      console.log('🔍 Trying direct auth.users lookup for userId:', userId);
      try {
        // Create a service role client to access auth.users
        const serviceSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
                  // Ignore
                }
              },
            },
          }
        );
        
        // Use the admin API to get user by ID
        const { data: authUser, error: authUserError } = await serviceSupabase.auth.admin.getUserById(userId);
        
        if (authUser && !authUserError) {
          userEmail = authUser.user.email;
          console.log('🔍 Found user email via admin.getUserById:', userEmail);
        } else {
          console.log('🔍 Admin getUserById failed:', authUserError);
        }
      } catch (error) {
        console.log('🔍 Error in admin getUserById lookup:', error);
      }
    }

    // If not found in auth.users, try to get from public.users (email/password users)
    if (!userEmail && userId) {
      console.log('🔍 User not found in auth.users, checking public.users for userId:', userId);
      const { data: publicUser, error: publicUserError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (publicUser && !publicUserError) {
        userEmail = publicUser.email;
        console.log('🔍 Found user email in public.users:', userEmail);
      } else {
        console.log('🔍 Error fetching from public.users:', publicUserError);
      }
    }

    if (!userEmail) {
      console.log('❌ Could not find user email in either auth.users or public.users');
      console.log('🔍 Debug info:', {
        userId,
        hasAuthUser: !!user,
        authUserEmail: user?.email,
        authError: userError?.message
      });
      return NextResponse.json(
        { error: 'Unable to verify user identity' },
        { status: 500 }
      );
    }

    // Debug: Log the email comparison
    console.log('🔍 Email verification:', {
      userEmail: userEmail,
      inviteEmail: invite.email,
      userEmailLower: userEmail.toLowerCase(),
      inviteEmailLower: invite.email.toLowerCase(),
      match: userEmail.toLowerCase() === invite.email.toLowerCase()
    });

    // Verify email matches (case-insensitive)
    if (userEmail.toLowerCase() !== invite.email.toLowerCase()) {
      console.log('❌ Email mismatch detected:', {
        userEmail: userEmail,
        inviteEmail: invite.email,
        token: token
      });
      return NextResponse.json(
        { error: 'This invite was sent to a different email address' },
        { status: 403 }
      );
    }

    // Check if user is already a member of this project
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', invite.project_id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      // Update invite status to accepted even if already a member
      await supabase
        .from('project_invites')
        .update({ 
          status: 'accepted',
          accepted_at: now.toISOString()
        })
        .eq('id', invite.id);

      return NextResponse.json({
        ok: true,
        projectId: invite.project_id,
        message: 'You are already a member of this project'
      });
    }

    // Create project membership
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .insert({
        project_id: invite.project_id,
        user_id: userId,
        role: invite.role
      })
      .select()
      .single();

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      return NextResponse.json(
        { error: 'Failed to join project' },
        { status: 500 }
      );
    }

    // Update invite status to accepted
    const { error: updateError } = await supabase
      .from('project_invites')
      .update({ 
        status: 'accepted',
        accepted_at: now.toISOString()
      })
      .eq('id', invite.id);

    if (updateError) {
      console.error('Error updating invite status:', updateError);
      // Don't fail the request since membership was created successfully
    }

    // Get project name for response using service role client
    console.log('🔍 Fetching project name for project_id:', invite.project_id);
    let projectName = 'Unknown Project';
    
    try {
      const serviceSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
                // Ignore
              }
            },
          },
        }
      );
      
      const { data: project, error: projectError } = await serviceSupabase
        .from('projects')
        .select('name')
        .eq('id', invite.project_id)
        .single();
      
      if (project && !projectError) {
        projectName = project.name;
        console.log('🔍 Found project name:', projectName);
      } else {
        console.log('🔍 Error fetching project name:', projectError);
      }
    } catch (error) {
      console.log('🔍 Error in project name lookup:', error);
    }

    return NextResponse.json({
      ok: true,
      projectId: invite.project_id,
      projectName: projectName,
      role: invite.role,
      message: `Successfully joined ${projectName}!`
    });

  } catch (error) {
    console.error('Error in POST /api/invites/accept:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
