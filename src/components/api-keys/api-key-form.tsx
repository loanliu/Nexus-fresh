'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, X, Save, Plus } from 'lucide-react';
import { ApiKey } from '@/types';
import { useCategories } from '@/hooks/use-categories';

interface ApiKeyFormProps {
  apiKey?: ApiKey | null;
  onSubmit: (apiKeyData: Omit<ApiKey, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function ApiKeyForm({ apiKey, onSubmit, onCancel, isEditing = false }: ApiKeyFormProps) {
  const [formData, setFormData] = useState({
    service_name: '',
    key_name: '',
    encrypted_key: '',
    setup_instructions: '',
    category_id: '',
    expiration_date: '',
    notes: '',
    status: 'active' as 'active' | 'expired' | 'invalid' | 'testing',
    usage_limits: {
      daily: undefined as number | undefined,
      monthly: undefined as number | undefined,
      total: undefined as number | undefined,
    }
  });

  const [loading, setLoading] = useState(false);
  const { categories, fetchCategories } = useCategories();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (apiKey) {
      setFormData({
        service_name: apiKey.service_name || '',
        key_name: apiKey.key_name || '',
        encrypted_key: apiKey.encrypted_key || '',
        setup_instructions: apiKey.setup_instructions || '',
        category_id: apiKey.category_id || '',
        expiration_date: apiKey.expiration_date || '',
        notes: apiKey.notes || '',
        status: apiKey.status || 'active' as 'active' | 'expired' | 'invalid' | 'testing',
        usage_limits: {
          daily: apiKey.usage_limits?.daily,
          monthly: apiKey.usage_limits?.monthly,
          total: apiKey.usage_limits?.total,
        }
      });
    }
  }, [apiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        expiration_date: formData.expiration_date || undefined,
        usage_limits: {
          daily: formData.usage_limits.daily || undefined,
          monthly: formData.usage_limits.monthly || undefined,
          total: formData.usage_limits.total || undefined,
        }
      };

      console.log('Form submitting data:', submitData);
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith('usage_limits.')) {
      const limitField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        usage_limits: {
          ...prev.usage_limits,
          [limitField]: value === '' ? undefined : Number(value)
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit API Key' : 'Add New API Key'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="p-1 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Name *
              </label>
              <Input
                type="text"
                value={formData.service_name}
                onChange={(e) => handleInputChange('service_name', e.target.value)}
                placeholder="e.g., OpenAI, Google Cloud, AWS"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Name *
              </label>
              <Input
                type="text"
                value={formData.key_name}
                onChange={(e) => handleInputChange('key_name', e.target.value)}
                placeholder="e.g., Production API Key, Development Key"
                required
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key *
            </label>
            <Input
              type="password"
              value={formData.encrypted_key}
              onChange={(e) => handleInputChange('encrypted_key', e.target.value)}
              placeholder="Enter your API key"
              required
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="testing">Testing</option>
                <option value="expired">Expired</option>
                <option value="invalid">Invalid</option>
              </select>
            </div>
          </div>

                     <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
               Expiration Date (Optional)
             </label>
             <Input
               type="date"
               value={formData.expiration_date}
               onChange={(e) => handleInputChange('expiration_date', e.target.value)}
               className="w-full"
               placeholder="Leave empty if no expiration"
             />
           </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Setup Instructions
            </label>
            <textarea
              value={formData.setup_instructions}
              onChange={(e) => handleInputChange('setup_instructions', e.target.value)}
              placeholder="Instructions for setting up this API key..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this API key..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Usage Limits (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Daily</label>
                <Input
                  type="number"
                  value={formData.usage_limits.daily || ''}
                  onChange={(e) => handleInputChange('usage_limits.daily', e.target.value)}
                  placeholder="Daily limit"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly</label>
                <Input
                  type="number"
                  value={formData.usage_limits.monthly || ''}
                  onChange={(e) => handleInputChange('usage_limits.monthly', e.target.value)}
                  placeholder="Monthly limit"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Total</label>
                <Input
                  type="number"
                  value={formData.usage_limits.total || ''}
                  onChange={(e) => handleInputChange('usage_limits.total', e.target.value)}
                  placeholder="Total limit"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditing ? 'Update' : 'Create'} API Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
