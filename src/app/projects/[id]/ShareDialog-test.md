# Share Dialog Test Guide

## How to Test the Share Dialog

### 1. Open a Project
- Go to the Projects tab in your dashboard
- Click on any project card
- Look for the blue Share button (Share2 icon) in the project header

### 2. Test Invite Flow
1. Click the Share button
2. Modal opens with two tabs: "Invite People" and "Members"
3. In "Invite People" tab:
   - Enter an email address
   - Select a role (Viewer, Editor, Admin)
   - Click "Send Invite"
   - Should see success message and pending invite appear

### 3. Test Copy Link
1. After sending an invite, a pending invite row appears
2. Click "Copy Link" button
3. Should copy the invite URL to clipboard
4. URL format: `https://nextgen-aisolutions.ai/invite/accept?token=...`

### 4. Test Members Tab
1. Click "Members" tab
2. Should show current project members
3. Each member shows:
   - Name/email
   - Role badge with color coding
   - Remove button (for admins only)

## Expected Behavior

### Invite Form
- ✅ Email validation
- ✅ Role selection (admin/editor/viewer)
- ✅ Success toast on invite sent
- ✅ Pending invite appears in list
- ✅ Copy link functionality

### Members List
- ✅ Shows all project members
- ✅ Role badges with appropriate colors
- ✅ Owner (yellow), Admin (red), Editor (blue), Viewer (gray)
- ✅ Remove button only for admins (not owners)

### UI States
- ✅ Loading states during API calls
- ✅ Empty states when no data
- ✅ Error handling with toast messages
- ✅ Responsive design

## API Endpoints Used

### POST /api/invites
- Creates new project invite
- Returns token for invite link

### GET /api/invites?projectId=xxx
- Lists pending invites for project

### GET /api/projects/[id]/members
- Lists project members with user details

## Role Permissions

- **Owner**: Can invite, manage all members, remove anyone except other owners
- **Admin**: Can invite, manage members, remove editors/viewers
- **Editor**: Can view members, cannot invite or remove
- **Viewer**: Can view members, cannot invite or remove

## Troubleshooting

### Invite Not Sending
- Check if user has proper permissions (owner/admin)
- Verify email format
- Check browser console for errors

### Members Not Loading
- Check if user is project member
- Verify API endpoint is working
- Check network tab for failed requests

### Copy Link Not Working
- Check if clipboard API is supported
- Try manual copy if needed
- Verify token is generated correctly
