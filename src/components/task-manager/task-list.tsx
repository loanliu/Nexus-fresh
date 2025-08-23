// Task Manager MVP Task List Component
// Phase 1: Core Task Display and Filtering

'use client';

import { useState } from 'react';
import { Search, Filter, Calendar, Tag, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTasks, useProjects, useLabels } from '@/hooks/use-task-manager';
import { Task, FilterConfig, TASK_STATUSES, PRIORITIES } from '@/types/task-manager';
import { TaskCard } from './task-card';

interface TaskListProps {
  onEditTask?: (task: Task) => void;
}

export function TaskList({ onEditTask }: TaskListProps) {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: labels = [] } = useLabels();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>({});

  // Apply filters
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filters.status?.length && !filters.status.includes(task.status)) {
      return false;
    }

    // Priority filter
    if (filters.priority?.length && !filters.priority.includes(task.priority)) {
      return false;
    }

    // Project filter
    if (filters.project_id?.length && task.project_id && !filters.project_id.includes(task.project_id)) {
      return false;
    }

    // Label filter
    if (filters.labels?.length && task.labels && 
        !filters.labels.some(labelId => task.labels?.some(label => label.id === labelId))) {
      return false;
    }

    return true;
  });

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery;

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              size="sm"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  {TASK_STATUSES.map((status) => (
                    <label key={status.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(status.value) || false}
                        onChange={(e) => {
                          const newStatuses = e.target.checked
                            ? [...(filters.status || []), status.value]
                            : (filters.status || []).filter(s => s !== status.value);
                          setFilters({ ...filters, status: newStatuses });
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="space-y-2">
                  {PRIORITIES.map((priority) => (
                    <label key={priority.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.priority?.includes(priority.value) || false}
                        onChange={(e) => {
                          const newPriorities = e.target.checked
                            ? [...(filters.priority || []), priority.value]
                            : (filters.priority || []).filter(p => p !== priority.value);
                          setFilters({ ...filters, priority: newPriorities });
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{priority.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <div className="space-y-2">
                  {projects.map((project) => (
                    <label key={project.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.project_id?.includes(project.id) || false}
                        onChange={(e) => {
                          const newProjects = e.target.checked
                            ? [...(filters.project_id || []), project.id]
                            : (filters.project_id || []).filter(p => p !== project.id);
                          setFilters({ ...filters, project_id: newProjects });
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{project.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Labels Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labels
                </label>
                <div className="space-y-2">
                  {labels.map((label) => (
                    <label key={label.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.labels?.includes(label.id) || false}
                        onChange={(e) => {
                          const newLabels = e.target.checked
                            ? [...(filters.labels || []), label.id]
                            : (filters.labels || []).filter(l => l !== label.id);
                          setFilters({ ...filters, labels: newLabels });
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{label.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          {hasActiveFilters && ` (filtered from ${tasks.length} total)`}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FolderOpen className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          </h3>
          <p className="text-gray-500">
            {hasActiveFilters 
              ? 'Try adjusting your filters or create a new task.'
              : 'Get started by creating your first task.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEditTask={onEditTask} />
          ))}
        </div>
      )}
    </div>
  );
}
