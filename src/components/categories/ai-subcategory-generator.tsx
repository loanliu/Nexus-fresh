'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSubcategories } from '@/hooks/use-subcategories';
import { useAuth } from '@/components/auth/auth-provider';
import { Sparkles, Loader2, CheckCircle, AlertCircle, X, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface AISubcategoryGeneratorProps {
  categoryId: string;
  categoryName: string;
  categoryDescription?: string;
  onSubcategoriesGenerated: (count: number) => void;
  onClose?: () => void;
}

interface GeneratedSubcategory {
  name: string;
  description: string;
  selected: boolean;
}

export function AISubcategoryGenerator({
  categoryId,
  categoryName,
  categoryDescription,
  onSubcategoriesGenerated,
  onClose
}: AISubcategoryGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedSubcategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSelection, setShowSelection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'existing' | 'generate'>('existing');
  const [existingSubcategories, setExistingSubcategories] = useState<any[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  
  const { generateSubcategories, addSubcategory, deleteSubcategory, fetchSubcategories } = useSubcategories();
  const { user } = useAuth();

  // Load existing subcategories on component mount
  useEffect(() => {
    const loadExistingSubcategories = async () => {
      setLoadingExisting(true);
      try {
        const subs = await fetchSubcategories(categoryId);
        setExistingSubcategories(subs);
        // If no existing subcategories, go straight to generate view
        if (subs.length === 0) {
          setView('generate');
        }
      } catch (err) {
        console.error('Error loading existing subcategories:', err);
        setError('Failed to load existing subcategories');
      } finally {
        setLoadingExisting(false);
      }
    };

    if (categoryId) {
      loadExistingSubcategories();
    }
  }, [categoryId]); // Remove fetchSubcategories from dependencies to prevent infinite loop

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    try {
      const success = await deleteSubcategory(subcategoryId);
      if (success) {
        setExistingSubcategories(prev => prev.filter(sub => sub.id !== subcategoryId));
        toast.success('Subcategory deleted successfully');
        onSubcategoriesGenerated(-1); // Indicate one was removed
      } else {
        toast.error('Failed to delete subcategory');
      }
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      toast.error('Failed to delete subcategory');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setShowSelection(false);

    try {
      const response = await generateSubcategories(categoryId, categoryName, categoryDescription);
      
      if (response.success && response.subcategories) {
        // Transform the response into selectable items
        const selectableSubcategories: GeneratedSubcategory[] = response.subcategories.map((sub: any) => ({
          name: sub.name || sub, // Handle both object format and string format
          description: sub.description || '',
          selected: true // Default to selected
        }));
        
        setResults(selectableSubcategories);
        setShowSelection(true);
        toast.success(`Generated ${selectableSubcategories.length} subcategories!`);
      } else {
        setError(response.error || 'Failed to generate subcategories');
        toast.error('Failed to generate subcategories');
      }
    } catch (err) {
      console.error('Error generating subcategories:', err);
      setError('Failed to generate subcategories');
      toast.error('Failed to generate subcategories');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (index: number) => {
    setResults(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleSaveSelected = async () => {
    const selectedSubcategories = results.filter(sub => sub.selected);
    
    if (selectedSubcategories.length === 0) {
      toast.error('Please select at least one subcategory');
      return;
    }

    setSaving(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      // Check for existing subcategories to prevent duplicates
      const { data: existingSubcategories } = await supabase
        .from('subcategories')
        .select('name')
        .eq('category_id', categoryId);

      const existingNames = new Set(existingSubcategories?.map(sub => sub.name.toLowerCase()) || []);

      for (const subcategory of selectedSubcategories) {
        // Skip if subcategory already exists (case-insensitive)
        if (existingNames.has(subcategory.name.toLowerCase())) {
          console.log(`Skipping duplicate subcategory: ${subcategory.name}`);
          continue;
        }

        try {
          const result = await addSubcategory({
            name: subcategory.name,
            description: subcategory.description,
            category_id: categoryId,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
            icon: 'folder', // Default icon
            user_id: user?.id || '',
            sort_order: (existingSubcategories?.length || 0) + 1
          });

          if (result) {
            successCount++;
            existingNames.add(subcategory.name.toLowerCase()); // Add to set to prevent future duplicates in this batch
          } else {
            failureCount++;
          }
        } catch (err) {
          console.error(`Error adding subcategory "${subcategory.name}":`, err);
          failureCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Added ${successCount} subcategories successfully!`);
        onSubcategoriesGenerated(successCount);
        
        // Refresh existing subcategories list
        try {
          const updatedSubs = await fetchSubcategories(categoryId);
          setExistingSubcategories(updatedSubs);
        } catch (err) {
          console.error('Error refreshing subcategories:', err);
        }
        
        // Switch back to existing view to show the new subcategories
        setView('existing');
        setShowSelection(false);
        setResults([]);
      }
      
      if (failureCount > 0) {
        toast.error(`Failed to add ${failureCount} subcategories`);
      }

    } catch (err) {
      console.error('Error saving subcategories:', err);
      toast.error('Failed to save subcategories');
    } finally {
      setSaving(false);
    }
  };

  // Loading existing subcategories
  if (loadingExisting) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Subcategories...
          </h3>
          <p className="text-gray-600">
            Checking existing subcategories for "{categoryName}"
          </p>
        </div>
      </div>
    );
  }

  // Show existing subcategories view
  if (view === 'existing') {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Manage Subcategories
            </h3>
            <p className="text-gray-600 text-sm">
              Category: "{categoryName}" ({existingSubcategories.length} subcategories)
            </p>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {existingSubcategories.length > 0 ? (
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {existingSubcategories.map((subcategory) => (
              <div
                key={subcategory.id}
                className="p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {subcategory.name}
                    </h4>
                    {subcategory.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {subcategory.description}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDeleteSubcategory(subcategory.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              No subcategories found for "{categoryName}"
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => setView('generate')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {existingSubcategories.length > 0 ? 'Add More' : 'Generate Subcategories'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}
      </div>
    );
  }

  // Generate new subcategories view
  if (view === 'generate' && !showSelection && !loading && results.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI Subcategory Generator
          </h3>
          <p className="text-gray-600 mb-4">
            Generate relevant subcategories for "{categoryName}" using AI
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {error}
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => setView('existing')}
              variant="outline"
            >
              ← Back to Manage
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Subcategories
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showSelection && results.length > 0) {
    const selectedCount = results.filter(sub => sub.selected).length;
    
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Select Subcategories to Add
            </h3>
            <p className="text-gray-600 text-sm">
              {selectedCount} of {results.length} selected
            </p>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {results.map((subcategory, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                subcategory.selected
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => toggleSelection(index)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {subcategory.selected ? (
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  ) : (
                    <div className="w-4 h-4 border border-gray-300 rounded" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {subcategory.name}
                  </h4>
                  {subcategory.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {subcategory.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              setShowSelection(false);
              setResults([]);
              setView('existing');
            }}
            variant="outline"
          >
            ← Back to Manage
          </Button>
          <Button
            onClick={() => {
              setShowSelection(false);
              setResults([]);
              setError(null);
            }}
            variant="outline"
          >
            Regenerate
          </Button>
          <Button
            onClick={handleSaveSelected}
            disabled={selectedCount === 0 || saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              `Add Selected (${selectedCount})`
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Loading state when generating
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Generating Subcategories...
        </h3>
        <p className="text-gray-600 mb-4">
          AI is creating relevant subcategories for "{categoryName}"
        </p>
        <Button
          onClick={() => {
            setLoading(false);
            setView('existing');
          }}
          variant="outline"
          disabled={loading}
        >
          ← Back to Manage
        </Button>
      </div>
    </div>
  );
}
