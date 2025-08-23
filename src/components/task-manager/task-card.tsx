// Task Manager MVP Task Card Component
// Phase 1: Core Task Display

'use client';

import { useState } from 'react';
import { Calendar, Clock, Tag, MessageSquare, Paperclip, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task, TASK_STATUSES, PRIORITIES } from '@/types/task-manager';
import { useUpdateTask } from '@/hooks/use-task-manager';

interface TaskCardProps {
  task: Task;
  onEditTask?: (task: Task) => void;
}

export function TaskCard({ task, onEditTask }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const updateTask = useUpdateTask();

  const statusConfig = TASK_STATUSES.find(s => s.value === task.status);
  const priorityConfig = PRIORITIES.find(p => p.value === task.priority);

  const handleStatusChange = async (newStatus: Task['status']) => {
    try {
      await updateTask.mutateAsync({ id: task.id, status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handlePriorityChange = async (newPriority: Task['priority']) => {
    try {
      await updateTask.mutateAsync({ id: task.id, priority: newPriority });
    } catch (error) {
      console.error('Failed to update task priority:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const hasComments = task.comments && task.comments.length > 0;
  const hasAttachments = task.attachments && task.attachments.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Task Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Title and Expand Button */}
            <div className="flex items-center space-x-2 mb-2">
              {hasSubtasks && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {task.title}
              </h3>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Project and Labels */}
            <div className="flex items-center space-x-3 mb-3">
              {task.project && (
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.project.color }}
                  />
                  <span className="text-xs text-gray-600">{task.project.name}</span>
                </div>
              )}
              
              {task.labels && task.labels.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="h-3 w-3 text-gray-400" />
                  <div className="flex space-x-1">
                    {task.labels.slice(0, 3).map((label) => (
                      <Badge
                        key={label.id}
                        variant="secondary"
                        className="text-xs px-2 py-1"
                        style={{ backgroundColor: label.color + '20', color: label.color }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                    {task.labels.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        +{task.labels.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status and Priority Controls */}
            <div className="flex items-center space-x-3 mb-3">
              {/* Status Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Status:</span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Priority:</span>
                <select
                  value={task.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as Task['priority'])}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Meta Information */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {task.due_date && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span className={task.due_date < new Date().toISOString() ? 'text-red-600 font-medium' : ''}>
                    {formatDate(task.due_date)}
                  </span>
                </div>
              )}
              
              {task.estimated_hours && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{task.estimated_hours}h</span>
                </div>
              )}
              
              {hasComments && (
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task.comments!.length}</span>
                </div>
              )}
              
              {hasAttachments && (
                <div className="flex items-center space-x-1">
                  <Paperclip className="h-3 w-3" />
                  <span>{task.attachments!.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            {onEditTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditTask(task)}
                className="h-8 px-3"
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Subtasks Section */}
      {isExpanded && hasSubtasks && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Subtasks ({task.subtasks!.length})</h4>
          <div className="space-y-2">
            {task.subtasks!.map((subtask) => (
              <div key={subtask.id} className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-gray-600">{subtask.title}</span>
                {subtask.status !== 'todo' && (
                  <Badge variant="secondary" className="text-xs px-1 py-0.5">
                    {TASK_STATUSES.find(s => s.value === subtask.status)?.label}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
