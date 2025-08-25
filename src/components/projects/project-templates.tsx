'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy,
  Settings,
  Clock,
  Target,
  Users,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProjectTemplates, useCreateProjectTemplate, useUpdateProjectTemplate, useDeleteProjectTemplate } from '@/hooks/use-project-management';
import { ProjectTemplate, TemplateData, TemplateTask, CreateProjectTemplateData } from '@/types/project-management';
import { useAuth } from '@/components/auth/auth-provider';

interface ProjectTemplatesProps {
  onTemplateUse: (template: ProjectTemplate) => void;
}

export function ProjectTemplates({ onTemplateUse }: ProjectTemplatesProps) {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: templates = [], isLoading } = useProjectTemplates();
  const createTemplate = useCreateProjectTemplate();
  const updateTemplate = useUpdateProjectTemplate();
  const deleteTemplate = useDeleteProjectTemplate();

  const [newTemplate, setNewTemplate] = useState<CreateProjectTemplateData>({
    name: '',
    description: '',
    category: 'Custom',
    estimated_duration: 7,
    complexity: 'moderate',
    tasks: [],
    user_id: user?.id || ''
  });

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      await createTemplate.mutateAsync(newTemplate);
      setNewTemplate({
        name: '',
        description: '',
        category: 'Custom',
        estimated_duration: 7,
        complexity: 'moderate',
        tasks: [],
        user_id: user?.id || ''
      });
      setShowCreateModal(false);
      toast.success('Template created successfully!');
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        updates: {
          id: editingTemplate.id,
          name: newTemplate.name,
          description: newTemplate.description,
          category: newTemplate.category,
          estimated_duration: newTemplate.estimated_duration,
          complexity: newTemplate.complexity,
          tasks: newTemplate.tasks,
          user_id: newTemplate.user_id
        }
      });
      setShowEditModal(false);
      setEditingTemplate(null);
      toast.success('Template updated successfully!');
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate.mutateAsync(templateId);
        toast.success('Template deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleUseTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleConfirmUseTemplate = () => {
    if (selectedTemplate) {
      onTemplateUse(selectedTemplate);
      setShowPreview(false);
      setSelectedTemplate(null);
      toast.success('Template applied successfully!');
    }
  };

  const addTaskToTemplate = () => {
    setNewTemplate(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        title: '',
        description: '',
        priority: 'medium',
        effort: 3,
        estimated_hours: 8
      }]
    }));
  };

  const removeTaskFromTemplate = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const updateTaskInTemplate = (index: number, field: keyof TemplateTask, value: any) => {
    setNewTemplate(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Web Development': return 'bg-blue-100 text-blue-800';
      case 'Mobile App': return 'bg-green-100 text-green-800';
      case 'Design': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Templates</h2>
          <p className="text-gray-600">Save time with reusable project templates</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {template.description || 'No description'}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {template.estimated_duration} days
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {template.template_data.tasks.length} tasks
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleUseTemplate(template)}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              <Button
                onClick={() => {
                  setEditingTemplate(template);
                  setNewTemplate({
                    name: template.name,
                    description: template.description || '',
                    category: template.category,
                    estimated_duration: template.estimated_duration,
                    complexity: 'moderate',
                    tasks: template.template_data.tasks,
                    user_id: template.user_id
                  });
                  setShowEditModal(true);
                }}
                size="sm"
                variant="outline"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleDeleteTemplate(template.id)}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Template</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter template description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Design">Design</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newTemplate.estimated_duration}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              {/* Tasks Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Template Tasks
                  </label>
                  <Button
                    onClick={addTaskToTemplate}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>

                <div className="space-y-3">
                  {newTemplate.tasks.map((task, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTaskInTemplate(index, 'title', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Task title"
                        />
                        <Button
                          onClick={() => removeTaskFromTemplate(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={task.priority}
                          onChange={(e) => updateTaskInTemplate(index, 'priority', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>

                        <select
                          value={task.effort}
                          onChange={(e) => updateTaskInTemplate(index, 'effort', parseInt(e.target.value))}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select>

                        <input
                          type="number"
                          value={task.estimated_hours || 8}
                          onChange={(e) => updateTaskInTemplate(index, 'estimated_hours', parseInt(e.target.value) || 0)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                          placeholder="Hours"
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={createTemplate.isPending}
              >
                {createTemplate.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter template description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Design">Design</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newTemplate.estimated_duration}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              {/* Tasks Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Template Tasks
                  </label>
                  <Button
                    onClick={addTaskToTemplate}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>

                <div className="space-y-3">
                  {newTemplate.tasks.map((task, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTaskInTemplate(index, 'title', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Task title"
                        />
                        <Button
                          onClick={() => removeTaskFromTemplate(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={task.priority}
                          onChange={(e) => updateTaskInTemplate(index, 'priority', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>

                        <select
                          value={task.effort}
                          onChange={(e) => updateTaskInTemplate(index, 'effort', parseInt(e.target.value))}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select>

                        <input
                          type="number"
                          value={task.estimated_hours || 8}
                          onChange={(e) => updateTaskInTemplate(index, 'estimated_hours', parseInt(e.target.value) || 0)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                          placeholder="Hours"
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={updateTemplate.isPending}
              >
                {updateTemplate.isPending ? 'Updating...' : 'Update Template'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Template Preview</h3>
              <p className="text-gray-600 text-sm mt-1">
                Review the template before applying it to your project
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedTemplate.name}</h4>
                <p className="text-gray-600 text-sm mb-3">
                  {selectedTemplate.description || 'No description'}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedTemplate.category)}`}>
                    {selectedTemplate.category}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {selectedTemplate.estimated_duration} days
                  </span>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-3">Tasks ({selectedTemplate.template_data.tasks.length})</h5>
                <div className="space-y-2">
                  {selectedTemplate.template_data.tasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-600">{task.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span>Effort: {task.effort}</span>
                        {task.estimated_hours && (
                          <span>~{task.estimated_hours}h</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUseTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                Use This Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {templates.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first project template to save time on future projects
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      )}
    </div>
  );
}
