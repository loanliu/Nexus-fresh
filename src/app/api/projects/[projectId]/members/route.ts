import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserId, hasProjectRole } from '@/lib/auth';
import { getServerUserId } from '@/lib/server-auth';

// GET /api/projects/[projectId]/members - List project members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    // Check authentication
    let userId = await getServerUserId(req);
    if (!userId) {
      userId = await getUserId(req);
    }
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'Please log in to access this feature',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Check if user is a member of the project
    const isMember = await hasProjectRole(userId, projectId, ['owner', 'admin', 'super_admin', 'editor', 'viewer']);
    if (!isMember) {
      return NextResponse.json(
        { error: 'Forbidden - You must be a member to view project members' },
        { status: 403 }
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

    // Get project members first
    const { data: membersData, error: membersError } = await supabase
      .from('project_members')
      .select(`
        project_id,
        user_id,
        role,
        joined_at
      `)
      .eq('project_id', projectId)
      .order('joined_at', { ascending: true });

    if (membersError) {
      console.error('Error fetching members:', membersError);
      // Return empty array instead of error - this allows invite functionality to work
      return NextResponse.json({
        ok: true,
        members: []
      });
    }

    // If no members found, return empty array
    if (!membersData || membersData.length === 0) {
      return NextResponse.json({
        ok: true,
        members: []
      });
    }

    // Extract user info from JWT token for the current user
    let currentUserEmail = 'Unknown';
    let currentUserName = 'Unknown';
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        // Decode JWT payload (base64 decode the middle part)
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserEmail = payload.email || 'Unknown';
        currentUserName = payload.user_metadata?.full_name || payload.user_metadata?.name || payload.email || 'Unknown';
        console.log('🔍 JWT payload:', { email: currentUserEmail, name: currentUserName });
      }
    } catch (error) {
      console.log('🔍 Error decoding JWT:', error);
    }

    // Helper function to get user data by ID
    const getUserData = async (userId: string) => {
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
          return {
            email: authUser.user.email,
            full_name: authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || null
          };
        } else {
          console.log('🔍 Admin getUserById failed:', authUserError);
          
          // Fallback: try to get from public.users table
          const { data: publicUser, error: publicUserError } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single();
          
          if (publicUser && !publicUserError) {
            return {
              email: publicUser.email,
              full_name: publicUser.full_name
            };
          }
        }
      } catch (error) {
        console.log('🔍 Error in getUserData lookup:', error);
      }
      
      return {
        email: 'Unknown',
        full_name: null
      };
    };

    // Create members with proper user info - FIXED VERSION
    const members = await Promise.all(membersData.map(async (member) => {
      console.log('🔍 Member data:', {
        user_id: member.user_id,
        role: member.role
      });

      // If this is the current user, use their actual info from JWT
      const isCurrentUser = member.user_id === userId;
      
      if (isCurrentUser) {
        return {
          ...member,
          user: {
            email: currentUserEmail,
            full_name: currentUserName
          }
        };
      } else {
        // For other users, fetch their real data from the database
        const userData = await getUserData(member.user_id);
        return {
          ...member,
          user: {
            email: userData.email,
            full_name: userData.full_name
          }
        };
      }
    }));


    // Transform the data to include user details
    const transformedMembers = members?.map(member => ({
      id: `${member.project_id}-${member.user_id}`, // Create a composite ID
      project_id: member.project_id,
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      user: {
        email: member.user?.email || 'Unknown',
        full_name: member.user?.full_name || null
      }
    })) || [];

    return NextResponse.json({
      ok: true,
      members: transformedMembers
    });

  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId]/members - Update member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    // Check authentication
    let userId = await getServerUserId(req);
    if (!userId) {
      userId = await getUserId(req);
    }
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'Please log in to access this feature',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Check if user has admin/owner permissions
    const hasPermission = await hasProjectRole(userId, projectId, ['owner', 'admin', 'super_admin']);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - You must be an owner or admin to manage members' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { userId: targetUserId, role } = body;

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, role' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: owner, admin, editor, viewer' },
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

    // Check if target user is a member
    const { data: targetMember, error: memberError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', targetUserId)
      .single();

    if (memberError || !targetMember) {
      return NextResponse.json(
        { error: 'User is not a member of this project' },
        { status: 404 }
      );
    }

    // Prevent demoting the only owner
    if (targetMember.role === 'owner' && role !== 'owner') {
      const { data: ownerCount } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('role', 'owner');

      if (ownerCount && ownerCount.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last owner of the project' },
          { status: 400 }
        );
      }
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', targetUserId)
      .select(`
        id,
        user_id,
        role,
        joined_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating member role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }

    // Helper function to get user data by ID (same as in GET method)
    const getUserData = async (userId: string) => {
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
          return {
            email: authUser.user.email,
            full_name: authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || null
          };
        } else {
          console.log('🔍 Admin getUserById failed:', authUserError);
          
          // Fallback: try to get from public.users table
          const { data: publicUser, error: publicUserError } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single();
          
          if (publicUser && !publicUserError) {
            return {
              email: publicUser.email,
              full_name: publicUser.full_name
            };
          }
        }
      } catch (error) {
        console.log('🔍 Error in getUserData lookup:', error);
      }
      
      return {
        email: 'Unknown',
        full_name: null
      };
    };

    // Get user data for the updated member
    const userData = await getUserData(targetUserId);

    // Transform the response
    const transformedMember = {
      id: updatedMember.id,
      user_id: updatedMember.user_id,
      role: updatedMember.role,
      joined_at: updatedMember.joined_at,
      user: {
        email: userData.email,
        full_name: userData.full_name
      }
    };

    return NextResponse.json({
      ok: true,
      member: transformedMember,
      message: 'Member role updated successfully'
    });

  } catch (error) {
    console.error('Error in PATCH /api/projects/[projectId]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/members - Remove member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    // Check authentication
    let userId = await getServerUserId(req);
    if (!userId) {
      userId = await getUserId(req);
    }
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'Please log in to access this feature',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Check if user has admin/owner permissions
    const hasPermission = await hasProjectRole(userId, projectId, ['owner', 'admin', 'super_admin']);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - You must be an owner or admin to remove members' },
        { status: 403 }
      );
    }

    // Get target user ID from query params
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
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

    // Check if target user is a member and get their role
    const { data: targetMember, error: memberError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', targetUserId)
      .single();

    if (memberError || !targetMember) {
      return NextResponse.json(
        { error: 'User is not a member of this project' },
        { status: 404 }
      );
    }

    // Prevent removing the last owner
    if (targetMember.role === 'owner') {
      const { data: ownerCount } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('role', 'owner');

      if (ownerCount && ownerCount.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the project' },
          { status: 400 }
        );
      }
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', targetUserId);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/projects/[projectId]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
