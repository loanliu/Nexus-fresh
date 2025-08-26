'use client';

import React, { useState } from 'react';
import { SubtaskList } from '@/components/subtasks/SubtaskList';

export default function TestSubtasksPage() {
  const [taskId, setTaskId] = useState('');

  // Some example task IDs you can test with
  const exampleTaskIds = [
    'Enter a real task ID here',
    'Or use one from your database'
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          🧪 Test Subtasks System
        </h1>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📋 Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
            <li>Enter a real task ID from your database below</li>
            <li>Click "Load Subtasks" to see existing subtasks</li>
            <li>Try creating, editing, toggling, and deleting subtasks</li>
            <li>Check the browser console for detailed logs</li>
          </ol>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Task ID to test with:
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="Enter a real task ID from your database..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={() => setTaskId('')}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        {taskId && (
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Subtasks for Task: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">{taskId}</code>
            </h2>
            <SubtaskList taskId={taskId} />
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
            🔍 Debug Info
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Current Task ID: {taskId || 'None'}</p>
            <p>• Check browser console for detailed operation logs</p>
            <p>• All operations use optimistic updates for instant feedback</p>
            <p>• Database changes are reflected in real-time</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="text-md font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Important Notes
          </h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-800 dark:text-yellow-200 text-sm">
            <li>Make sure the task ID exists in your database</li>
            <li>The task must belong to the currently authenticated user</li>
            <li>RLS policies will prevent access to other users' tasks</li>
            <li>All operations are logged to the console for debugging</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
