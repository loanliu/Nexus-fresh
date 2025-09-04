'use client';

import React, { useState } from 'react';
import { Task } from '@/types/project-management';
import { useTasks } from '@/hooks/useTasks';
import { TaskModal } from './TaskModal';

interface TaskListProps {
  projectId?: string;
}

export function TaskList({ projectId }: TaskListProps) {
  const [editing, setEditing] = useState<Task | null>(null);
  const { data: tasks = [], isLoading, error } = useTasks(projectId);

  console.log('🔍 TaskList: Render with projectId:', projectId);
  console.log('🔍 TaskList: tasks data:', tasks);
  console.log('🔍 TaskList: isLoading:', isLoading);
  console.log('🔍 TaskList: error:', error);

  const handleEditTask = (task: Task) => {
    setEditing(task);
  };

  const handleCloseModal = () => {
    setEditing(null);
  };

  if (isLoading) {
    console.log('🔍 TaskList: Showing loading state');
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    console.log('🔍 TaskList: Showing error state:', error);
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">
        <p>Error loading tasks: {error.message}</p>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer">Show error details</summary>
          <pre className="mt-2 text-left bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  if (tasks.length === 0) {
    console.log('🔍 TaskList: Showing empty state');
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No tasks found.</p>
        <p className="text-sm mt-1">Project ID: {projectId || 'all'}</p>
        <p className="text-sm">Total tasks in database: {tasks.length}</p>
      </div>
    );
  }

  console.log('🔍 TaskList: Rendering tasks list with', tasks.length, 'tasks');
  return (
    <div>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li 
            key={task.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleEditTask(task)}
          >
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {task.description}
                </p>
              )}
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span>ID: {task.id}</span>
                {task.sort_order !== undefined && (
                  <span>Order: {task.sort_order}</span>
                )}
                {task.project_id && (
                  <span>Project: {task.project_id}</span>
                )}
                {task.status && (
                  <span className={`px-2 py-1 rounded-full ${
                    task.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : task.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                )}
                {task.priority && (
                  <span className={`px-2 py-1 rounded-full ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                    : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {task.priority}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <TaskModal
          task={editing}
          projectId={projectId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
