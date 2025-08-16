'use client';

import { useState } from 'react';
import { 
  X, 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  Star, 
  Tag, 
  Calendar, 
  FileText,
  Image,
  File,
  Save,
  X as XIcon,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Resource, Category } from '@/types';
import { useCategories } from '@/hooks/use-categories';
import { useResources } from '@/hooks/use-resources';
import { toast } from 'react-hot-toast';

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  onResourceUpdated: (resource: Resource) => void;
  onResourceDeleted: (resourceId: string) => void;
}

export function ResourceDetailModal({ 
  resource, 
  isOpen, 
  onClose, 
  onResourceUpdated, 
  onResourceDeleted 
}: ResourceDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Resource>>({});
  const [newTag, setNewTag] = useState('');

  const { categories } = useCategories();
  const { updateResource, deleteResource } = useResources();

  if (!resource || !isOpen) return null;

  const handleEdit = () => {
    setEditData({
      title: resource.title,
      description: resource.description,
      category_id: resource.category_id,
      subcategory: resource.subcategory,
      tags: [...resource.tags],
      notes: resource.notes,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const updatedResource = await updateResource(resource.id, editData);
      if (updatedResource) {
        onResourceUpdated(updatedResource);
        setIsEditing(false);
        toast.success('Resource updated successfully!');
      }
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    setNewTag('');
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      try {
        await deleteResource(resource.id);
        onResourceDeleted(resource.id);
        toast.success('Resource deleted successfully!');
      } catch (error) {
        console.error('Error deleting resource:', error);
        toast.error('Failed to delete resource. Please try again.');
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !editData.tags?.includes(newTag.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const getFileIcon = () => {
    if (resource.file_type?.includes('image')) {
      return <Image className="h-16 w-16 text-blue-600" />;
    }
    if (resource.file_type?.includes('pdf') || resource.file_type?.includes('text')) {
      return <FileText className="h-16 w-16 text-blue-600" />;
    }
    return <File className="h-16 w-16 text-blue-600" />;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'bg-gray-500';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewFile = () => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    } else {
      toast.error('File URL not available');
    }
  };

  const handleDownloadFile = () => {
    if (resource.file_url) {
      // Open file in new browser tab/window for download
      window.open(resource.file_url, '_blank');
      toast.success('Opening file in new tab for download!');
    } else {
      toast.error('File URL not available for download');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {getFileIcon()}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Resource' : 'Resource Details'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {resource.file_type || 'Unknown file type'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadFile}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.title || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter resource title"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">{resource.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter resource description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      {resource.description || 'No description provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.category_id || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getCategoryColor(resource.category_id)} text-white`}>
                      {categories.find(cat => cat.id === resource.category_id)?.name}
                    </span>
                  )}
                </div>

                {resource.subcategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subcategory
                    </label>
                    {isEditing ? (
                      <Input
                        value={editData.subcategory || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, subcategory: e.target.value }))}
                        placeholder="Enter subcategory"
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">{resource.subcategory}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Tags, Notes, Metadata */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  {isEditing ? (
                    <div>
                      <div className="flex space-x-2 mb-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add a tag"
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button onClick={addTag} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {editData.tags?.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {resource.tags.length > 0 ? (
                        resource.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No tags</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editData.notes || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter additional notes"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      {resource.notes || 'No notes provided'}
                    </p>
                  )}
                </div>

                {/* Metadata */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">File Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">File Size:</span>
                      <p className="text-gray-900 dark:text-white">{formatFileSize(resource.file_size)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">File Type:</span>
                      <p className="text-gray-900 dark:text-white">{resource.file_type || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(resource.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Updated:</span>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(resource.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {resource.file_url && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                      <Button variant="outline" size="sm" className="w-full" onClick={handleViewFile}>
                        <Eye className="h-4 w-4 mr-2" />
                        View File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              {isEditing && (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            
            <div className="flex space-x-2">
              {isEditing ? (
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              ) : (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
