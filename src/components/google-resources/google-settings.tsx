'use client';

import React, { useState } from 'react';
import { Settings, Save, RefreshCw, Key, Folder, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface GoogleSettingsProps {
  onSave?: (settings: GoogleSettings) => void;
}

export interface GoogleSettings {
  folderId: string;
  maxDocuments: number;
  refreshInterval: number;
  includeContent: boolean;
  excludedMimeTypes: string[];
  dateCutoff: string;
}

const defaultSettings: GoogleSettings = {
  folderId: '',
  maxDocuments: 20,
  refreshInterval: 300, // 5 minutes
  includeContent: true,
  excludedMimeTypes: ['video/', 'audio/', 'application/pdf', 'image/'],
  dateCutoff: '2020-01-01'
};

export function GoogleSettings({ onSave }: GoogleSettingsProps) {
  const [settings, setSettings] = useState<GoogleSettings>(defaultSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: keyof GoogleSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(settings);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setSettings(defaultSettings);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleTestConnection = async () => {
    // TODO: Implement connection test
    console.log('Testing Google Drive connection...');
  };

  const refreshIntervalOptions = [
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' }
  ];

  const mimeTypeOptions = [
    { value: 'video/', label: 'Videos', icon: '🎥' },
    { value: 'audio/', label: 'Audio', icon: '🎵' },
    { value: 'application/pdf', label: 'PDFs', icon: '📄' },
    { value: 'image/', label: 'Images', icon: '🖼️' },
    { value: 'application/octet-stream', label: 'Binary Files', icon: '📦' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Settings className="h-8 w-8 text-gray-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Google Resources Settings
          </h1>
        </div>
        <p className="text-gray-600">
          Configure your Google Drive integration settings and preferences.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
          <div className="flex space-x-3">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={!hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Google Drive Folder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Drive Folder ID
            </label>
            <div className="flex space-x-3">
              <Input
                type="text"
                value={settings.folderId}
                onChange={(e) => handleSettingChange('folderId', e.target.value)}
                placeholder="Enter your Google Drive folder ID"
                disabled={!isEditing}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => window.open('https://drive.google.com/', '_blank')}
                disabled={!isEditing}
              >
                <Folder className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              The folder ID from the URL when you open a Google Drive folder
            </p>
          </div>

          {/* Document Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Documents
              </label>
              <Input
                type="number"
                value={settings.maxDocuments}
                onChange={(e) => handleSettingChange('maxDocuments', parseInt(e.target.value))}
                min="1"
                max="100"
                disabled={!isEditing}
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum number of documents to display (1-100)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refresh Interval
              </label>
              <select
                value={settings.refreshInterval}
                onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {refreshIntervalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                How often to refresh document list
              </p>
            </div>
          </div>

          {/* Date Cutoff */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Cutoff
            </label>
            <Input
              type="date"
              value={settings.dateCutoff}
              onChange={(e) => handleSettingChange('dateCutoff', e.target.value)}
              disabled={!isEditing}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-sm text-gray-500 mt-1">
              Only show documents created after this date
            </p>
          </div>

          {/* Content Options */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.includeContent}
                onChange={(e) => handleSettingChange('includeContent', e.target.checked)}
                disabled={!isEditing}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Include document content in search
              </span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-7">
              This will fetch document content for better search results (may be slower)
            </p>
          </div>

          {/* Excluded File Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excluded File Types
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {mimeTypeOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.excludedMimeTypes.includes(option.value)}
                    onChange={(e) => {
                      const newExcluded = e.target.checked
                        ? [...settings.excludedMimeTypes, option.value]
                        : settings.excludedMimeTypes.filter(type => type !== option.value);
                      handleSettingChange('excludedMimeTypes', newExcluded);
                    }}
                    disabled={!isEditing}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    {option.icon} {option.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              These file types will be excluded from search results
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <Button
              onClick={handleTestConnection}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Test Connection</span>
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            {hasChanges && <span className="text-orange-600">• Unsaved changes</span>}
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Current Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Authentication</p>
              <Badge variant="secondary" className="text-xs">
                {settings.folderId ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Folder className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Folder Access</p>
              <Badge variant="secondary" className="text-xs">
                {settings.folderId ? 'Ready' : 'Setup Required'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Date Filter</p>
              <Badge variant="secondary" className="text-xs">
                {settings.dateCutoff}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Auto Refresh</p>
              <Badge variant="secondary" className="text-xs">
                Every {refreshIntervalOptions.find(opt => opt.value === settings.refreshInterval)?.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
