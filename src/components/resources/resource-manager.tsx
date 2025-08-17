'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Upload, 
  FileText, 
  Image, 
  File, 
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
      </div>

      {/* Resources Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredResources.length} resources
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory !== 'all' && ` in ${categories.find(cat => cat.id === selectedCategory)?.name}`}
        </p>
      </div>

      {/* Resources List */}
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
        <div className="space-y-3">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleResourceClick(resource)}
            >
              <div className="flex items-center justify-between">
                {/* Left Content - File info */}
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(resource.file_type)}
                  </div>
                  
                  {/* File Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {resource.title}
                    </h3>
                    
                    {/* File metadata */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {categories.find(cat => cat.id === resource.category_id)?.name || 'Uncategorized'}
                      </span>
                      
                                             {resource.file_size && (
                         <span className="flex items-center gap-2">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                           {resource.file_size > 1024 * 1024 
                             ? `${(resource.file_size / (1024 * 1024)).toFixed(1)} MB`
                             : resource.file_size > 1024
                             ? `${(resource.file_size / 1024).toFixed(1)} KB`
                             : `${resource.file_size} B`
                           }
                         </span>
                       )}
                      
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(resource.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right Button - Open Details */}
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
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

