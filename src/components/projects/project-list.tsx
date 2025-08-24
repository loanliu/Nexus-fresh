'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  CheckSquare, 
  Clock, 
  Target, 
  Edit3, 
  Trash2,
  Plus,
  Eye,
  Calendar,
  Users,
  BarChart3,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Project, Task } from '@/types/project-management';
import { useUpdateProject, useDeleteProject, useArchiveProject, useUpdateTask, useDeleteTask, useCreateTask } from '@/hooks/use-project-management';
import { CreateProjectModal } from './create-project-modal';
import { NaturalLanguageTaskCapture } from './natural-language-task-capture';

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
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Debug logging
  console.log('ProjectList received projects:', projects);
  
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const archiveProject = useArchiveProject();
  const updateTask = useUpdateTask();
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
    setEditingTask(task);
    setShowEditTaskModal(true);
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

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!editingTask || !currentProject) return;
    
    try {
      console.log('handleUpdateTask called with:', { editingTask, taskData, currentProject });
      
      // Extract only the fields that can be updated (exclude id, created_at, updated_at, user_id)
      const updates = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        due_date: taskData.due_date,
        estimated_hours: taskData.estimated_hours,
        effort: taskData.effort,
        project_id: taskData.project_id,
        parent_task_id: taskData.parent_task_id
      };
      
      console.log('Extracted updates:', updates);
      
      // Check if this is a new task (temporary ID) or existing task
      if (editingTask.id.startsWith('temp-')) {
        // This is a new task, create it
        const newTaskData = {
          title: updates.title || '',
          description: updates.description || '',
          status: updates.status || 'pending',
          priority: updates.priority || 'medium',
          effort: updates.effort || 3,
          estimated_hours: updates.estimated_hours,
          due_date: updates.due_date,
          project_id: currentProject.id,
          user_id: '', // Will be filled by the backend
          label_ids: []
        };
        console.log('Creating new task:', newTaskData);
        await createTask.mutateAsync(newTaskData);
      } else {
        // This is an existing task, update it
        const updateData = { ...updates, id: editingTask.id };
        console.log('Updating existing task with:', updateData);
        await updateTask.mutateAsync({
          id: editingTask.id,
          updates: updateData
        });
      }
      
      setShowEditTaskModal(false);
      setEditingTask(null);
      // The React Query cache will automatically update
    } catch (error) {
      console.error('Error in handleUpdateTask:', error);
      // Error is already handled by the hook
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

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Manage Tasks for: {currentProject.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View, edit, and generate new subtasks for your project
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowSubtasksModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Existing Tasks Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Existing Tasks ({currentProject.tasks?.length || 0})
                </h4>
                                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     // Create a new empty task for this project
                     const newTask: Task = {
                       id: `temp-${Date.now()}`, // Temporary ID
                       title: '',
                       description: '',
                       status: 'pending',
                       priority: 'medium',
                       effort: 3,
                       estimated_hours: undefined,
                       due_date: undefined,
                       project_id: currentProject.id,
                       parent_task_id: undefined,
                       sort_order: 0,
                       created_at: new Date().toISOString(),
                       updated_at: new Date().toISOString(),
                       user_id: '', // Will be filled by the backend
                       labels: [],
                       subtasks: [],
                       comments: [],
                       attachments: [],
                       project: undefined,
                       dependencies: []
                     };
                     setEditingTask(newTask);
                     setShowEditTaskModal(true);
                   }}
                   disabled={createTask.isPending}
                   className="disabled:opacity-50"
                 >
                   {createTask.isPending ? (
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
              
              {currentProject.tasks && currentProject.tasks.length > 0 ? (
                <div className="space-y-3">
                  {[...currentProject.tasks].sort((a, b) => a.title.localeCompare(b.title)).map((task) => (
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
                             disabled={updateTask.isPending}
                             className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                           >
                             {updateTask.isPending ? (
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
            
            {/* Generate New Tasks Section */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Generate New Subtasks
              </h4>
              <NaturalLanguageTaskCapture 
                onTaskCreate={(task) => {
                  console.log('Task created for project:', task);
                  // The task should automatically be linked to the project via the database
                  // Refresh the project data to show the new task
                  window.location.reload();
                }}
                projectId={currentProject.id}
              />
            </div>
                     </div>
         </div>
       )}

       {/* Task Edit Modal */}
       {showEditTaskModal && editingTask && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                 {editingTask.id.startsWith('temp-') ? 'Create New Task' : 'Edit Task'}
               </h3>
               <Button
                 variant="ghost"
                 onClick={() => setShowEditTaskModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-5 w-5" />
               </Button>
             </div>
             
             <form onSubmit={(e) => {
               e.preventDefault();
               const formData = new FormData(e.currentTarget);
               handleUpdateTask({
                 title: formData.get('title') as string,
                 description: formData.get('description') as string,
                 status: formData.get('status') as Task['status'],
                 priority: formData.get('priority') as Task['priority'],
                 effort: parseInt(formData.get('effort') as string),
                 estimated_hours: parseFloat(formData.get('estimated_hours') as string) || undefined,
                 due_date: formData.get('due_date') as string || undefined
               });
             }} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Title *
                 </label>
                 <input
                   type="text"
                   name="title"
                   defaultValue={editingTask.title}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                   required
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Description
                 </label>
                 <textarea
                   name="description"
                   defaultValue={editingTask.description || ''}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                   rows={3}
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Status
                   </label>
                   <select
                     name="status"
                     defaultValue={editingTask.status}
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
                     name="priority"
                     defaultValue={editingTask.priority}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                   >
                     <option value="low">Low</option>
                     <option value="medium">Medium</option>
                     <option value="high">High</option>
                     <option value="urgent">Urgent</option>
                   </select>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Effort (1-5)
                   </label>
                   <select
                     name="effort"
                     defaultValue={editingTask.effort}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                   >
                     {[1, 2, 3, 4, 5].map(num => (
                       <option key={num} value={num}>{num}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Est. Hours
                   </label>
                   <input
                     type="number"
                     name="estimated_hours"
                     defaultValue={editingTask.estimated_hours || ''}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     placeholder="0"
                     min="0"
                     step="0.5"
                   />
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Due Date
                 </label>
                 <input
                   type="date"
                   name="due_date"
                   defaultValue={editingTask.due_date || ''}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                 />
               </div>
               
               <div className="flex justify-end space-x-3 pt-4">
                 <Button
                   type="button"
                   variant="outline"
                   onClick={() => setShowEditTaskModal(false)}
                   disabled={updateTask.isPending || createTask.isPending}
                 >
                   Cancel
                 </Button>
                 <Button 
                   type="submit" 
                   disabled={updateTask.isPending || createTask.isPending}
                   className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {updateTask.isPending || createTask.isPending ? (
                     <>
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                       {editingTask.id.startsWith('temp-') ? 'Creating...' : 'Updating...'}
                     </>
                   ) : (
                     <>
                       <Edit3 className="w-4 h-4 mr-2" />
                       {editingTask.id.startsWith('temp-') ? 'Create Task' : 'Update Task'}
                     </>
                   )}
                 </Button>
               </div>
             </form>
           </div>
         </div>
       )}
     </div>
   );
 }
