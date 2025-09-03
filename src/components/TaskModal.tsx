'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Calendar, Clock, Tag } from 'lucide-react';
import { useUpdateTask } from '@/hooks/useUpdateTask';
import { useCreateTask } from '@/hooks/use-project-management';
import { Task } from '@/hooks/useTasks';
import { SubtaskList } from '@/components/subtasks/SubtaskList';
import { useAuth } from '@/components/auth/auth-provider'; // ✅ Correct import path
import { toast } from 'react-hot-toast'; // ✅ Make sure this import exists

interface TaskModalProps {
  task: Task;
  projectId?: string;
  onClose: () => void;
}

export function TaskModal({ task, projectId, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [effort, setEffort] = useState(task.effort);
  const [estimatedHours, setEstimatedHours] = useState(task.estimated_hours || 8);
  const [dueDate, setDueDate] = useState(() => {
    if (!task.due_date) return '';
    // Convert the database date to YYYY-MM-DD format for the date input
    // Use UTC methods to avoid timezone conversion issues
    console.log('🔍 TaskModal: Converting date:', task.due_date);
    const date = new Date(task.due_date);
    console.log('🔍 TaskModal: Parsed date:', date);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    console.log('🔍 TaskModal: Formatted date for input:', formattedDate);
    return formattedDate;
  });
  
  const updateTask = useUpdateTask(projectId);
  const createTask = useCreateTask(); // Add this for new tasks
  const { user } = useAuth(); // ✅ This should get the authenticated user
  // Add debug logging to see what's happening
  console.log('🔍 TaskModal: Auth state:', { 
    user, 
    userId: user?.id, 
    isAuthenticated: !!user?.id 
  });

  // Check if this is a temporary task (needs to be created)
  const isTemporaryTask = task.id.startsWith('temp-');

  const handleSave = async () => {
    try {
      if (isTemporaryTask) {
        // ✅ Check if user is authenticated FIRST
        if (!user?.id) {
          console.error('❌ TaskModal: No authenticated user found');
          toast.error('Please sign in to create tasks');
          return;
        }
        
        // Create new task
        console.log('🔄 TaskModal: Creating new task:', { 
          title, 
          description, 
          status: status || null,
          priority: priority || null,
          effort: effort || null,
          estimated_hours: estimatedHours || null,
          due_date: dueDate || null,
          projectId,
          userId: user.id // ✅ Now user.id should be defined
        });
        
        const newTaskData = {
          title,
          description,
          status: (status || 'pending') as 'pending' | 'in_progress' | 'completed' | 'cancelled',
          priority: (priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
          effort: effort || 3,
          estimated_hours: estimatedHours || 8,
          project_id: projectId!,
          user_id: user.id,
          sort_order: 1
        };
        
        console.log(' TaskModal: Sending task data:', newTaskData);
        await createTask.mutateAsync(newTaskData);
        console.log('✅ TaskModal: Task created successfully');
      } else {
        // Update existing task
        console.log('🔄 TaskModal: Updating existing task:', { 
          id: task.id, 
          title, 
          description, 
          status: status || null,
          priority: priority || null,
          effort: effort || null,
          estimated_hours: estimatedHours || null,
          due_date: dueDate || null,
          projectId 
        });
        
        await updateTask.mutateAsync({ 
          id: task.id, 
          title, 
          description,
          status: status || null,
          priority: priority || null,
          effort: effort || null,
          estimated_hours: estimatedHours || null,
          due_date: dueDate || null
        });
        
        console.log('✅ TaskModal: Task updated successfully');
      }
      
      onClose(); // List is already updated via cache
    } catch (error) {
      console.error('❌ TaskModal: Failed to save task:', error);
      // Error is handled by the mutation hook
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isTemporaryTask ? 'Create New Task' : 'Edit Task'}
          </h3>
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={6}
              maxLength={1000}
              placeholder="Describe the task in detail (up to 1000 characters)"
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {description.length}/1000 characters
              </span>
              {description.length >= 100 && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  ✓ Good detail level
                </span>
              )}
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Effort and Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Effort (1-5)
              </label>
              <select
                value={effort}
                onChange={(e) => setEffort(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Estimated Hours
              </label>
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 8)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                min="0"
                step="0.5"
                placeholder="8"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Due Date
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {dueDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDueDate('')}
                  className="px-3"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Subtasks Section - Only show for real tasks, not temporary ones */}
          {!task.id.startsWith('temp-') && (
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                📋 Subtasks
              </h4>
              <SubtaskList taskId={task.id} className="mt-3" />
            </div>
          )}
          
          {/* Show message for temporary tasks */}
          {task.id.startsWith('temp-') && (
            <div className="border-t pt-4">
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p className="text-sm">📋 Subtasks will be available after you save the task</p>
                <p className="text-xs mt-1">Save the task first to add subtasks</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateTask.isPending || createTask.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={(updateTask.isPending || createTask.isPending) || !title.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateTask.isPending || createTask.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {isTemporaryTask ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              isTemporaryTask ? 'Create Task' : 'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}