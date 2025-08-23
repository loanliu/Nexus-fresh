// Task Manager MVP Saved Filters Component
// Phase 1: Core Saved Filters Management

'use client';

import { useState } from 'react';
import { Bookmark, Plus, Trash2, Edit, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSavedFilters } from '@/hooks/use-task-manager';
import { SavedFilter, FilterConfig } from '@/types/task-manager';

export function SavedFilters() {
  const { data: savedFilters = [], isLoading } = useSavedFilters();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null);
  const [filterName, setFilterName] = useState('');
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({});

  const handleCreateFilter = () => {
    // TODO: Implement create filter functionality
    console.log('Creating filter:', { name: filterName, config: filterConfig });
    setShowCreateForm(false);
    setFilterName('');
    setFilterConfig({});
  };

  const handleEditFilter = (filter: SavedFilter) => {
    setEditingFilter(filter);
    setFilterName(filter.name);
    setFilterConfig(filter.filter_config);
  };

  const handleUpdateFilter = () => {
    if (!editingFilter) return;
    
    // TODO: Implement update filter functionality
    console.log('Updating filter:', editingFilter.id, { name: filterName, config: filterConfig });
    setEditingFilter(null);
    setFilterName('');
    setFilterConfig({});
  };

  const handleDeleteFilter = (filterId: string) => {
    // TODO: Implement delete filter functionality
    console.log('Deleting filter:', filterId);
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    // TODO: Implement apply filter functionality
    console.log('Applying filter:', filter);
  };

  const formatFilterConfig = (config: FilterConfig): string => {
    const parts = [];
    
    if (config.status?.length) {
      parts.push(`${config.status.length} status(es)`);
    }
    if (config.priority?.length) {
      parts.push(`${config.priority.length} priority(ies)`);
    }
    if (config.project_id?.length) {
      parts.push(`${config.project_id.length} project(s)`);
    }
    if (config.labels?.length) {
      parts.push(`${config.labels.length} label(s)`);
    }
    if (config.search) {
      parts.push(`search: "${config.search}"`);
    }
    if (config.due_date_from || config.due_date_to) {
      parts.push('date range');
    }

    return parts.length > 0 ? parts.join(', ') : 'No filters';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading saved filters...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Saved Filters</h2>
          <p className="text-sm text-gray-500">
            Create and manage custom task views for quick access
          </p>
        </div>
        
        <Button
          onClick={() => setShowCreateForm(true)}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Filter
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingFilter) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingFilter ? 'Edit Filter' : 'Create New Filter'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Name
              </label>
              <Input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter filter name..."
                className="max-w-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Configuration
              </label>
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                <p>Filter configuration will be implemented in Phase 3</p>
                <p className="mt-1">This will include status, priority, project, and label filters.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Button
                onClick={editingFilter ? handleUpdateFilter : handleCreateFilter}
                disabled={!filterName.trim()}
              >
                {editingFilter ? 'Update Filter' : 'Create Filter'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingFilter(null);
                  setFilterName('');
                  setFilterConfig({});
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters List */}
      {savedFilters.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Bookmark className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved filters yet</h3>
          <p className="text-gray-500">
            Create your first saved filter to quickly access specific task views.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedFilters.map((filter) => (
            <div
              key={filter.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {filter.name}
                    </h4>
                    {filter.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {formatFilterConfig(filter.filter_config)}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    Created {new Date(filter.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyFilter(filter)}
                    className="h-8 px-3"
                  >
                    <Filter className="mr-2 h-3 w-3" />
                    Apply
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditFilter(filter)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFilter(filter.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Bookmark className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              About Saved Filters
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Saved filters allow you to quickly access specific task views. 
                Create filters for common scenarios like "High Priority Tasks", 
                "This Week's Deadlines", or "Bug Reports".
              </p>
              <p className="mt-1">
                <strong>Coming in Phase 3:</strong> Full filter configuration with 
                status, priority, project, and label options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
