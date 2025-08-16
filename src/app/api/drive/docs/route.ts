import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Helper function to get OAuth2 client from cookies
function getGoogleOAuth2Client(request: NextRequest) {
  const cookies = request.cookies;
  const accessToken = cookies.get('google_access_token')?.value;
  
  if (!accessToken) {
    throw new Error('Authentication required - no access token found');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  
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
        return `${parentPath} > ${folder.name}`;
      }
      return folder.name;
    } catch (error) {
      return 'Unknown Folder';
    }
  }

export async function GET(request: NextRequest) {
  try {
    console.log('=== Google Drive API called ===');
    
    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || '50'); // Default to 50 documents per page
    const pageToken = searchParams.get('pageToken') || undefined;
    
    console.log('Pagination params:', { pageSize, pageToken });
    
    // Check if user is authenticated
    let auth;
    try {
      auth = getGoogleOAuth2Client(request);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please sign in with Google to access your Drive documents'
        },
        { status: 401 }
      );
    }
    
    // Initialize Google Drive API
    const drive = google.drive({ version: 'v3', auth });
    
    // Build query to get documents with filters
    const query = [
      "trashed = false",
      "(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf')",
      "createdTime > '2020-01-01T00:00:00'"
    ].join(' and ');
    
    console.log('Drive query:', query);
    
    // Fetch files from Drive with pagination
    const driveParams: any = {
      q: query,
      pageSize: Math.min(pageSize, 100), // Google Drive API max is 1000, but we'll limit to 100 for performance
      fields: 'nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,parents)',
      orderBy: 'createdTime desc'
    };
    
    if (pageToken) {
      driveParams.pageToken = pageToken;
    }
    
    const response = await drive.files.list(driveParams);
    
    const files = response.data.files || [];
    console.log(`Found ${files.length} files in Drive`);
    
    // Apply additional filtering
    const filteredFiles = filterDocuments(files);
    console.log(`After filtering: ${filteredFiles.length} files`);
    

   // Format documents for frontend
   const documents = await Promise.all(filteredFiles.map(async (file) => {
    let folderPath = 'Root';
    if (file.parents && file.parents.length > 0) {
      folderPath = await getFolderPath(drive, file.parents[0]);
    }
    
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      size: formatFileSize(file.size || '0'),
      webViewLink: file.webViewLink,
      folderPath,  // Add this line
      content: `Google ${file.mimeType.includes('document') ? 'Document' : file.mimeType.includes('spreadsheet') ? 'Spreadsheet' : 'Presentation'} created on ${new Date(file.createdTime).toLocaleDateString()}`
    };
  }));    
    
    return NextResponse.json({
      success: true,
      documents,
      total: documents.length,
      nextPageToken: response.data.nextPageToken || null,
      hasMore: !!response.data.nextPageToken,
      pageSize: driveParams.pageSize,
      message: `Successfully loaded ${documents.length} documents from Google Drive`
    });
    
  } catch (error) {
    console.error('=== Error in Google Drive API ===');
    console.error('Error:', error);
    
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please sign in with Google to access your Drive documents'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch documents from Google Drive',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Google Drive Search API called ===');
    
    const body = await request.json();
    const { query, includeContent = false, pageSize = 20, pageToken } = body;
    
    // Check if user is authenticated
    let auth;
    try {
      auth = getGoogleOAuth2Client(request);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please sign in with Google to access your Drive documents'
        },
        { status: 401 }
      );
    }
    
    // Initialize Google Drive API
    const drive = google.drive({ version: 'v3', auth });
    
    // Build search query
    let searchQuery = '';
    if (query && query.trim()) {
      searchQuery = `fullText contains '${query.trim()}'`;
    }
    
    // Base filters
    const baseFilters = [
      "trashed = false",
      "(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf')",
      "createdTime > '2020-01-01T00:00:00'"
    ];
    
    // Combine search with filters
    let finalQuery = baseFilters.join(' and ');
    if (searchQuery) {
      finalQuery = `(${searchQuery}) and ${finalQuery}`;
    }
    
    console.log('Search query:', finalQuery);
    
    // Search files in Drive with pagination
    const searchParams: any = {
      q: finalQuery,
      pageSize: Math.min(pageSize, 100),
      fields: 'nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,parents)'
    };
    
    // Google Drive API doesn't allow sorting with fullText searches
    // Only add orderBy if we're not doing a fullText search
    if (!searchQuery) {
      searchParams.orderBy = 'createdTime desc';
    }
    
    if (pageToken) {
      searchParams.pageToken = pageToken;
    }
    
    const response = await drive.files.list(searchParams);
    
    const files = response.data.files || [];
    console.log(`Search found ${files.length} files`);
    
    // Apply additional filtering
    const filteredFiles = filterDocuments(files);
    console.log(`After filtering: ${filteredFiles.length} files`);
    
    // Format documents for frontend and fetch folder paths
    const documents = await Promise.all(filteredFiles.map(async (file) => {
      let folderPath = 'Root';
      if (file.parents && file.parents.length > 0) {
        folderPath = await getFolderPath(drive, file.parents[0]);
      }
      
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        size: formatFileSize(file.size || '0'),
        webViewLink: file.webViewLink,
        folderPath,
        content: `Google ${file.mimeType.includes('document') ? 'Document' : file.mimeType.includes('spreadsheet') ? 'Spreadsheet' : 'Presentation'} containing "${query}" - created on ${new Date(file.createdTime).toLocaleDateString()}`
      };
    }));
    
    return NextResponse.json({
      success: true,
      documents,
      total: documents.length,
      nextPageToken: response.data.nextPageToken || null,
      hasMore: !!response.data.nextPageToken,
      pageSize: searchParams.pageSize,
      query: query || '',
      message: `Search completed: found ${documents.length} documents`
    });
    
  } catch (error) {
    console.error('=== Error in Google Drive Search API ===');
    console.error('Error:', error);
    
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please sign in with Google to access your Drive documents'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
