# Accept Invite Flow Test

## How the Flow Works

### 1. User receives invite link
```
https://nextgen-aisolutions.ai/invite/accept?token=abc123def456...
```

### 2. User clicks link
- If **not logged in**: Redirects to `/auth/signin?returnUrl=...`
- If **logged in**: Processes invite immediately

### 3. After sign-in (if needed)
- User is redirected back to `/invite/accept?token=...`
- Invite is processed automatically

### 4. API Processing
- Validates token exists and is pending
- Checks if not expired
- Verifies user email matches invite email
- Creates project membership
- Updates invite status to 'accepted'
- Returns success with project info

### 5. Success Response
- Shows success message with project name
- Shows toast notification
- Redirects to project dashboard after 2 seconds

## Test Scenarios

### ✅ Valid Invite (Logged In)
1. User is logged in
2. Clicks invite link
3. Sees "Processing invite..." loading
4. Sees "Welcome to the Project!" success
5. Gets redirected to project dashboard

### ✅ Valid Invite (Not Logged In)
1. User clicks invite link
2. Redirected to sign-in page
3. Signs in with Google or Magic Link
4. Redirected back to invite page
5. Invite processed successfully
6. Redirected to project dashboard

### ❌ Invalid Token
1. User clicks invalid/expired link
2. Sees "Unable to Accept Invite" error
3. Can try again or go to dashboard

### ❌ Wrong Email
1. User signs in with different email than invite
2. Sees "This invite was sent to a different email address"
3. Can sign out and sign in with correct email

### ❌ Already Member
1. User is already a project member
2. Invite is marked as accepted
3. Shows "You are already a member" message
4. Redirects to project dashboard

## Error Handling

- **401**: Not logged in → Redirect to sign-in
- **400**: Invalid token, expired, already used → Show error
- **403**: Wrong email → Show error
- **404**: Token not found → Show error
- **500**: Server error → Show generic error

## UI States

1. **Loading**: Spinner + "Processing invite..."
2. **Success**: Green checkmark + "Welcome to the Project!" + redirect
3. **Error**: Red X + error message + retry options
