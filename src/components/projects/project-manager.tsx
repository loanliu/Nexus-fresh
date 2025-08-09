'use client';

import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, CheckSquare, Users } from 'lucide-react';

export function ProjectManager() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Project Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage client projects and onboarding checklists
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <FolderOpen className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Project Management Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          This feature will include client onboarding checklists for Voice Agent Services, 
          N8N Automations, and Chatbot Services with dynamic task generation.
        </p>
      </div>
    </div>
  );
}
