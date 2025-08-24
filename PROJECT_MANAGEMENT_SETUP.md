# Project Management Data Persistence Setup

This guide will help you set up the project management system with real database persistence using Supabase.

## 🗄️ Database Setup

### 1. Run the Database Schema

Copy and paste the contents of `setup_project_management_schema.sql` into your Supabase SQL editor and run it. This will create:

- **Projects table** - Store project information
- **Tasks table** - Store individual tasks with status, priority, effort, etc.
- **Labels table** - Store task labels/tags
- **Comments table** - Store task comments
- **Attachments table** - Store file attachments
- **Project Templates table** - Store reusable project templates
- **Daily Digest Settings table** - Store user preferences for notifications
- **Saved Filters table** - Store user-defined task filters

### 2. Verify RLS Policies

The schema automatically creates Row Level Security (RLS) policies that ensure:
- Users can only see their own data
- All operations are properly secured
- Foreign key relationships are maintained

### 3. Check Indexes

The schema creates performance indexes for:
- User ID lookups
- Project relationships
- Task status and due dates
- Sort order and snooze dates

## 🔧 Frontend Integration

### 1. Update Project Manager Component

The `project-manager.tsx` component now uses real database hooks instead of localStorage:

```typescript
// Replace localStorage demo data with real database queries
import { useProjects, useCreateProject } from '@/hooks/use-project-management';

export function ProjectManager() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  
  // Remove the loadDemoData function and localStorage logic
  // Projects will automatically load from the database
}
```

### 2. Update All Project Components

Each component now uses the appropriate hooks:

- **Project List**: `useProjects`, `useUpdateProject`, `useDeleteProject`
- **Task Capture**: `useCreateTask`, `useLabels`
- **My Day**: `useTasks`, `useUpdateTaskStatus`, `useSnoozeTask`
- **Plan Week**: `useTasks`, `useUpdateTaskDueDate`
- **Templates**: `useProjectTemplates`, `useCreateProjectFromTemplate`
- **Daily Digest**: `useDailyDigestSettings`, `useUpdateDailyDigestSettings`

### 3. Real-time Updates

The system includes real-time subscriptions for live updates:

```typescript
import { subscribeToProjectUpdates, subscribeToTaskUpdates } from '@/lib/project-management-client';

// Subscribe to real-time updates
useEffect(() => {
  const subscription = subscribeToProjectUpdates((payload) => {
    // Handle real-time updates
    queryClient.invalidateQueries();
  });

  return () => subscription.unsubscribe();
}, []);
```

## 🚀 Migration Steps

### Step 1: Database Setup
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste `setup_project_management_schema.sql`
4. Run the script
5. Verify all tables are created

### Step 2: Update Components
1. Replace localStorage logic with database hooks
2. Update type imports to use `@/types/project-management`
3. Remove demo data loading functions
4. Add proper error handling and loading states

### Step 3: Test Integration
1. Create a new project
2. Add tasks to the project
3. Update task status and priority
4. Test real-time updates
5. Verify data persists across sessions

## 📊 Data Flow

```
User Action → React Hook → Supabase Client → Database
     ↑                                           ↓
Real-time Updates ← Subscription ← Database Changes
```

## 🔒 Security Features

- **Row Level Security (RLS)** - Users only see their own data
- **Authentication Required** - All operations require valid user session
- **Input Validation** - Type-safe operations with TypeScript
- **SQL Injection Protection** - Supabase handles parameterized queries

## 🧪 Testing

### Test Cases
1. **Project CRUD**: Create, read, update, delete projects
2. **Task Management**: Create tasks, update status, add comments
3. **Real-time**: Open multiple tabs, make changes, verify sync
4. **Error Handling**: Test with invalid data, network issues
5. **Performance**: Load projects with many tasks

### Debugging
- Check browser console for errors
- Verify Supabase logs for failed queries
- Check RLS policies are enabled
- Verify user authentication is working

## 🔄 Next Steps

After data persistence is working:

1. **File Uploads**: Implement attachment handling
2. **Advanced Filters**: Add saved filter functionality
3. **Bulk Operations**: Add bulk task updates
4. **Export/Import**: Add data export functionality
5. **Analytics**: Add project progress tracking

## 📝 Troubleshooting

### Common Issues

**"No rows returned" errors**
- Check if user is authenticated
- Verify RLS policies are correct
- Check if data exists for the current user

**Real-time not working**
- Verify Supabase real-time is enabled
- Check subscription channel names
- Verify user has proper permissions

**Performance issues**
- Check database indexes are created
- Verify query optimization
- Consider pagination for large datasets

### Getting Help

1. Check Supabase dashboard logs
2. Verify environment variables
3. Test with simple queries first
4. Check browser network tab for failed requests

## 🎯 Success Criteria

Data persistence is working when:
- ✅ Projects save to database and persist across sessions
- ✅ Tasks can be created, updated, and deleted
- ✅ Real-time updates work across multiple tabs
- ✅ User data is properly isolated
- ✅ Performance is acceptable with reasonable data volumes
