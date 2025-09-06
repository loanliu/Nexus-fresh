# Member Management Test Guide

## How to Test Member Management

### 1. Access Share Dialog
- Go to Projects tab
- Click Share button on any project
- Click "Members" tab

### 2. Test Role Changes
1. Find a member with role "Editor" or "Viewer"
2. Click the role dropdown (colored badge)
3. Select a different role (e.g., Editor → Admin)
4. Should see success toast and role updates immediately

### 3. Test Member Removal
1. Find a member that's not an owner
2. Click the red trash icon
3. Confirm removal in the dialog
4. Should see success toast and member disappears

### 4. Test Owner Protection
1. Try to change the role of the only owner
2. Should be blocked with error message
3. Try to remove the only owner
4. Should be blocked with error message

## API Endpoints

### GET /api/projects/[projectId]/members
- Lists all project members
- Returns user details and roles
- Requires project membership

### PATCH /api/projects/[projectId]/members
- Updates member role
- Body: `{ userId, role }`
- Requires admin/owner permission
- Prevents demoting last owner

### DELETE /api/projects/[projectId]/members
- Removes member from project
- Query: `?userId=xxx`
- Requires admin/owner permission
- Prevents removing last owner

## Expected Behavior

### Role Management
- ✅ **Dropdown for admins** - Can change roles via dropdown
- ✅ **Read-only for others** - Non-admins see static role badges
- ✅ **Owner protection** - Cannot demote last owner
- ✅ **Optimistic updates** - UI updates immediately
- ✅ **Error handling** - Clear error messages

### Member Removal
- ✅ **Confirmation dialog** - Asks before removing
- ✅ **Owner protection** - Cannot remove last owner
- ✅ **Permission check** - Only admins can remove
- ✅ **Success feedback** - Toast notification

### UI States
- ✅ **Loading states** - During API calls
- ✅ **Error states** - Clear error messages
- ✅ **Success states** - Confirmation toasts
- ✅ **Disabled states** - Owner dropdowns disabled

## Security Features

### Permission Checks
- **Authentication required** - Must be logged in
- **Project membership** - Must be project member to view
- **Admin/owner only** - Only admins can manage members
- **Last owner protection** - Prevents removing/demoting last owner

### Validation
- **Role validation** - Only valid roles accepted
- **Member existence** - Checks if user is project member
- **Owner count** - Prevents removing last owner
- **Permission verification** - Server-side permission checks

## Error Messages

### Role Change Errors
- "Cannot demote the last owner of the project"
- "User is not a member of this project"
- "You must be an owner or admin to manage members"

### Removal Errors
- "Cannot remove the last owner of the project"
- "User is not a member of this project"
- "You must be an owner or admin to remove members"

## Test Scenarios

### ✅ Valid Role Change
1. Admin changes Editor → Admin
2. Success toast appears
3. Role updates in UI
4. Member list refreshes

### ✅ Valid Member Removal
1. Admin removes Editor
2. Confirmation dialog appears
3. User confirms removal
4. Member disappears from list
5. Success toast appears

### ❌ Invalid Role Change
1. Try to demote only owner
2. Error message appears
3. Role remains unchanged
4. Error toast shows

### ❌ Invalid Member Removal
1. Try to remove only owner
2. Error message appears
3. Member remains in list
4. Error toast shows

## Troubleshooting

### Role Dropdown Not Working
- Check if user has admin/owner permissions
- Verify API endpoint is responding
- Check browser console for errors

### Member Removal Failing
- Ensure user is not the last owner
- Check if user has proper permissions
- Verify member exists in project

### API Errors
- Check network tab for failed requests
- Verify authentication is working
- Check server logs for detailed errors
