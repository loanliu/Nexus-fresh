'use client';

import React, { useState } from 'react';
import { TaskList } from '@/components/TaskList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TestTasksPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Real project IDs from your database with task counts
  const realProjectIds = [
    { id: '73f61fba-f685-47b5-a059-299983159a59', name: 'Project 1', taskCount: 5 },
    { id: '451da0fe-b544-48a3-acf2-6d676cf0414b', name: 'Project 2', taskCount: 3 },
    { id: '510d47e7-8b65-4eb5-9499-c64fa76bffeb', name: 'Project 3', taskCount: 5 },
    { id: '8240dbe3-af9b-4b88-91b2-4bebe8c6de8e', name: 'Project 4', taskCount: 1 },
    { id: 'f51a8ff7-da94-45c4-9b59-09ea14c8d529', name: 'Project 5', taskCount: 3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Task Management Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Test the optimistic update system. Select a project ID to see its tasks, or leave empty to see all tasks.
          </p>
          
          <div className="flex items-center space-x-4 mb-6">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Project ID:
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Tasks (17 total)</option>
              {realProjectIds.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.taskCount} tasks)
                </option>
              ))}
            </select>
            
            <Button
              variant="outline"
              onClick={() => setSelectedProjectId('')}
              size="sm"
            >
              Clear Filter
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              🧪 Test Instructions:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Select a project ID to filter tasks (or leave empty for all tasks)</li>
              <li>• Click on any task to open the edit modal</li>
              <li>• Edit the title or description and click Save</li>
              <li>• Watch if the list updates automatically without manual refresh</li>
              <li>• Check the browser console for any errors</li>
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedProjectId ? `Tasks for Project: ${realProjectIds.find(p => p.id === selectedProjectId)?.name || selectedProjectId}` : 'All Tasks'}
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedProjectId ? `Filtered by: ${selectedProjectId}` : 'Showing all tasks'}
            </div>
          </div>
          
          <TaskList projectId={selectedProjectId || undefined} />
        </div>

        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            🔍 Debug Info:
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Current Project ID: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{selectedProjectId || 'undefined'}</code></p>
            <p>• Query Key: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">["tasks", "{selectedProjectId || 'all'}"]</code></p>
            <p>• Check React DevTools → React Query tab to see cache state</p>
            <p>• Total tasks in database: 17</p>
          </div>
        </div>
      </div>
    </div>
  );
}
