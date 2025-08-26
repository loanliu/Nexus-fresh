'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  Edit3, 
  Trash2,
  Plus,
  Calendar,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Project, Task } from '@/types/project-management';
import { useDeleteTask, useCreateTask } from '@/hooks/use-project-management';
import { useTasks } from '@/hooks/useTasks';
import { NaturalLanguageTaskCapture } from './natural-language-task-capture';
import { useAuth } from '@/components/auth/auth-provider';

interface ManageTasksModalProps {
  project: Project;
  onClose: () => void;
  onEditTask: (task: Task) => void;
}

export function ManageTasksModal({ project, onClose, onEditTask }: ManageTasksModalProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddingNewTask, setIsAddingNewTask] = useState(false);
  const { user } = useAuth();
  
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();

  // Use the useTasks hook to get fresh, reactive task data
  const { data: tasks, isLoading, isError } = useTasks(project.id);
  
  // Debug logging for data flow
  console.log('🔍 ManageTasksModal render:', {
    projectId: project.id,
    projectName: project.name,
    tasksFromHook: tasks,
    tasksLength: tasks?.length,
    isLoading,
    isError,
    isAddingNewTask, // Add this debug info
    deleteTaskState: {
      isPending: deleteTask.isPending,
      isSuccess: deleteTask.isSuccess,
      isError: deleteTask.isError,
      error: deleteTask.error
    },
    createTaskState: {
      isPending: createTask.isPending,
      isSuccess: createTask.isSuccess,
      isError: createTask.isError,
      error: createTask.error
    }
  });
  
  // Log when tasks data changes
  React.useEffect(() => {
    console.log('🔄 Tasks data changed:', {
      projectId: project.id,
      tasks,
      tasksLength: tasks?.length,
      timestamp: new Date().toISOString()
    });
  }, [tasks, project.id]);
  
  // Log when mutation states change
  React.useEffect(() => {
    console.log('🔄 Delete task mutation state changed:', {
      isPending: deleteTask.isPending,
      isSuccess: deleteTask.isSuccess,
      isError: deleteTask.isError,
      error: deleteTask.error
    });
  }, [deleteTask.isPending, deleteTask.isSuccess, deleteTask.isError, deleteTask.error]);
  
  React.useEffect(() => {
    console.log('🔄 Create task mutation state changed:', {
      isPending: createTask.isPending,
      isSuccess: createTask.isSuccess,
      isError: createTask.isError,
      error: createTask.error
    });
  }, [createTask.isPending, createTask.isSuccess, createTask.isError, createTask.error]);
  
  // Monitor isAddingNewTask state changes
  React.useEffect(() => {
    console.log('🔄 isAddingNewTask state changed:', { isAddingNewTask, timestamp: new Date().toISOString() });
  }, [isAddingNewTask]);
  
  // We now use the reactive useTasks hook instead of manually getting cache data

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleEditTask = (task: Task) => {
    // Always use fresh task data from the reactive tasks
    const freshTask = tasks?.find(t => t.id === task.id) || task;
    onEditTask(freshTask);
  };

  const handleDeleteTask = async (taskId: string) => {
    console.log('🗑️ handleDeleteTask called:', { taskId, currentTasksLength: tasks?.length });
    
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        console.log('🗑️ Starting delete mutation for task:', taskId);
        await deleteTask.mutateAsync(taskId);
        console.log('🗑️ Delete mutation completed successfully');
        console.log('🗑️ After delete - tasks from hook:', tasks);
        console.log('🗑️ After delete - tasks length:', tasks?.length);
        // The React Query cache will automatically update
        // No need to reload the page
      } catch (error) {
        console.error('🗑️ Delete mutation failed:', error);
        // Error is already handled by the hook
      }
    }
  };

  const handleQuickAddTask = async () => {
    console.log('➕ handleQuickAddTask called:', { 
      projectId: project.id, 
      currentTasksLength: tasks?.length,
      user: user?.id 
    });
    
    try {
      // Check if user is authenticated
      if (!user?.id) {
        toast.error('Please sign in to create tasks');
        return;
      }
      
      // Create a temporary task object (NOT saved to database yet)
      const tempTask: Task = {
        id: `temp-${Date.now()}`, // Temporary ID that will be replaced
        title: '',
        description: '',
        status: 'pending' as const,
        priority: 'medium' as const,
        effort: 3,
        estimated_hours: 8,
        project_id: project.id,
        sort_order: (tasks?.length || 0) + 1,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('➕ Opening edit modal with temp task (NOT saved yet):', tempTask);
      
      // Open the modal to edit the temporary task
      // The task will ONLY be created when user clicks "Save Changes" in the modal
      onEditTask(tempTask);
      
    } catch (error) {
      console.error('➕ Failed to prepare new task:', error);
      toast.error('Failed to prepare new task');
    }
  };

  // Show loading state while tasks are being fetched
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if tasks failed to load
  if (isError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4">
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">Failed to load tasks</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Manage Tasks for: {project.name}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View, edit, and generate new subtasks for your project
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Existing Tasks Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Existing Tasks ({tasks?.length || 0})
            </h4>
                         <Button
               variant="outline"
               size="sm"
               onClick={handleQuickAddTask}
               disabled={createTask.isPending || isAddingNewTask}
               className="disabled:opacity-50"
             >
               {createTask.isPending || isAddingNewTask ? (
                 <>
                   <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2" />
                   Creating...
                 </>
               ) : (
                 <>
                   <Plus className="w-4 h-4 mr-2" />
                   Quick Add Task
                 </>
               )}
             </Button>
          </div>
          
                               {tasks && tasks.length > 0 ? (
                       <div className="space-y-3">
                         {[...tasks].sort((a, b) => a.title.localeCompare(b.title)).map((task) => (
                <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CheckSquare 
                          className={`w-5 h-5 ${
                            task.status === 'completed' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-400'
                          }`}
                        />
                        <h5 className={`font-medium ${
                          task.status === 'completed' 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {task.title}
                        </h5>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span>Effort: {task.effort}/5</span>
                        {task.estimated_hours && (
                          <span>Est: {task.estimated_hours}h</span>
                        )}
                        {task.due_date && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full ${
                          task.status === 'completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                        disabled={createTask.isPending}
                        className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {createTask.isPending ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Edit3 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={deleteTask.isPending}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deleteTask.isPending ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No tasks yet. Generate some subtasks to get started!</p>
            </div>
          )}
        </div>
        
                 {/* Divider */}
         <div className="border-t border-gray-200 dark:border-gray-700 my-8" />
         
         {/* Generate New Tasks Section - Only show when not adding a new task */}
         {(() => {
           console.log('🔍 Conditional rendering check:', { isAddingNewTask, shouldShowSubtasks: !isAddingNewTask });
           return !isAddingNewTask;
         })() ? (
           <div>
             <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
               Generate New Subtasks
             </h4>
             <NaturalLanguageTaskCapture 
               onTaskCreate={(task) => {
                 console.log('Task created for project:', task);
                 // The task should automatically be linked to the project via the database
                 // With optimistic updates, the UI should update automatically
                 // No need for manual page reload
               }}
               projectId={project.id}
             />
           </div>
         ) : (
           /* Show message when adding new task */
           <div className="text-center py-8 text-gray-500 dark:text-gray-400">
             <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p>Creating new task...</p>
             <p className="text-sm mt-2">Subtask generation will be available once the task is created.</p>
             <p className="text-xs mt-1 text-gray-400">Debug: isAddingNewTask = {isAddingNewTask.toString()}</p>
           </div>
         )}
      </div>
    </div>
  );
}
