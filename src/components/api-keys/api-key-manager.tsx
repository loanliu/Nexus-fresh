'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Key, Search, Filter, RefreshCw } from 'lucide-react';
import { useApiKeys } from '@/hooks/use-api-keys';
import { ApiKeyCard } from './api-key-card';
import { ApiKeyForm } from './api-key-form';
import { ApiKey } from '@/types';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';

export function ApiKeyManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const {
    apiKeys,
    loading,
    error,
    addApiKey,
    updateApiKey,
    deleteApiKey,
    refetch
  } = useApiKeys();

  const handleAddApiKey = async (apiKeyData: Omit<ApiKey, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const result = await addApiKey(apiKeyData);
      if (result) {
        toast.success('API key added successfully');
        setShowForm(false);
      } else {
        toast.error('Failed to add API key');
      }
    } catch (error) {
      toast.error('Error adding API key');
    }
  };

  const handleEditApiKey = async (apiKeyData: Omit<ApiKey, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!editingApiKey) return;
    
    try {
      const result = await updateApiKey(editingApiKey.id, apiKeyData);
      if (result) {
        toast.success('API key updated successfully');
        setEditingApiKey(null);
      } else {
        toast.error('Failed to update API key');
      }
    } catch (error) {
      toast.error('Error updating API key');
    }
  };

  const handleDeleteApiKey = async (apiKeyId: string) => {
    if (window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        const success = await deleteApiKey(apiKeyId);
        if (success) {
          toast.success('API key deleted successfully');
        } else {
          toast.error('Failed to delete API key');
        }
      } catch (error) {
        toast.error('Error deleting API key');
      }
    }
  };

  const handleTestApiKey = async (apiKey: ApiKey) => {
    // TODO: Implement API key testing functionality
    toast(`Testing API key: ${apiKey.key_name}`);
  };

  const filteredApiKeys = apiKeys.filter(apiKey => {
    const matchesSearch = apiKey.key_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apiKey.service_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apiKey.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusCount = (status: string) => {
    return apiKeys.filter(key => key.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            API Key Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Securely store and manage your API keys with encryption
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add API Key
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{apiKeys.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{getStatusCount('active')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Testing</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{getStatusCount('testing')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Expired</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{getStatusCount('expired') + getStatusCount('invalid')}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search API keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="testing">Testing</option>
            <option value="expired">Expired</option>
            <option value="invalid">Invalid</option>
          </select>
          <Button
            variant="outline"
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading API keys...</p>
        </div>
      )}

      {/* API Keys Grid */}
      {!loading && filteredApiKeys.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApiKeys.map((apiKey) => (
            <ApiKeyCard
              key={apiKey.id}
              apiKey={apiKey}
              onEdit={setEditingApiKey}
              onDelete={handleDeleteApiKey}
              onTest={handleTestApiKey}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredApiKeys.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Key className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No API keys found' : 'No API keys yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search terms or filters.'
              : 'Get started by adding your first API key to securely store and manage your integrations.'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button
              onClick={() => setShowForm(true)}
              className="mt-4 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First API Key
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <ApiKeyForm
          onSubmit={handleAddApiKey}
          onCancel={() => setShowForm(false)}
          isEditing={false}
        />
      )}

      {/* Edit Form Modal */}
      {editingApiKey && (
        <ApiKeyForm
          apiKey={editingApiKey}
          onSubmit={handleEditApiKey}
          onCancel={() => setEditingApiKey(null)}
          isEditing={true}
        />
      )}
    </div>
  );
}
