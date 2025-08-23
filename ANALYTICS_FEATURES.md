# Analytics & Insights Features

## Overview
The Nexus Analytics & Insights system provides comprehensive data visualization and insights about your workspace usage, productivity patterns, and resource management.

## Features

### 📊 **Key Metrics Dashboard**
- **Total Resources**: Count of all uploaded files with weekly additions
- **Active Tasks**: Total tasks with weekly completion tracking
- **Categories**: Organizational structure overview
- **Storage Used**: Total file storage consumption with smart formatting

### 🧠 **Smart Insights Panel**
Automatically generates contextual insights based on your data:
- Resource upload patterns
- Task completion achievements
- Overdue task alerts
- Project progress highlights
- API key management status
- Google Drive integration status

### 📈 **Interactive Charts**
- **Pie Charts**: Resource distribution by category, API keys by service
- **Bar Charts**: Task status distribution, file types breakdown
- **Progress Bars**: Task completion rates, project status, storage usage

### ⏰ **Time-Based Analytics**
- **Weekly Metrics**: Recent activity and uploads
- **Monthly Trends**: Longer-term patterns and completion rates
- **Quarterly Overview**: Extended period analysis

### 📁 **Resource Analytics**
- File type distribution
- Category-based organization
- Storage consumption tracking
- Recent upload activity

### ✅ **Task Productivity Analytics**
- Status distribution (pending, in progress, completed)
- Priority breakdown
- Project association tracking
- Completion rate calculations
- Overdue task identification

### 🏷️ **Category Insights**
- Top categories by resource count
- Top categories by task count
- Organizational efficiency metrics

### 🔑 **API Key Management Analytics**
- Service distribution
- Active key count
- Usage patterns

### 📊 **Project Analytics**
- Status distribution
- Active vs. completed projects
- Progress tracking

### ☁️ **Google Drive Integration Status**
- Accessible file count
- Storage usage
- Recent activity tracking

## Technical Implementation

### Hooks
- `useAnalytics()`: Main analytics data fetching hook
- Fetches data from multiple Supabase tables in parallel
- Handles loading states and error management

### Components
- `Chart`: Reusable chart component supporting bar, pie, and line charts
- `MetricCard`: Display key metrics with icons and trends
- `ProgressBar`: Visual progress indicators
- `ExportAnalytics`: CSV export functionality

### Utilities
- `formatStorageSize()`: Human-readable storage formatting
- `generateInsights()`: AI-like insights generation
- `calculateTrend()`: Trend calculation for metrics
- `getTimeRanges()`: Predefined time period utilities

## Data Sources

The analytics system aggregates data from:
- `resources` table - File uploads and storage
- `tasks` table - Task management and completion
- `categories` table - Organizational structure
- `api_keys` table - Service integrations
- `projects` table - Project management
- `google_tokens` table - Google Drive integration

## Export Functionality

- **CSV Export**: Comprehensive data export in CSV format
- **Structured Reports**: Organized by metric categories
- **Timestamped Files**: Automatic file naming with generation date
- **All Data Included**: Complete analytics dataset export

## Usage

1. Navigate to the Analytics tab in the dashboard
2. View real-time metrics and insights
3. Switch between time ranges (week/month/quarter)
4. Export data for external analysis
5. Use insights to optimize your workflow

## Future Enhancements

- Real-time data updates
- Custom date range selection
- Advanced filtering options
- Comparative analytics
- Performance benchmarking
- Goal setting and tracking
- Automated insights delivery
- Integration with external analytics tools
