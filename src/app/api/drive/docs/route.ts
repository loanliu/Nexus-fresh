import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Helper function to get OAuth2 client from Supabase user session
async function getGoogleOAuth2Client(request: NextRequest) {
  console.log(' Starting getGoogleOAuth2Client...');
  
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Try session first, then fallback to Authorization header
  let userEmail: string;
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (user?.email) {
      userEmail = user.email;
      console.log('✅ Using email from session:', userEmail);
    } else {
      throw new Error('No session user');
    }
  } catch (sessionError) {
    console.log('🔍 Session failed, trying Authorization header...');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('No authentication found');
    }
    
    // Get user ID from header and look up email
    const userId = authHeader.replace('Bearer ', '');
    console.log(' Using user ID from header:', userId);
    
    // For now, skip complex user lookup and just return test data
    throw new Error('Authorization header method needs implementation');
  }

  console.log(' Looking for Google tokens for user email:', userEmail);
  
  // Get the user's Google access token from the database
  const { data: tokenData, error: tokenError } = await supabase
    .from('google_access_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_email', userEmail)
    .single();

  console.log('🔍 Token lookup result:', { 
    hasToken: !!tokenData?.access_token, 
    tokenError: tokenError?.message,
    tokenData: tokenData ? { 
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresAt: tokenData.expires_at
    } : null
  });

  if (tokenError || !tokenData?.access_token) {
    console.log('❌ Token not found or error:', tokenError?.message);
    throw new Error('Google access token not found - please re-authenticate with Google');
  }

  console.log('✅ Token found successfully, creating OAuth2 client...');

  // Check if token is expired
  if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
    console.log('❌ Token expired:', tokenData.expires_at);
    throw new Error('Google access token expired - please re-authenticate with Google');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token
  });
  
  console.log('✅ OAuth2 client created successfully');
  return oauth2Client;
}

// Helper function to filter documents based on requirements
function filterDocuments(files: any[]) {
  return files.filter(file => {
    // Exclude videos, audio, and binary files
    const excludedMimeTypes = [
      'video/',
      'audio/',
      'image/',
      'application/octet-stream',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    const isExcluded = excludedMimeTypes.some(type => 
      file.mimeType.startsWith(type)
    );
    
    if (isExcluded) return false;
    
    // Include Google Docs, Sheets, Presentations, and PDFs
    const allowedTypes = [
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.google-apps.presentation',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.mimeType)) return false;
    
    // Exclude files created before January 2020
    const createdDate = new Date(file.createdTime);
    const cutoffDate = new Date('2020-01-01T00:00:00Z');
    
    return createdDate >= cutoffDate;
  });
}

// Helper function to format file size
function formatFileSize(bytes: string): string {
  const size = parseInt(bytes);
  if (size === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  
  return parseFloat((size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper function to get folder path
async function getFolderPath(drive: any, folderId: string): Promise<string> {
  try {
    const response = await drive.files.get({
      fileId: folderId,
      fields: 'name,parents'
    });
    
    const folder = response.data;
    if (folder.parents && folder.parents.length > 0) {
      const parentPath = await getFolderPath(drive, folder.parents[0]);
      return parentPath ? `${parentPath} > ${folder.name}` : folder.name;
    }
    return folder.name;
  } catch (error) {
    console.error('Error getting folder path:', error);
    return '';
  }
}

// Main API route handler
export async function GET(request: NextRequest) {
  console.log('🚀 GET /api/drive/docs called');
  
  try {
    // Get OAuth2 client
    const oauth2Client = await getGoogleOAuth2Client(request);
    console.log('✅ OAuth2 client obtained');

    // Create Google Drive API client
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    console.log('✅ Google Drive client created');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const pageToken = searchParams.get('pageToken') || '';
    const query = searchParams.get('q') || '';

    console.log('🔍 Query parameters:', { pageSize, pageToken: !!pageToken, query });

    // Build search query
    let searchQuery = '';
    if (query) {
      searchQuery = `fullText contains '${query}'`;
    }

    // Get files from Google Drive
    const response = await drive.files.list({
      pageSize,
      pageToken: pageToken || undefined,
      q: searchQuery,
      fields: 'nextPageToken, files(id, name, mimeType, description, webViewLink, createdTime, modifiedTime, size, parents)',
      orderBy: 'modifiedTime desc'
    });

    console.log('✅ Google Drive API response received:', { 
      fileCount: response.data.files?.length || 0,
      hasNextPage: !!response.data.nextPageToken
    });

    if (!response.data.files) {
      console.log('⚠️ No files returned from Google Drive');
      return NextResponse.json({ documents: [], nextPageToken: null });
    }

    // Filter and process files
    const filteredFiles = filterDocuments(response.data.files);
    console.log('🔍 Files after filtering:', { 
      originalCount: response.data.files.length,
      filteredCount: filteredFiles.length
    });

    // Get folder paths for files
    const documentsWithPaths = await Promise.all(
      filteredFiles.map(async (file) => {
        let folderPath = '';
        if (file.parents && file.parents.length > 0) {
          folderPath = await getFolderPath(drive, file.parents[0]);
        }

        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          description: file.description || '',
          webViewLink: file.webViewLink || '',
          folderPath,
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime,
          size: file.size ? formatFileSize(file.size) : 'Unknown'
        };
      })
    );

    console.log('✅ Documents processed successfully');

    return NextResponse.json({
      documents: documentsWithPaths,
      nextPageToken: response.data.nextPageToken || null
    });

  } catch (error) {
    console.error('❌ Error in GET /api/drive/docs:', error);
    
    let errorMessage = 'Failed to load documents';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        errorMessage = 'Authentication required - Please sign in with Google to access your Drive documents';
        statusCode = 401;
      } else if (error.message.includes('Google access token not found')) {
        errorMessage = 'Google access token not found - please re-authenticate with Google';
        statusCode = 401;
      } else if (error.message.includes('token expired')) {
        errorMessage = 'Google access token expired - please re-authenticate with Google';
        statusCode = 401;
      } else if (error.message.includes('Authorization header method needs implementation')) {
        errorMessage = 'Please refresh and try again - using Authorization header method';
        statusCode = 401;
      } else {
        errorMessage = error.message;
      }
    }

    console.log('❌ Returning error response:', { statusCode, errorMessage });
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}