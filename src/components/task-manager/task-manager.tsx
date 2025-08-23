// Task Manager MVP Main Component
// Phase 1: Core Navigation and Layout

'use client';

import { useState } from 'react';
import { Plus, List, CheckSquare, Bookmark, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskList } from './task-list';
import { MyTasks } from './my-tasks';
import { SavedFilters } from './saved-filters';
import { TaskForm } from './task-form';
import { ProjectForm } from './project-form';
import { LabelForm } from './label-form';
import { Task } from '@/types/task-manager';

type View = 'list' | 'my-tasks' | 'saved-filters';

export function TaskManager() {
  const [activeView, setActiveView] = useState<View>('list');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const navigation = [
    {
      id: 'list' as View,
      name: 'All Tasks',
      icon: List,
      description: 'View and manage all tasks'
    },
    {
      id: 'my-tasks' as View,
      name: 'My Tasks',
      icon: CheckSquare,
      description: 'Tasks assigned to you'
    },
    {
      id: 'saved-filters' as View,
      name: 'Saved Filters',
      icon: Bookmark,
      description: 'Custom task views'
    }
  ];

  const handleProjectCreated = () => {
    setSuccessMessage('Project created successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleLabelCreated = () => {
    setSuccessMessage('Label created successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleTaskSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(undefined);
  };

  const renderView = () => {
    switch (activeView) {
      case 'list':
        return <TaskList onEditTask={handleEditTask} />;
      case 'my-tasks':
        return <MyTasks onEditTask={handleEditTask} />;
      case 'saved-filters':
        return <SavedFilters />;
      default:
        return <TaskList onEditTask={handleEditTask} />;
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Organize your work</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            onClick={() => setShowTaskForm(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowProjectForm(true)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              New Project
            </Button>
            <Button
              onClick={() => setShowLabelForm(true)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              New Label
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {navigation.find(n => n.id === activeView)?.name}
              </h2>
              <p className="text-sm text-gray-500">
                {navigation.find(n => n.id === activeView)?.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowTaskForm(true)}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderView()}
        </div>
      </div>

      {/* Modals */}
      {showTaskForm && (
        <TaskForm
          open={showTaskForm}
          onClose={handleCloseTaskForm}
          task={editingTask}
          onSuccess={handleTaskSuccess}
        />
      )}

      {showProjectForm && (
        <ProjectForm
          open={showProjectForm}
          onClose={() => setShowProjectForm(false)}
          onSuccess={handleProjectCreated}
        />
      )}

      {showLabelForm && (
        <LabelForm
          open={showLabelForm}
          onClose={() => setShowLabelForm(false)}
          onSuccess={handleLabelCreated}
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {successMessage}
        </div>
      )}
    </div>
  );
}
