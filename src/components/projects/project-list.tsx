'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FolderOpen, 
  CheckSquare, 
  Edit3, 
  Trash2,
  Plus,
  Eye,
  Search,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Project, Task } from '@/types/project-management';
import { useUpdateProject, useDeleteProject, useArchiveProject, useDeleteTask, useCreateTask } from '@/hooks/use-project-management';
import { projectManagementClient } from '@/lib/project-management-client';
import { CreateProjectModal } from './create-project-modal';
import { NaturalLanguageTaskCapture } from './natural-language-task-capture';
import { TaskModal } from '../TaskModal';
import { ManageTasksModal } from './manage-tasks-modal';
import { useAuth } from '@/components/auth/auth-provider';

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showSubtasksModal, setShowSubtasksModal] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Debug logging
  console.log('ProjectList received projects:', projects);
  
  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    project.status.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const archiveProject = useArchiveProject();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject.mutateAsync(projectId);
        toast.success('Project deleted successfully');
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await archiveProject.mutateAsync(projectId);
      toast.success('Project archived successfully');
    } catch (error) {
      toast.error('Failed to archive project');
    }
  };

  const handleUpdateProject = async (projectData: Partial<Project>) => {
    if (!editingProject) return;
    
    try {
      // Extract only the fields that can be updated
      const updates = {
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        color: projectData.color
      };
      
      await updateProject.mutateAsync({
        id: editingProject.id,
        updates
      });
      setShowEditModal(false);
      setEditingProject(null);
      toast.success('Project updated successfully');
    } catch (error) {
      toast.error('Failed to update project');
    }
  };

  const handleOpenSubtasks = (project: Project) => {
    setCurrentProject(project);
    setShowSubtasksModal(true);
  };

  const handleEditTask = (task: Task) => {
    // Always use fresh task data from the projects prop (which comes from React Query)
    // Find the project that contains this task
    const projectWithTask = projects.find(project => 
      project.tasks?.some(t => t.id === task.id)
    );
    
    // Get the fresh task data from the project
    const freshTask = projectWithTask?.tasks?.find(t => t.id === task.id) || task;
    
    console.log('Opening edit modal for task:', { 
      originalTask: task, 
      freshTask, 
      projectWithTask: projectWithTask?.id,
      allProjects: projects.map(p => ({ id: p.id, taskCount: p.tasks?.length || 0 }))
    });
    
    setEditingTask(freshTask);
  };

  const handleCloseTaskModal = () => {
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(taskId);
        // The React Query cache will automatically update
        // No need to reload the page
      } catch (error) {
        // Error is already handled by the hook
      }
    }
  };

  const calculateProgress = (tasks: Task[] = []) => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center py-12">
        {searchQuery ? (
          <>
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Projects Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No projects match your search for "{searchQuery}"
            </p>
            <Button onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </>
        ) : (
          <>
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Projects Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first project
            </p>
            <Button onClick={() => {
              console.log('Create Project button clicked');
              setShowCreateModal(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects by name, description, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery('')}
          >
            Clear
          </Button>
        )}
      </div>
      
      {/* Search Results Count */}
      {searchQuery && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Found {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} matching "{searchQuery}"
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Project Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenSubtasks(project)}
                    title="Manage Tasks"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditProject(project)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchiveProject(project.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {project.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {project.description}
                </p>
              )}

              <div className="flex items-center space-x-4 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {project.tasks?.length || 0} tasks
                </span>
              </div>
            </div>

            {/* Project Progress */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {calculateProgress(project.tasks)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress(project.tasks)}%` }}
                />
              </div>

              {/* Recent Tasks */}
              {project.tasks && project.tasks.length > 0 ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Recent Tasks
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSubtasks(project)}
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        View All ({project.tasks.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSubtasks(project)}
                        className="text-green-600 hover:text-green-700 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Generate More
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[...project.tasks].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center space-x-2 text-sm">
                        <CheckSquare 
                          className={`w-4 h-4 ${
                            task.status === 'completed' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-400'
                          }`}
                        />
                        <span className={`flex-1 ${
                          task.status === 'completed' 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {task.title}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                    {project.tasks.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{project.tasks.length - 3} more tasks
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    No tasks yet
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenSubtasks(project)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Generate Subtasks
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Project Modal for editing */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Project
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={6}
                  maxLength={1000}
                  placeholder="Describe your project in detail (up to 1000 characters)"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(editingProject.description || '').length}/1000 characters
                  </span>
                  {(editingProject.description || '').length >= 500 && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      ✓ Good detail level
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={editingProject.status}
                  onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProject(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => handleUpdateProject(editingProject)}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onProjectCreate={(project) => {
            console.log('Project created in ProjectList:', project);
            setShowCreateModal(false);
            // The React Query cache should automatically update
            // If it's not working, we'll need to investigate further
          }}
          onOpenSubtasks={handleOpenSubtasks}
        />
      )}

      {/* Subtasks Generation Modal */}
      {showSubtasksModal && currentProject && (
        <ManageTasksModal
          project={currentProject}
          onClose={() => setShowSubtasksModal(false)}
          onEditTask={handleEditTask}
        />
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          projectId={currentProject?.id}
          onClose={handleCloseTaskModal}
        />
      )}
    </div>
  );
}
