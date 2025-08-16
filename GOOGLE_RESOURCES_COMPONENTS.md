# Google Resources Components

This document provides a comprehensive overview of all the Google Resources components implemented in your Nexus project.

## 🎯 **Overview**

The Google Resources integration provides a complete solution for displaying, searching, and managing Google Drive documents within your application. It includes components for authentication setup, document display, search functionality, and configuration management.

## 📁 **Component Structure**

```
src/components/google-resources/
├── index.ts                    # Main exports
├── google-resources.tsx        # Main component
├── document-card.tsx           # Individual document display
├── document-detail-modal.tsx   # Document details modal
├── search-filters.tsx          # Advanced search and filtering
├── google-auth-setup.tsx      # Authentication setup wizard
└── google-settings.tsx        # Configuration settings
```

## 🚀 **Components Overview**

### 1. **GoogleResources** (Main Component)
**File:** `google-resources.tsx`

The main component that orchestrates the entire Google Resources experience.

**Features:**
- Document loading and display
- Search functionality
- Error handling
- Loading states
- Integration with all sub-components

**Usage:**
```tsx
import { GoogleResources } from '@/components/google-resources';

export default function MyPage() {
  return <GoogleResources />;
}
```

### 2. **DocumentCard** (Document Display)
**File:** `document-card.tsx`

Displays individual Google documents in a card format with actions.

**Features:**
- Document metadata display
- File type icons and badges
- Action buttons (View Details, Open)
- Hover effects and animations
- Responsive design

**Props:**
```tsx
interface DocumentCardProps {
  document: GoogleDocument;
  onViewDetails: (document: GoogleDocument) => void;
  onOpenDocument: (webViewLink: string) => void;
}
```

**Usage:**
```tsx
import { DocumentCard } from '@/components/google-resources';

<DocumentCard
  document={doc}
  onViewDetails={handleViewDetails}
  onOpenDocument={handleOpenDocument}
/>
```

### 3. **DocumentDetailModal** (Document Details)
**File:** `document-detail-modal.tsx`

A modal that shows comprehensive information about a selected document.

**Features:**
- Full document metadata
- Content preview (if available)
- File type information
- Creation and modification dates
- Direct link to Google Drive

**Props:**
```tsx
interface DocumentDetailModalProps {
  document: GoogleDocument | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**Usage:**
```tsx
import { DocumentDetailModal } from '@/components/google-resources';

<DocumentDetailModal
  document={selectedDocument}
  isOpen={isModalOpen}
  onClose={handleCloseModal}
/>
```

### 4. **SearchFilters** (Advanced Search)
**File:** `search-filters.tsx`

Provides advanced search and filtering capabilities for Google documents.

**Features:**
- Text search with debouncing
- File type filtering
- Date range selection
- Sorting options
- Collapsible interface

**Props:**
```tsx
interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}
```

**Types:**
```tsx
interface SearchFilters {
  query: string;
  fileTypes: string[];
  dateRange: { start: string; end: string };
  sortBy: 'name' | 'created' | 'modified' | 'size';
  sortOrder: 'asc' | 'desc';
}
```

**Usage:**
```tsx
import { SearchFilters } from '@/components/google-resources';

<SearchFilters
  onFiltersChange={handleFiltersChange}
  onClearFilters={handleClearFilters}
/>
```

### 5. **GoogleAuthSetup** (Authentication Wizard)
**File:** `google-auth-setup.tsx`

A step-by-step wizard to help users set up Google Drive authentication.

**Features:**
- 5-step setup process
- Progress tracking
- External links to Google services
- Environment variable guidance
- Help documentation links

**Props:**
```tsx
interface GoogleAuthSetupProps {
  onSetupComplete?: () => void;
}
```

**Usage:**
```tsx
import { GoogleAuthSetup } from '@/components/google-resources';

<GoogleAuthSetup onSetupComplete={handleSetupComplete} />
```

### 6. **GoogleSettings** (Configuration)
**File:** `google-settings.tsx`

Allows users to configure Google Resources settings and preferences.

**Features:**
- Folder ID configuration
- Document limits
- Refresh intervals
- File type exclusions
- Date cutoff settings
- Connection testing

**Props:**
```tsx
interface GoogleSettingsProps {
  onSave?: (settings: GoogleSettings) => void;
}
```

**Types:**
```tsx
interface GoogleSettings {
  folderId: string;
  maxDocuments: number;
  refreshInterval: number;
  includeContent: boolean;
  excludedMimeTypes: string[];
  dateCutoff: string;
}
```

**Usage:**
```tsx
import { GoogleSettings } from '@/components/google-resources';

<GoogleSettings onSave={handleSettingsSave} />
```

## 🔧 **Integration with Main App**

### Dashboard Integration
The Google Resources component is integrated into your main dashboard:

```tsx
// In src/app/page.tsx
case 'google-resources':
  return <GoogleResources />;

// In src/components/dashboard/dashboard-layout.tsx
{ id: 'google-resources', label: 'Google Resources', icon: FolderOpen, description: 'Google Drive documents and search' }
```

### Navigation
Users can access Google Resources from the main sidebar navigation, positioned between "Resources" and "Categories".

## 📊 **Data Flow**

```
Google Drive API ←→ API Route (/api/google/docs) ←→ useGoogleDocs Hook ←→ Components
```

1. **API Route** handles Google Drive API calls
2. **useGoogleDocs Hook** manages state and API interactions
3. **Components** display and interact with the data

## 🎨 **Styling and Design**

All components use:
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Custom UI components** from your design system
- **Responsive design** for all screen sizes
- **Dark mode support** (inherits from your theme)

## 🔒 **Security Features**

- Service account authentication
- Environment variable configuration
- Secure API key management
- Read-only access to Google Drive
- No sensitive data exposure

## 📱 **Responsive Design**

Components are designed to work on:
- **Mobile** (320px+)
- **Tablet** (768px+)
- **Desktop** (1024px+)
- **Large screens** (1280px+)

## 🚀 **Performance Optimizations**

- **Debounced search** (500ms delay)
- **Lazy loading** of document content
- **Efficient filtering** algorithms
- **Optimized re-renders** with React hooks
- **API response caching**

## 🔧 **Customization Options**

### Styling
All components can be customized by modifying:
- Tailwind classes
- CSS variables
- Component props

### Functionality
Extend functionality by:
- Adding new filter types
- Implementing additional search algorithms
- Creating custom document actions
- Adding analytics tracking

## 📚 **Usage Examples**

### Basic Implementation
```tsx
import { GoogleResources } from '@/components/google-resources';

export default function MyPage() {
  return (
    <div>
      <h1>My Google Documents</h1>
      <GoogleResources />
    </div>
  );
}
```

### Custom Document Card
```tsx
import { DocumentCard } from '@/components/google-resources';

function CustomDocumentList({ documents }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {documents.map(doc => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onViewDetails={(doc) => console.log('View details:', doc)}
          onOpenDocument={(url) => window.open(url, '_blank')}
        />
      ))}
    </div>
  );
}
```

### Advanced Search
```tsx
import { SearchFilters } from '@/components/google-resources';

function CustomSearch() {
  const handleFiltersChange = (filters) => {
    console.log('Filters changed:', filters);
    // Implement custom search logic
  };

  return (
    <SearchFilters
      onFiltersChange={handleFiltersChange}
      onClearFilters={() => console.log('Filters cleared')}
    />
  );
}
```

## 🐛 **Troubleshooting**

### Common Issues

1. **Documents not loading**
   - Check Google Cloud Console setup
   - Verify service account permissions
   - Check environment variables

2. **Search not working**
   - Ensure Google Drive API is enabled
   - Check service account key file
   - Verify folder sharing permissions

3. **Authentication errors**
   - Validate service account JSON key
   - Check API quotas and limits
   - Verify folder access permissions

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG_GOOGLE_DRIVE=true
```

## 📖 **Additional Resources**

- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Service Account Setup Guide](GOOGLE_RESOURCES_SETUP.md)
- [Component API Reference](types/index.ts)

## 🤝 **Contributing**

To extend or modify these components:

1. Follow the existing component patterns
2. Maintain TypeScript types
3. Add proper error handling
4. Include responsive design
5. Update this documentation

## 📄 **License**

These components are part of your Nexus project and follow the same licensing terms.
