'use client';

import { Button } from '@/components/ui/button';
import { Plus, Key, Shield, Settings } from 'lucide-react';

export function ApiKeyManager() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            API Key Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Securely store and manage your API keys with encryption
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add API Key
        </Button>
      </div>

      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Key className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          API Key Management Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          This feature will allow you to securely store API keys with encryption, 
          organize them by service/category, and test connections.
        </p>
      </div>
    </div>
  );
}
