// Task Manager MVP My Tasks Component
// Phase 1: Core My Tasks View

'use client';

import { useTasks } from '@/hooks/use-task-manager';
import { TaskCard } from './task-card';
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '@/types/task-manager';

interface MyTasksProps {
  onEditTask?: (task: Task) => void;
}

export function MyTasks({ onEditTask }: MyTasksProps) {
  const { data: tasks = [], isLoading } = useTasks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading your tasks...</div>
      </div>
    );
  }

  // Filter tasks for current user (all tasks since it's single user)
  const myTasks = tasks;

  // Group tasks by status
  const pendingTasks = myTasks.filter(task => task.status === 'pending');
  const inProgressTasks = myTasks.filter(task => task.status === 'in_progress');
  const completedTasks = myTasks.filter(task => task.status === 'completed');

  // Get overdue tasks
  const overdueTasks = myTasks.filter(task => 
    task.due_date && new Date(task.due_date) < new Date()
  );

  // Get due soon tasks (next 3 days)
  const dueSoonTasks = myTasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  });

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{myTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">To Do</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{inProgressTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{completedTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Overdue Tasks ({overdueTasks.length})
            </h3>
          </div>
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEditTask={onEditTask} />
            ))}
          </div>
        </div>
      )}

      {/* Due Soon Tasks */}
      {dueSoonTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Due Soon ({dueSoonTasks.length})
            </h3>
          </div>
          <div className="space-y-3">
            {dueSoonTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEditTask={onEditTask} />
            ))}
          </div>
        </div>
      )}

      {/* Tasks by Status */}
      <div className="space-y-8">
        {/* To Do Tasks */}
        {pendingTasks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending ({pendingTasks.length})
            </h3>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEditTask={onEditTask} />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Tasks */}
        {inProgressTasks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              In Progress ({inProgressTasks.length})
            </h3>
            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEditTask={onEditTask} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Completed ({completedTasks.length})
            </h3>
            <div className="space-y-3">
              {completedTasks.slice(0, 10).map((task) => (
                <TaskCard key={task.id} task={task} onEditTask={onEditTask} />
              ))}
              {completedTasks.length > 10 && (
                <div className="text-center py-4 text-gray-500">
                  <p>Showing last 10 completed tasks</p>
                  <p className="text-sm">Total completed: {completedTasks.length}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {myTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <CheckSquare className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-500">
            Get started by creating your first task.
          </p>
        </div>
      )}
    </div>
  );
}
