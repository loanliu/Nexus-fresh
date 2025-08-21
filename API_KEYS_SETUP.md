# 🔑 API Key Management Setup Guide

## Overview
The API Key Management feature allows you to securely store and manage your API keys with encryption, organize them by service/category, and test connections.

## Features
- ✅ **Secure Storage**: Store API keys with encryption
- ✅ **Organization**: Categorize keys by service and status
- ✅ **Search & Filter**: Find keys quickly with search and status filters
- ✅ **CRUD Operations**: Create, read, update, and delete API keys
- ✅ **Status Tracking**: Monitor key status (active, testing, expired, invalid)
- ✅ **Usage Limits**: Set daily, monthly, and total usage limits
- ✅ **Notes & Instructions**: Add setup instructions and notes for each key
- ✅ **Expiration Dates**: Track when keys expire
- ✅ **Testing**: Test API key connections (placeholder for future implementation)

## Database Setup

### Option 1: Complete Schema (Recommended)
If you haven't set up your database yet, run the complete schema:
```sql
-- Run in Supabase SQL Editor
\i setup_complete_schema.sql
```

### Option 2: API Keys Only
If you only need the API keys table, run:
```sql
-- Run in Supabase SQL Editor
\i setup_api_keys_table.sql
```

## Table Structure
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  service_name TEXT NOT NULL,        -- e.g., "OpenAI", "Google Cloud"
  key_name TEXT NOT NULL,            -- e.g., "Production Key", "Development Key"
  encrypted_key TEXT NOT NULL,       -- The actual API key
  setup_instructions TEXT,           -- How to use this key
  category_id UUID,                  -- Link to categories table
  expiration_date TIMESTAMP,         -- When the key expires
  last_tested TIMESTAMP,             -- Last time key was tested
  status TEXT DEFAULT 'active',      -- active, testing, expired, invalid
  user_id UUID NOT NULL,            -- Owner of the key
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,                        -- Additional notes
  usage_limits JSONB                 -- Daily, monthly, total limits
);
```

## Usage

### 1. Access the Feature
- Navigate to your dashboard
- Click on the "API Keys" tab in the sidebar

### 2. Add Your First API Key
- Click "Add API Key" button
- Fill in the required fields:
  - **Service Name**: The service provider (e.g., OpenAI, AWS)
  - **Key Name**: A descriptive name for this key
  - **API Key**: The actual API key value
- Optionally add:
  - Category assignment
  - Expiration date
  - Setup instructions
  - Notes
  - Usage limits

### 3. Manage Your Keys
- **View**: Click the eye icon to reveal/hide the key
- **Copy**: Click the copy icon to copy the key to clipboard
- **Edit**: Click edit to modify key details
- **Test**: Click test to verify the key works (placeholder)
- **Delete**: Remove keys you no longer need

### 4. Search and Filter
- Use the search bar to find keys by name or service
- Filter by status (active, testing, expired, invalid)
- View statistics for each status category

## Security Features
- **Row Level Security (RLS)**: Users can only access their own keys
- **Encrypted Storage**: Keys are stored securely in the database
- **User Isolation**: Each user's keys are completely separate
- **Audit Trail**: Track creation and modification dates

## Future Enhancements
- 🔄 **Key Rotation**: Automatic key rotation reminders
- 🔐 **Encryption**: Client-side encryption before storage
- 📊 **Usage Analytics**: Track actual API usage vs limits
- 🧪 **Connection Testing**: Test API connections in real-time
- 🔔 **Notifications**: Expiration and usage limit alerts

## Troubleshooting

### "No API keys found" message
- Ensure you're logged in
- Check if the `api_keys` table exists in your database
- Verify RLS policies are properly set up

### Permission denied errors
- Make sure you're authenticated
- Check that the `api_keys` table has the correct RLS policies
- Verify your user ID exists in the `auth.users` table

### Categories not showing in dropdown
- Ensure the `categories` table exists and has data
- Check that categories have the correct `user_id` values
- Verify RLS policies for the categories table

## Support
If you encounter issues:
1. Check the browser console for error messages
2. Verify your database schema matches the setup files
3. Ensure all required tables and policies are created
4. Check that you're properly authenticated

## Example API Keys
Here are some common services you might want to add:
- **OpenAI**: GPT API keys
- **Google Cloud**: Cloud services and APIs
- **AWS**: Amazon Web Services credentials
- **Stripe**: Payment processing keys
- **GitHub**: Personal access tokens
- **Slack**: Bot tokens and webhooks
- **Discord**: Bot tokens
- **SendGrid**: Email service keys
