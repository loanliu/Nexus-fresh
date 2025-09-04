// Task Manager MVP Task Form Component
// Phase 1: Core Task Creation/Editing

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Clock, Tag, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCreateTask, useUpdateTask, useProjects, useLabels } from '@/hooks/use-task-manager';
import { Task, TaskFormData, TASK_STATUSES, PRIORITIES, PROJECT_COLORS } from '@/types/task-manager';
import React from 'react'; // Added missing import

// Form validation schema
const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional().or(z.literal('')),
  estimated_hours: z.union([z.string(), z.number()]).optional().or(z.literal('')).transform((val) => {
    if (val === '' || val === undefined) return undefined;
    if (typeof val === 'number') return val;
    const num = parseFloat(val);
    if (isNaN(num)) return undefined;
    return num;
  }),
  project_id: z.string().optional().or(z.literal('')),
  parent_task_id: z.string().optional().or(z.literal('')),
  // label_ids is handled separately through selectedLabels state
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task; // If provided, edit mode
  onSuccess?: (message: string) => void;
}

export function TaskForm({ open, onClose, task, onSuccess }: TaskFormProps) {
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  
  const { data: projects = [] } = useProjects();
  const { data: labels = [] } = useLabels();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isEditMode = !!task;
  
  console.log('TaskForm render - isEditMode:', isEditMode, 'task:', task);
  console.log('Task labels:', task?.labels);
  console.log('Selected labels state:', selectedLabels);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
  });

  // Reset form when task changes (switching between create/edit modes)
  React.useEffect(() => {
    if (task) {
      // Edit mode - populate form with task data
      reset({
        title: task.title,
        description: task.description || undefined,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? (() => {
          // Convert the database date to YYYY-MM-DD format for the date input
          // Use UTC methods to avoid timezone conversion issues
          console.log('🔍 TaskForm: Converting date:', task.due_date);
          const date = new Date(task.due_date);
          console.log('🔍 TaskForm: Parsed date:', date);
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          console.log('🔍 TaskForm: Formatted date for input:', formattedDate);
          return formattedDate;
        })() : undefined,
        estimated_hours: task.estimated_hours || undefined,
        project_id: task.project_id || undefined,
        parent_task_id: task.parent_task_id || undefined,
        // Remove label_ids since we handle labels separately
      });
      
      // Handle labels - they might be label objects or just IDs
      if (task.labels && Array.isArray(task.labels)) {
        const labelIds = task.labels.map(label => 
          typeof label === 'string' ? label : label.id
        );
        setSelectedLabels(labelIds);
      } else {
        setSelectedLabels([]);
      }
    } else {
      // Create mode - reset to defaults
      reset({
        title: '',
        description: undefined,
        status: 'pending',
        priority: 'medium',
        due_date: undefined,
        estimated_hours: undefined,
        project_id: undefined,
        parent_task_id: undefined,
        // Remove label_ids since we handle labels separately
      });
      setSelectedLabels([]);
    }
  }, [task, reset]);

  const watchedProjectId = watch('project_id');
  const selectedProject = projects.find(p => p.id === watchedProjectId);

  const onSubmit = async (data: TaskFormValues) => {
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form submitted with data:', data);
    console.log('Raw form data:', data);
    console.log('Is edit mode:', isEditMode);
    console.log('Current task:', task);
    console.log('Form errors:', errors);
    console.log('Form errors details:', Object.entries(errors));
    console.log('Selected labels:', selectedLabels);
    
    try {
      // Clean up the data - convert empty strings to undefined for optional fields
      const cleanedData: TaskFormData = {
        ...data,
        project_id: data.project_id || undefined,
        parent_task_id: data.parent_task_id || undefined,
        due_date: data.due_date || undefined,
        estimated_hours: data.estimated_hours || undefined,
        description: data.description || undefined,
      };

      console.log('Cleaned data (without label_ids):', cleanedData);

      if (isEditMode && task) {
        console.log('Updating task with ID:', task.id);
        console.log('Selected labels for update:', selectedLabels);
        // For editing, we need to handle labels separately since Task doesn't have label_ids
        const result = await updateTask.mutateAsync({
          id: task.id,
          ...cleanedData,
          label_ids: selectedLabels, // Pass the selected labels for updating
        });
        console.log('Update result:', result);
        // Labels are now handled inside the useUpdateTask hook
      } else {
        console.log('Creating new task');
        const result = await createTask.mutateAsync({
          ...cleanedData,
          label_ids: selectedLabels,
        });
        console.log('Create result:', result);
      }
      
      console.log('=== FORM SUBMISSION SUCCESSFUL ===');
      reset();
      setSelectedLabels([]);
      onClose();
      onSuccess?.('Task saved successfully!');
    } catch (error) {
      console.error('=== FORM SUBMISSION FAILED ===');
      console.error('Failed to save task:', error);
    }
  };

  const handleSubmitClick = () => {
    console.log('Submit button clicked!');
    console.log('Form state:', { isEditMode, task, errors });
  };

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleClose = () => {
    reset();
    setSelectedLabels([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode ? `Editing: ${task?.title}` : 'Create a new task'}
            </p>
            {/* Debug info */}
            <div className="text-xs text-gray-400 mt-1">
              Mode: {isEditMode ? 'EDIT' : 'CREATE'} | 
              Task ID: {task?.id || 'N/A'} | 
              Form Errors: {Object.keys(errors).length}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log('=== FORM VALIDATION FAILED ===');
            console.log('Validation errors:', errors);
          })} 
          className="p-6 space-y-6"
        >
          {/* Validation Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>
                        <strong>{field}:</strong> {error?.message || 'Invalid value'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Help Message */}
          {(projects.length === 0 || labels.length === 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Getting Started</p>
                  <ul className="list-disc list-inside space-y-1">
                    {projects.length === 0 && <li>Create a project first to organize your tasks</li>}
                    {labels.length === 0 && <li>Create labels to categorize your tasks</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <Input
              {...register('title')}
              placeholder="Enter task title..."
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Enter task description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date and Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Due Date
              </label>
              <Input
                type="date"
                {...register('due_date')}
                className="w-full"
                value={watch('due_date') || ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Estimated Hours
              </label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                max="168"
                {...register('estimated_hours')}
                placeholder="0.25"
                className={errors.estimated_hours ? 'border-red-500' : ''}
              />
              {errors.estimated_hours && (
                <p className="mt-1 text-sm text-red-600">{errors.estimated_hours.message}</p>
              )}
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FolderOpen className="inline h-4 w-4 mr-1" />
              Project
            </label>
            <select
              {...register('project_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No Project</option>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No projects available - create a project first
                </option>
              )}
            </select>
            {projects.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Create a project first to assign tasks to it
              </p>
            )}
          </div>

          {/* Labels Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Labels
            </label>
            {labels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant={selectedLabels.includes(label.id) ? "default" : "secondary"}
                    className={`cursor-pointer transition-colors ${
                      selectedLabels.includes(label.id) 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedLabels.includes(label.id) 
                        ? label.color 
                        : label.color + '20',
                      color: selectedLabels.includes(label.id) 
                        ? 'white' 
                        : label.color,
                    }}
                    onClick={() => handleLabelToggle(label.id)}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                <Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No labels available</p>
                <p className="text-xs text-gray-400">Create labels to categorize your tasks</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
              onClick={handleSubmitClick}
            >
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
