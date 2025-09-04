import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient as createSupabaseServerClient } from '@supabase/supabase-js';

type GoogleTokenRow = {
  user_id?: string | null;
  user_email?: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null; // ISO
  scope?: string | null;
  token_type?: string | null;
  updated_at?: string | null;
};

/** Resolve the caller to a Supabase user via (1) SSR cookie or (2) Authorization: Bearer <supabase_access_token>  */
async function resolveSupabaseUser(req: NextRequest) {
  const sbSsr = createRouteHandlerClient({ cookies });

  // Try SSR cookie session
  let { data: { user } } = await sbSsr.auth.getUser();
  if (user) return { userId: user.id, email: user.email ?? null };

  // Fallback: Authorization header contains a Supabase access token (NOT a user id)
  const authHeader = req.headers.get('authorization') || '';
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new Error('No Supabase session and no Authorization Bearer token found');

  const supabaseJwt = m[1];

  // Use admin client to resolve JWT -> user
  const admin = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
  );
  const { data: gotUser, error: userErr } = await admin.auth.getUser(supabaseJwt);
  if (userErr || !gotUser?.user) {
    throw new Error('Invalid Supabase access token in Authorization header');
  }
  return { userId: gotUser.user.id, email: gotUser.user.email ?? null };
}

/** Load Google tokens for user; supports either user_id (preferred) or user_email (legacy) */
async function loadGoogleTokens(userId: string, email: string | null) {
  const admin = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Prefer user_id if your table has it
  let { data: row, error } = await admin
    .from('google_access_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<GoogleTokenRow>();

  if ((!row || !row.access_token) && email) {
    // Fallback by email for legacy rows
    const r2 = await admin
      .from('google_access_tokens')
      .select('*')
      .eq('user_email', email)
      .maybeSingle<GoogleTokenRow>();
    row = r2.data ?? null;
    error = r2.error ?? error;
  }

  if (error || !row) throw new Error('Google Drive not connected for this account');
  return { row, admin };
}

/** Refresh Google access token and persist new expiry */
async function refreshGoogleAccessToken(
  adminClient: any, // Fix: Simplified type to avoid complex Supabase type issues
  userId: string,
  refreshToken: string
) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google refresh_token exchange failed: ${text}`);
  }
  const tok = await res.json() as {
    access_token: string;
    expires_in: number;
    scope?: string;
    token_type?: string;
  };

  const expiresAtIso = new Date(Date.now() + tok.expires_in * 1000).toISOString();

  // Update by user_id if present; else update by refresh_token owner (email path)
  const update = {
    access_token: tok.access_token,
    expires_at: expiresAtIso,
    scope: tok.scope,
    token_type: tok.token_type ?? 'Bearer',
    updated_at: new Date().toISOString(),
  };

  // Try update by user_id first; if zero rows updated, fall back to not filtering (shouldn’t happen if table keyed)
  let { error: upErr, count } = await adminClient
    .from('google_access_tokens')
    .update(update, { count: 'exact' })
    .eq('user_id', userId);

  if (upErr) throw upErr;
  return { accessToken: tok.access_token, expiresAtIso };
}

/** Build an OAuth2 client that is ready to call Drive (auto-refresh handled above) */
async function getGoogleOAuth2Client(req: NextRequest) {
  const { userId, email } = await resolveSupabaseUser(req);

  const { row, admin } = await loadGoogleTokens(userId, email);

  let accessToken = row.access_token || '';
  const refreshToken = row.refresh_token || null;
  const expiresAtMs = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const needsRefresh =
    (!accessToken) ||
    (!!refreshToken && !!expiresAtMs && expiresAtMs <= Date.now() + 15_000);

  if (needsRefresh) {
    if (!refreshToken) {
      throw new Error('No Google refresh_token stored; reconnect with prompt=consent + offline');
    }
    const refreshed = await refreshGoogleAccessToken(admin, userId, refreshToken);
    accessToken = refreshed.accessToken;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // not used here, but fine to keep
  );
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
  });
  return oauth2Client;
}

// ---- Your existing helpers (kept) ----
function filterDocuments(files: any[]) {
  return files.filter(file => {
    const excludedMimeTypes = [
      'video/',
      'audio/',
      'image/',
      'application/octet-stream',
      'application/zip',
      'application/x-rar-compressed',
    ];
    if (excludedMimeTypes.some(type => file.mimeType?.startsWith(type))) return false;

    const allowedTypes = [
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.google-apps.presentation',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.mimeType)) return false;

    const createdDate = new Date(file.createdTime);
    const cutoffDate = new Date('2020-01-01T00:00:00Z');
    return createdDate >= cutoffDate;
  });
}

function formatFileSize(bytes: string): string {
  const size = parseInt(bytes);
  if (!Number.isFinite(size) || size <= 0) return 'Unknown';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(size) / Math.log(k)));
  return parseFloat((size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function getFolderPath(drive: any, folderId: string): Promise<string> {
  try {
    const res = await drive.files.get({ fileId: folderId, fields: 'name,parents' });
    const folder = res.data;
    if (folder.parents?.length) {
      const parent = await getFolderPath(drive, folder.parents[0]);
      return parent ? `${parent} > ${folder.name}` : folder.name;
    }
    return folder.name;
  } catch {
    return '';
  }
}

// ---- Route handler ----
export async function GET(request: NextRequest) {
  console.log('🚀 GET /api/drive/docs called');
  try {
    const oauth2Client = await getGoogleOAuth2Client(request);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const pageToken = searchParams.get('pageToken') || undefined;
    const query = searchParams.get('q') || '';

    const q = query ? `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false` : 'trashed = false';

    const resp = await drive.files.list({
      pageSize,
      pageToken,
      q,
      fields: 'nextPageToken, files(id,name,mimeType,description,webViewLink,createdTime,modifiedTime,size,parents)',
      orderBy: 'modifiedTime desc',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'user',
    });

    const files = resp.data.files ?? [];
    const filtered = filterDocuments(files);

    const withPaths = await Promise.all(
      filtered.map(async (file) => {
        const folderPath = file.parents?.length ? await getFolderPath(drive, file.parents[0]) : '';
        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          description: file.description || '',
          webViewLink: file.webViewLink || '',
          folderPath,
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime,
          size: file.size ? formatFileSize(file.size) : 'Unknown',
        };
      })
    );

    return NextResponse.json({ documents: withPaths, nextPageToken: resp.data.nextPageToken ?? null }, { status: 200 });
  } catch (err: any) {
    console.error('❌ Error in GET /api/drive/docs:', err);
    const msg = (err?.message as string) || 'Failed to load documents';
    const status =
      /No Supabase session|Authorization Bearer|Invalid Supabase access token/.test(msg) ? 401 :
      /not connected|No Google refresh_token/.test(msg) ? 400 :
      500;

    return NextResponse.json({ error: msg }, { status });
  }
}
