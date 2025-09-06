import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * Get the authenticated user ID from the request using a more robust method
 * @param req - NextRequest object
 * @returns Promise<string | null> - User ID or null if not authenticated
 */
export async function getServerUserId(req: NextRequest): Promise<string | null> {
  try {
    console.log('🔍 Server auth - Getting user ID...');
    
    // First, try to get the user from the Authorization header (if present)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('🔍 Found Bearer token in Authorization header');
      
      // Create a client with the token
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
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
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        console.log('✅ User found via Authorization header:', user.id);
        return user.id;
      } else {
        console.log('❌ Error getting user via Authorization header:', error?.message);
      }
    }
    
    // Fallback to cookie-based authentication
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('🍪 Server auth - All cookies found:', allCookies.length);
    allCookies.forEach(cookie => {
      console.log(`🍪 Server auth - Cookie: ${cookie.name} = ${cookie.value.substring(0, 50)}...`);
    });
    
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
      console.error('❌ Server auth error:', error);
      return null;
    }
    
    console.log('🔍 Server auth - Session data:', { 
      session: !!session, 
      user: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session || !session.user) {
      console.log('❌ No session or user found in server auth');
      return null;
    }
    
    // Check if the session is expired
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      console.log('❌ Session expired in server auth');
      return null;
    }
    
    console.log('✅ Server auth - User ID found:', session.user.id);
    return session.user.id;
  } catch (error) {
    console.error('❌ Error in server auth:', error);
    return null;
  }
}

/**
 * Get the authenticated user with full session data
 * @param req - NextRequest object
 * @returns Promise<{ user: any; session: any } | null>
 */
export async function getServerUserSession(req: NextRequest): Promise<{ user: any; session: any } | null> {
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
      console.error('Server auth error:', error);
      return null;
    }
    
    if (!session || !session.user) {
      return null;
    }
    
    return { user: session.user, session };
  } catch (error) {
    console.error('Error getting server user session:', error);
    return null;
  }
}
