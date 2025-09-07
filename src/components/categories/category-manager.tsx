'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Tag, FolderOpen, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';
import { Category, Subcategory, Tag as TagType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AISubcategoryGenerator } from './ai-subcategory-generator';
import { useAuth } from '@/components/auth/auth-provider';
import toast from 'react-hot-toast';

export function CategoryManager() {
  const {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    fetchAllSubcategories
  } = useCategories();
  
  const { user } = useAuth();

  // Helper function to check if user can edit a category
  const canEditCategory = (category: Category): boolean => {
    // User can always edit their own categories
    if (category.user_id === user?.id) {
      return true;
    }
    // For shared project categories, only owners/admins can edit
    return false;
  };

  // Helper function to check if user can delete a category
  const canDeleteCategory = (category: Category): boolean => {
    // User can always delete their own categories
    if (category.user_id === user?.id) {
      return true;
    }
    // For shared project categories, only owners/admins can delete
    return false;
  };

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{
    type: 'category' | 'subcategory' | 'tag';
    id: string;
    data: any;
  } | null>(null);
  const [showAddForm, setShowAddForm] = useState<{
    type: 'category' | 'subcategory' | 'tag';
    categoryId?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIGenerator, setShowAIGenerator] = useState<string | null>(null); // categoryId for AI generator

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddCategory = async (formData: FormData) => {
    try {
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const color = formData.get('color') as string;

      await addCategory({
        name,
        description,
        color: color || '#3B82F6',
        icon: 'folder',
        is_default: false,
        sort_order: 0
      });

      setShowAddForm(null);
      toast.success('Category added successfully!');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleAddSubcategory = async (formData: FormData) => {
    // TODO: Implement subcategory functionality
    toast('Subcategory functionality coming soon!');
    setShowAddForm(null);
  };

  const handleAddTag = async (formData: FormData) => {
    // TODO: Implement tag functionality
    toast('Tag functionality coming soon!');
    setShowAddForm(null);
  };

  const handleUpdateItem = async (formData: FormData) => {
    if (!editingItem) return;

    try {
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const color = formData.get('color') as string;

      if (editingItem.type === 'category') {
        await updateCategory(editingItem.id, { name, description, color });
      } else if (editingItem.type === 'subcategory') {
        // TODO: Implement subcategory update
        toast('Subcategory update coming soon!');
      } else if (editingItem.type === 'tag') {
        // TODO: Implement tag update
        toast('Tag update coming soon!');
      }

      setEditingItem(null);
      toast.success('Item updated successfully!');
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (type: 'category' | 'subcategory' | 'tag', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      if (type === 'category') {
        await deleteCategory(id);
      } else if (type === 'subcategory') {
        // TODO: Implement subcategory delete
        toast('Subcategory delete coming soon!');
      } else if (type === 'tag') {
        // TODO: Implement tag delete
        toast('Tag delete coming soon!');
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Category Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your resources with categories, subcategories, and tags
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm({ type: 'category' })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search categories, subcategories, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {/* Category Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {category.name}
                  {canEditCategory(category) && ' >'}
                </h3>
                {category.shared_in_projects && category.shared_in_projects.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {category.shared_in_projects.map((projectName, index) => (
                      <span key={index} className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {projectName}
                      </span>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategoryExpansion(category.id)}
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {canEditCategory(category) && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItem({ type: 'category', id: category.id, data: category })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddForm({ type: 'subcategory', categoryId: category.id })}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAIGenerator(category.id)}
                      className="text-purple-600 hover:text-purple-700"
                      title="Generate subcategories with AI"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddForm({ type: 'tag', categoryId: category.id })}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {canDeleteCategory(category) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem('category', category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Category Description */}
            {category.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {category.description}
              </p>
            )}

            {/* Expanded Content */}
            {expandedCategories.has(category.id) && (
              <div className="space-y-4 mt-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                {/* Subcategories - Coming Soon */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Subcategories
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Subcategory functionality coming soon!
                  </p>
                </div>

                {/* Tags - Coming Soon */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Tags
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Tag functionality coming soon!
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Forms */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Add {showAddForm.type.charAt(0).toUpperCase() + showAddForm.type.slice(1)}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                if (showAddForm.type === 'category') {
                  handleAddCategory(formData);
                } else if (showAddForm.type === 'subcategory') {
                  handleAddSubcategory(formData);
                } else if (showAddForm.type === 'tag') {
                  handleAddTag(formData);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input name="name" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input name="description" />
              </div>
              {showAddForm.type === 'category' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <Input name="color" type="color" defaultValue="#3B82F6" />
                </div>
              )}
              {showAddForm.type !== 'category' && (
                <input type="hidden" name="categoryId" value={showAddForm.categoryId} />
              )}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Add {showAddForm.type.charAt(0).toUpperCase() + showAddForm.type.slice(1)}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Forms */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Edit {editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateItem(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  name="name"
                  defaultValue={editingItem.data.name}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  name="description"
                  defaultValue={editingItem.data.description || ''}
                />
              </div>
              {editingItem.type === 'category' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <Input
                    name="color"
                    type="color"
                    defaultValue={editingItem.data.color || '#3B82F6'}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Update
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Subcategory Generator */}
      {showAIGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <AISubcategoryGenerator
              categoryId={showAIGenerator}
              categoryName={categories.find(c => c.id === showAIGenerator)?.name || ''}
              categoryDescription={categories.find(c => c.id === showAIGenerator)?.description}
              onSubcategoriesGenerated={(count) => {
                if (count > 0) {
                  toast.success(`${count} subcategories added successfully!`);
                } else if (count < 0) {
                  toast.success('Subcategory deleted successfully!');
                }
                // Refresh subcategories without full page reload
                fetchAllSubcategories();
              }}
              onClose={() => setShowAIGenerator(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
