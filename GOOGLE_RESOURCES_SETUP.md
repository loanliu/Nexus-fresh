# Google Resources Setup Guide

This guide will help you set up the Google Resources integration to display and search Google Drive documents.

## Features

- Display up to 20 Google Drive documents
- Filter out videos, audio, binary files, and PDFs
- Exclude documents created before January 2020
- Search by document name and content
- Support for Google Docs, Sheets, and Slides

## Prerequisites

1. **Google Cloud Project** with Drive API enabled
2. **Service Account** with appropriate permissions
3. **Google Drive** with documents to display

## Setup Steps

### 1. Enable Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Drive API
4. Go to "APIs & Services" > "Library"
5. Search for "Google Drive API" and enable it

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in service account details
4. Click "Create and Continue"
5. Skip role assignment (we'll handle permissions manually)
6. Click "Done"

### 3. Generate Service Account Key

1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the key file
6. Place it in your project (e.g., `google-service-account.json`)

### 4. Share Google Drive Folder

1. Create a folder in Google Drive for your documents
2. Right-click the folder > "Share"
3. Add your service account email (found in the JSON key file)
4. Give it "Viewer" permissions
5. Copy the folder ID from the URL

### 5. Environment Variables

Add these to your `.env.local` file:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
```

### 6. Update API Route

In `src/app/api/google/docs/route.ts`, update the folder ID:

```typescript
// Add this constant at the top
const GOOGLE_DRIVE_FOLDER_ID = 'your_folder_id_here';

// Update the search query to include folder restriction
const folderFilter = `'${GOOGLE_DRIVE_FOLDER_ID}' in parents`;
let finalQuery = `${typeFilter} and ${dateFilter} and ${folderFilter}`;
```

## Usage

### Accessing Google Resources

1. Navigate to your app
2. Click on "Google Resources" in the sidebar
3. The component will automatically load documents
4. Use the search bar to find specific documents
5. Click on any document to open it in Google Drive

### API Endpoints

- `GET /api/google/docs` - Fetch all documents
- `POST /api/google/docs` - Search documents with content

## Troubleshooting

### Common Issues

1. **"Service account not found"**
   - Verify the service account key file path
   - Check that the file exists and is readable

2. **"Drive API not enabled"**
   - Ensure Google Drive API is enabled in your project
   - Wait a few minutes for changes to propagate

3. **"No documents found"**
   - Verify the folder ID is correct
   - Check that documents exist in the shared folder
   - Ensure documents are not older than 2020
   - Confirm documents are Google Docs/Sheets/Slides

4. **"Permission denied"**
   - Verify the service account has access to the folder
   - Check that the folder is shared with the service account email

### Debug Mode

Enable debug logging by adding this to your environment:

```bash
DEBUG_GOOGLE_DRIVE=true
```

## Security Notes

- Never commit your service account key to version control
- Use environment variables for sensitive configuration
- Consider using Google Cloud IAM for more granular permissions
- Regularly rotate service account keys

## Performance Optimization

- Documents are cached locally for better performance
- Search queries are debounced to reduce API calls
- Content is only fetched when explicitly requested
- Results are limited to 20 documents by default

## Customization

### Adding More Document Types

To include additional file types, modify the `allowedTypes` array in the API route:

```typescript
const allowedTypes = [
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.form', // Add Google Forms
];
```

### Changing Date Filter

To modify the date restriction, update the `cutoffDate` in the API route:

```typescript
const cutoffDate = new Date('2019-01-01'); // Change to 2019
```

### Modifying Search Behavior

The search functionality can be customized in the `useGoogleDocs` hook:

```typescript
// Add custom search filters
const customSearch = async (query: string, filters: SearchFilters) => {
  // Implement custom search logic
};
```

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Google Cloud project configuration
3. Ensure all environment variables are set correctly
4. Check that your service account has the necessary permissions
