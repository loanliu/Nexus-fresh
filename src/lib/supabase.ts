import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single, shared Supabase client instance
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Auth helpers
export const { auth } = supabase;

// Database helpers
export const { from } = supabase;

// Storage helpers
export const { storage } = supabase;

// Functions helpers
export const { functions } = supabase;

// Helper function to get user
export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to get session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session;
};

// Helper function to get user ID
export const getUserId = async () => {
  const user = await getUser();
  return user?.id;
};

// Helper function to get user email
export const getUserEmail = async () => {
  const user = await getUser();
  return user?.email;
};

// Helper function to get user profile
export const getUserProfile = async () => {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

// Helper function to update user profile
export const updateUserProfile = async (updates: Partial<Database['public']['Tables']['users']['Update']>) => {
  const userId = await getUserId();
  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Helper function to upload file
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string;
    upsert?: boolean;
  }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, options);

  if (error) throw error;
  return data;
};

// Helper function to get file URL
export const getFileUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

// Helper function to delete file
export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
};

// Helper function to list files in bucket
export const listFiles = async (bucket: string, path?: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path);

  if (error) throw error;
  return data;
};

// Helper function to call edge function
export const callEdgeFunction = async (
  name: string,
  body?: any,
  options?: {
    headers?: Record<string, string>;
  }
) => {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
    ...options,
  });

  if (error) throw error;
  return data;
};

// Export types for use in other files
export type { Database } from '@/types/supabase';
export type { User, Session } from '@supabase/supabase-js';
