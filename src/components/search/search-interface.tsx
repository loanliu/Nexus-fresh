'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Save, History } from 'lucide-react';

export function SearchInterface() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Full-text search across all your resources with advanced filtering
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search across all resources, categories, and tags..."
            className="pl-10 pr-4 py-3 text-lg"
          />
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Search
          </Button>
        </div>
      </div>

      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Search className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Advanced Search Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          This feature will provide full-text search across all content with keyword filtering, 
          category and tag filters, advanced operators, and search history.
        </p>
      </div>
    </div>
  );
}
