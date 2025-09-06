# Invites API Test Examples

## POST /api/invites

### Create an invite
```bash
curl -X POST http://localhost:3000/api/invites \
  -H "Content-Type: application/json" \
  -H "Cookie: your-supabase-session-cookie" \
  -d '{
    "projectId": "your-project-id",
    "email": "user@example.com",
    "role": "editor"
  }'
```

### Expected Response (Success)
```json
{
  "ok": true,
  "token": "abc123def456...",
  "invite": {
    "id": "invite-uuid",
    "projectId": "project-uuid",
    "email": "user@example.com",
    "role": "editor",
    "expiresAt": "2025-02-03T12:00:00Z",
    "status": "pending"
  }
}
```

### Expected Response (Error)
```json
{
  "error": "Forbidden - You must be an owner or admin to invite users"
}
```

## GET /api/invites?projectId=your-project-id

### Get all invites for a project
```bash
curl -X GET "http://localhost:3000/api/invites?projectId=your-project-id" \
  -H "Cookie: your-supabase-session-cookie"
```

### Expected Response
```json
{
  "ok": true,
  "invites": [
    {
      "id": "invite-uuid",
      "email": "user@example.com",
      "role": "editor",
      "status": "pending",
      "expires_at": "2025-02-03T12:00:00Z",
      "accepted_at": null,
      "inserted_at": "2025-01-27T12:00:00Z",
      "inviter_id": "inviter-uuid"
    }
  ]
}
```

## Error Codes
- `400` - Bad Request (missing fields, invalid email/role)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not owner/admin)
- `404` - Not Found (project doesn't exist)
- `500` - Internal Server Error
