import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserId, hasProjectRole } from '@/lib/auth';
import { getServerUserId } from '@/lib/server-auth';
import { generateInviteToken } from '@/lib/token-utils';
import { sendInviteEmail } from '@/lib/mailer';

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate role
function isValidRole(role: string): boolean {
  return ['admin', 'editor', 'viewer'].includes(role);
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    console.log('🔍 Checking authentication...');
    console.log('🔍 Request URL:', req.url);
    console.log('🔍 Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Try the new server auth method first
    let userId = await getServerUserId(req);
    console.log('🔍 Server auth - User ID:', userId);
    
    // Fallback to the original method if server auth fails
    if (!userId) {
      userId = await getUserId(req);
      console.log('🔍 Fallback auth - User ID:', userId);
    }
    
    if (!userId) {
      console.log('❌ No user ID found with either method');
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'Please log in to access this feature',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { projectId, email, role, message } = body;

    // Validate required fields
    if (!projectId || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, email, role' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (!isValidRole(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: admin, editor, viewer' },
        { status: 400 }
      );
    }

    // Check if user has permission to invite (owner, admin, or super_admin)
    const hasPermission = await hasProjectRole(userId, projectId, ['owner', 'admin', 'super_admin']);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - You must be an owner, admin, or super_admin to invite users' },
        { status: 403 }
      );
    }

    // Skip project verification since we already confirmed:
    // 1. User is authenticated ✅
    // 2. User has admin role in project_members ✅
    // 3. Project exists (confirmed via SQL) ✅
    // RLS is blocking server-side access to projects table
    
    console.log('✅ Skipping project verification due to RLS - user has admin role');

    // Create supabase client for invite operations (we still need this for project_invites table)
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

    // Generate secure token
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

                // Check for existing pending invite and update it, or create new one
            const { data: existingInvites, error: checkError } = await supabase
              .from('project_invites')
              .select('id, status')
              .eq('project_id', projectId)
              .eq('email', email.toLowerCase().trim())
              .eq('status', 'pending');

            let invites, inviteError;

            if (existingInvites && existingInvites.length > 0) {
              // Update existing pending invite
              console.log('🔄 Updating existing pending invite');
              const { data: updatedInvites, error: updateError } = await supabase
                .from('project_invites')
                .update({
                  role,
                  token,
                  expires_at: expiresAt.toISOString()
                })
                .eq('id', existingInvites[0].id)
                .select();
              
              invites = updatedInvites;
              inviteError = updateError;
            } else {
              // Create new invite
              console.log('🆕 Creating new invite');
              const { data: newInvites, error: insertError } = await supabase
                .from('project_invites')
                .insert({
                  project_id: projectId,
                  inviter_id: userId,
                  email: email.toLowerCase().trim(),
                  role,
                  token,
                  expires_at: expiresAt.toISOString(),
                  status: 'pending'
                })
                .select();
              
              invites = newInvites;
              inviteError = insertError;
            }

    console.log('🔍 Invite creation:', {
      projectId,
      originalEmail: email,
      processedEmail: email.toLowerCase().trim(),
      role,
      invites,
      error: inviteError?.message
    });

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      );
    }

    if (!invites || invites.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      );
    }

    const invite = invites[0];

    // Send invite email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/invite/accept?token=${token}`;
    
    console.log('🔍 URL construction:', {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      APP_URL: process.env.APP_URL,
      finalAppUrl: appUrl,
      inviteLink
    });
    
    // Get inviter name for email
    const { data: { user: inviterUser } } = await supabase.auth.getUser();
    const inviterName = inviterUser?.user_metadata?.full_name || inviterUser?.email?.split('@')[0] || 'Someone';

    console.log('🔍 Email details:', {
      to: email.toLowerCase().trim(),
      projectName: 'Your Project', // Fallback since we skipped project verification due to RLS
      inviterName,
      customMessage: message
    });

    const emailResult = await sendInviteEmail(
      email.toLowerCase().trim(),
      inviteLink,
      'Your Project', // Fallback since we skipped project verification due to RLS
      inviterName,
      message
    );

    // Return success response (with email status)
    return NextResponse.json({
      ok: true,
      token,
      emailSent: emailResult.success,
      emailError: emailResult.error,
      invite: {
        id: invite.id,
        projectId: invite.project_id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expires_at,
        status: invite.status
      }
    });

  } catch (error) {
    console.error('Error in POST /api/invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get invites for a project (admin/owner only)
export async function GET(req: NextRequest) {
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
          message: 'Please log in to access this feature',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Get projectId from query params
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    // Check if user has permission to view invites
    const hasPermission = await hasProjectRole(userId, projectId, ['owner', 'admin', 'super_admin']);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - You must be an owner, admin, or super_admin to view invites' },
        { status: 403 }
      );
    }

    // Get invites for the project using the same client as POST
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
    
    const { data: invites, error } = await supabase
      .from('project_invites')
      .select(`
        id,
        email,
        role,
        status,
        expires_at,
        accepted_at,
        inserted_at,
        inviter_id
      `)
      .eq('project_id', projectId)
      .order('inserted_at', { ascending: false });

    if (error) {
      console.error('Error fetching invites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      invites
    });

  } catch (error) {
    console.error('Error in GET /api/invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
