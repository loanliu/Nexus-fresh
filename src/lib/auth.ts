import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * Get the authenticated user ID from the request
 * @param req - NextRequest object
 * @returns Promise<string | null> - User ID or null if not authenticated
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    console.log('🔍 Creating Supabase client...');
    const cookieStore = await cookies();
    
    // Debug: Log all cookies
    const allCookies = cookieStore.getAll();
    console.log('🍪 All cookies found:', allCookies.length);
    allCookies.forEach(cookie => {
      console.log(`🍪 Cookie: ${cookie.name} = ${cookie.value.substring(0, 50)}...`);
    });
    
    // Check for Supabase auth cookies specifically
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('sb-') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth')
    );
    console.log('🔐 Auth-related cookies:', authCookies.length);
    authCookies.forEach(cookie => {
      console.log(`🔐 Auth Cookie: ${cookie.name} = ${cookie.value.substring(0, 50)}...`);
    });
    
    // Note: We'll still try to get the session even if no auth cookies are found
    // because the session might be available through other means
    
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
    
    // Get the current user session
    console.log('🔍 Getting session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth error:', error);
      return null;
    }
    
    console.log('🔍 Session data:', { 
      session: !!session, 
      user: !!session?.user,
      sessionId: session?.access_token?.substring(0, 20) + '...',
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session || !session.user) {
      console.log('❌ No session or user found');
      return null;
    }
    
    // Check if the session is expired
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      console.log('❌ Session expired');
      return null;
    }
    
    console.log('✅ User ID found:', session.user.id);
    return session.user.id;
  } catch (error) {
    console.error('❌ Error getting user ID:', error);
    return null;
  }
}

/**
 * Get the authenticated user with full session data
 * @param req - NextRequest object
 * @returns Promise<{ user: any; session: any } | null>
 */
export async function getUserSession(req: NextRequest): Promise<{ user: any; session: any } | null> {
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
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth error:', error);
      return null;
    }
    
    if (!session || !session.user) {
      return null;
    }
    
    return { user: session.user, session };
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

/**
 * Check if user has required role for a project
 * @param userId - User ID
 * @param projectId - Project ID
 * @param requiredRoles - Array of allowed roles
 * @returns Promise<boolean>
 */
export async function hasProjectRole(
  userId: string, 
  projectId: string, 
  requiredRoles: string[]
): Promise<boolean> {
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
    
    const { data, error } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId);
    
    console.log('🔍 Project role check:', {
      projectId,
      userId,
      data,
      error: error?.message,
      requiredRoles
    });
    
    if (error) {
      console.log('❌ Error querying project membership:', error?.message);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ No project membership found');
      return false;
    }
    
    if (data.length > 1) {
      console.log('⚠️ Multiple project memberships found, using the first one');
    }
    
    const userRole = data[0].role;
    const hasRole = requiredRoles.includes(userRole);
    console.log('🔍 Role check result:', {
      userRole,
      requiredRoles,
      hasRole
    });
    
    return hasRole;
  } catch (error) {
    console.error('Error checking project role:', error);
    return false;
  }
}
