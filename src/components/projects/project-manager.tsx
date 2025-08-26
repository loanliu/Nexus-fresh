'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FolderOpen, 
  CheckSquare, 
  Users, 
  Calendar,
  Clock,
  Target,
  Zap,
  Play,
  Settings,
  Bell,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';

import { MyDayControlCenter } from './my-day-control-center';
import { PlanMyWeek } from './plan-my-week';
import { ProjectTemplates } from './project-templates';
import { DailyDigest } from './daily-digest';
import { ProjectList } from './project-list';
import { CreateProjectModal } from './create-project-modal';
import { useProjects, useCreateProject } from '@/hooks/use-project-management';
import { Project } from '@/types/project-management';
import { useAuth } from '@/components/auth/auth-provider';

type View = 'projects' | 'my-day' | 'plan-week' | 'templates' | 'digest';

export function ProjectManager() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<View>('projects');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use database hooks instead of localStorage
  const { data: projects = [], isLoading, error } = useProjects();
  const createProject = useCreateProject();

  const navigationTabs = [
    { id: 'projects', label: 'Projects', icon: FolderOpen, description: 'Manage all projects' },
    { id: 'my-day', label: 'My Day', icon: Calendar, description: 'Today\'s focus & next 7 days' },
    { id: 'plan-week', label: 'Plan Week', icon: Target, description: 'Capacity-aware weekly planning' },
    { id: 'templates', label: 'Templates', icon: FileText, description: 'Project templates & playbooks' },
    { id: 'digest', label: 'Daily Digest', icon: Bell, description: 'Proactive alerts & notifications' }
  ];

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    project.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'projects':
        return <ProjectList projects={filteredProjects} />;
      case 'my-day':
        return <MyDayControlCenter onTaskUpdate={(task) => {
          // Handle task updates
          console.log('Task updated:', task);
        }} />;
      case 'plan-week':
        return <PlanMyWeek onPlanUpdate={(plan) => {
          // Handle plan updates
          console.log('Plan updated:', plan);
        }} />;
      case 'templates':
        return <ProjectTemplates onTemplateUse={(template) => {
          // Handle template usage
          console.log('Template used:', template);
          setActiveView('projects');
        }} />;
      case 'digest':
        return <DailyDigest />;
      default:
        return <ProjectList projects={filteredProjects} />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Projects
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Failed to load projects'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Project Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced project management with task tracking and AI-powered subtask generation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>



      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as View)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active View Content */}
      <div className="min-h-[600px]">
        {renderActiveView()}
      </div>

             {/* Create Project Modal */}
       {showCreateModal && (
         <CreateProjectModal
           onClose={() => setShowCreateModal(false)}
           onProjectCreate={(project) => {
             // The project will be automatically added to the projects list via the hook
             setShowCreateModal(false);
           }}
           onOpenSubtasks={(project) => {
             // This will be handled by the ProjectList component
             console.log('Project created, opening subtasks for:', project);
           }}
         />
       )}
    </div>
  );
}
