'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Grid, 
  List, 
  Search, 
  Filter, 
  Upload, 
  FileText, 
  Image, 
  File, 
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResourceUploadModal } from './resource-upload-modal';
import { ResourceDetailModal } from './resource-detail-modal';
import { Resource, Category } from '@/types';
import { useResources } from '@/hooks/use-resources';
import { useCategories } from '@/hooks/use-categories';

export function ResourceManager() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { resources, loading, error, addResource, updateResource, deleteResource } = useResources();
  const { categories } = useCategories();

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || resource.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-8 w-8" />;
    
    if (fileType.includes('image')) return <Image className="h-8 w-8" />;
    if (fileType.includes('pdf') || fileType.includes('text')) return <FileText className="h-8 w-8" />;
    
    return <File className="h-8 w-8" />;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'bg-gray-500';
  };

  const handleResourceClick = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailModal(true);
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      await deleteResource(resourceId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resources</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and organize your AI tools, documents, and resources
          </p>
        </div>
        
        <Button onClick={() => setShowUploadModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        
        <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Resources Grid/List */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No resources found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first resource'
            }
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                viewMode === 'list' ? 'flex items-center space-x-4 p-4' : ''
              }`}
              onClick={() => handleResourceClick(resource)}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(resource.category_id)} text-white`}>
                        {categories.find(cat => cat.id === resource.category_id)?.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle favorite
                        }}
                        className="text-gray-400 hover:text-yellow-500"
                      >
                        <Star className={`h-4 w-4 ${resource.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-center h-20 mb-3">
                      {getFileIcon(resource.file_type)}
                    </div>
                    
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                      {resource.title}
                    </h3>
                    
                    {resource.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {resource.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {resource.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          +{resource.tags.length - 3}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                      <span>{resource.file_size ? `${(resource.file_size / 1024).toFixed(1)} KB` : 'N/A'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-shrink-0">
                    {getFileIcon(resource.file_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {resource.title}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(resource.category_id)} text-white`}>
                        {categories.find(cat => cat.id === resource.category_id)?.name}
                      </span>
                    </div>
                    
                    {resource.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {resource.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-2">
                      {resource.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{resource.file_size ? `${(resource.file_size / 1024).toFixed(1)} KB` : 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ResourceUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onResourceAdded={(resource) => {
          setShowUploadModal(false);
          // Resource will be automatically added to the list
        }}
      />

      <ResourceDetailModal
        resource={selectedResource}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedResource(null);
        }}
        onResourceUpdated={(updatedResource) => {
          // Resource will be automatically updated in the list
        }}
        onResourceDeleted={(resourceId) => {
          setShowDetailModal(false);
          setSelectedResource(null);
          // Resource will be automatically removed from the list
        }}
      />
    </div>
  );
}
