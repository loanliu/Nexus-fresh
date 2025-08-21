'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Edit, Trash2, Eye, EyeOff, TestTube, Copy, Check } from 'lucide-react';
import { ApiKey } from '@/types';
import { toast } from 'react-hot-toast';

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onEdit: (apiKey: ApiKey) => void;
  onDelete: (apiKeyId: string) => void;
  onTest: (apiKey: ApiKey) => void;
}

export function ApiKeyCard({ apiKey, onEdit, onDelete, onTest }: ApiKeyCardProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'invalid': return 'bg-red-100 text-red-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'expired': return '🔴';
      case 'invalid': return '🔴';
      case 'testing': return '🟡';
      default: return '⚪';
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.encrypted_key);
      setCopied(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy API key');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {apiKey.key_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {apiKey.service_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(apiKey.status)}>
            {getStatusIcon(apiKey.status)} {apiKey.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Key:</span>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {showKey ? apiKey.encrypted_key : '••••••••••••••••'}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKey(!showKey)}
              className="p-1 h-8 w-8"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="p-1 h-8 w-8"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {apiKey.expiration_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expires:</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(apiKey.expiration_date)}
            </span>
          </div>
        )}

        {apiKey.last_tested && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Tested:</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(apiKey.last_tested)}
            </span>
          </div>
        )}

        {apiKey.notes && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Notes:</span> {apiKey.notes}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(apiKey)}
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTest(apiKey)}
          className="flex items-center gap-2"
        >
          <TestTube className="w-4 h-4" />
          Test
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(apiKey.id)}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
