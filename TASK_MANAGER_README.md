# Task Manager MVP - Phase 1

A lean, single-user task management system built with Next.js 14, Supabase, and modern React patterns.

## 🚀 **Features (Phase 1)**

### **Core Functionality**
- ✅ **Task Management**: Create, edit, delete, and organize tasks
- ✅ **Project Organization**: Group tasks by projects with custom colors
- ✅ **Label System**: Tag tasks with customizable labels and colors
- ✅ **Status Tracking**: Todo, In Progress, Done, Archived
- ✅ **Priority Levels**: Low, Medium, High, Urgent
- ✅ **Due Date Management**: Set and track task deadlines
- ✅ **Time Estimation**: Track estimated vs. actual hours
- ✅ **Subtasks**: Create hierarchical task structures

### **Views & Navigation**
- ✅ **All Tasks**: Complete task list with advanced filtering
- ✅ **My Tasks**: Personal task overview with status grouping
- ✅ **Saved Filters**: Custom task views (Phase 3 enhancement)
- ✅ **Responsive Design**: Works on desktop and mobile

### **Data Management**
- ✅ **Real-time Updates**: Live task updates across all views
- ✅ **Search & Filtering**: Find tasks by title, description, status, priority
- ✅ **Project Filtering**: Filter tasks by project
- ✅ **Label Filtering**: Filter tasks by labels
- ✅ **Date Range Filtering**: Filter by due dates

## 🛠 **Technical Stack**

### **Frontend**
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **lucide-react** for icons
- **react-hook-form** + **zod** for form validation

### **Backend & Data**
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates
- **Google OAuth** for user authentication

### **State Management**
- **TanStack Query** for server state management
- **React hooks** for local state
- **Optimistic updates** for better UX

## 📊 **Database Schema**

### **Core Tables**
```sql
-- Projects
projects (id, name, description, color, is_archived, user_id, created_at, updated_at)

-- Tasks
tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, parent_task_id, user_id, created_at, updated_at, completed_at)

-- Labels
labels (id, name, color, user_id, created_at)

-- Task Labels (Junction)
task_labels (task_id, label_id)

-- Comments
comments (id, content, task_id, user_id, created_at, updated_at)

-- Attachments
attachments (id, filename, file_path, file_size, mime_type, task_id, user_id, created_at)

-- Saved Filters
saved_filters (id, name, filter_config, is_default, user_id, created_at)
```

### **Security Features**
- **Row Level Security (RLS)** enabled on all tables
- **User isolation**: Users can only access their own data
- **Foreign key constraints** for data integrity
- **Automatic user_id injection** on all operations

## 🚀 **Getting Started**

### **1. Database Setup**
Run the SQL schema in your Supabase SQL editor:
```bash
# Copy and paste the contents of setup_task_manager_schema.sql
# This will create all tables, indexes, and RLS policies
```

### **2. Environment Variables**
Ensure your `.env.local` has:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **3. Install Dependencies**
```bash
npm install @tanstack/react-query
```

### **4. Run the Application**
```bash
npm run dev
```

## 📱 **Usage Guide**

### **Creating Tasks**
1. Click "New Task" button in the sidebar
2. Fill in task details (title, description, status, priority)
3. Set due date and estimated hours
4. Assign to a project (optional)
5. Add labels (optional)
6. Click "Create Task"

### **Managing Projects**
1. Click "New Project" button in the sidebar
2. Enter project name and description
3. Choose a color from the palette
4. Click "Create Project"

### **Organizing with Labels**
1. Click "New Label" button in the sidebar
2. Enter label name
3. Choose a color from the palette
4. Click "Create Label"
5. Apply labels to tasks in the task form

### **Task Views**
- **All Tasks**: Complete task list with search and filtering
- **My Tasks**: Overview grouped by status with overdue/due soon alerts
- **Saved Filters**: Custom task views (coming in Phase 3)

## 🔧 **Development Notes**

### **Component Structure**
```
src/components/task-manager/
├── task-manager.tsx          # Main container component
├── task-list.tsx            # All tasks view with filtering
├── my-tasks.tsx             # Personal task overview
├── saved-filters.tsx        # Custom filter management
├── task-card.tsx            # Individual task display
├── task-form.tsx            # Task creation/editing
├── project-form.tsx         # Project creation
└── label-form.tsx           # Label creation
```

### **Data Hooks**
```typescript
// Core data management
useTasks()           // Fetch all tasks
useTask(id)          // Fetch single task
useCreateTask()      // Create new task
useUpdateTask()      // Update existing task
useDeleteTask()      // Delete task

// Supporting data
useProjects()        // Fetch projects
useLabels()          // Fetch labels
useComments()        // Fetch task comments
useSavedFilters()    // Fetch saved filters
```

### **Form Validation**
All forms use **zod** schemas for validation:
- Task titles: 1-255 characters
- Estimated hours: 0.25-168 hours
- Required fields: title, status, priority
- Optional fields: description, due date, project, labels

## 🚧 **Phase 2 & 3 Roadmap**

### **Phase 2: Enhanced Features**
- [ ] **Drag & Drop**: Reorder tasks with visual feedback
- [ ] **Bulk Operations**: Select multiple tasks for batch actions
- [ ] **Task Dependencies**: Link tasks with blocking relationships
- [ ] **Time Tracking**: Start/stop timer for actual hours
- [ ] **File Attachments**: Upload and manage task files

### **Phase 3: Advanced Features**
- [ ] **Saved Filters**: Full filter configuration and persistence
- [ ] **Command Palette**: Quick actions with keyboard shortcuts
- [ ] **Task Templates**: Reusable task structures
- [ ] **Recurring Tasks**: Automatically repeating tasks
- [ ] **Task Export**: Export tasks to various formats

## 🐛 **Troubleshooting**

### **Common Issues**

**Tasks not loading**
- Check Supabase RLS policies are enabled
- Verify user authentication is working
- Check browser console for errors

**Forms not submitting**
- Ensure all required fields are filled
- Check form validation errors
- Verify Supabase connection

**Real-time updates not working**
- Check Supabase real-time is enabled
- Verify subscription channels are correct
- Check network connectivity

### **Debug Mode**
Enable debug logging in the browser console:
```typescript
// Add to any component for debugging
console.log('Tasks:', tasks);
console.log('Projects:', projects);
console.log('Labels:', labels);
```

## 📈 **Performance Considerations**

### **Optimizations Implemented**
- **Database indexes** on frequently queried fields
- **Efficient queries** with proper joins and filtering
- **Optimistic updates** for immediate UI feedback
- **Debounced search** to reduce API calls
- **Pagination** for large task lists (Phase 2)

### **Scalability Notes**
- **Single user design** - not optimized for teams
- **Local state management** - consider global state for larger apps
- **File storage** - implement cleanup for deleted attachments

## 🤝 **Contributing**

This is a personal MVP project. For production use, consider:
- Adding comprehensive error handling
- Implementing proper loading states
- Adding accessibility features
- Setting up automated testing
- Adding performance monitoring

## 📄 **License**

Personal use only. This project demonstrates modern React patterns and Supabase integration.

---

**Built with ❤️ using Next.js 14, Supabase, and modern web technologies**
