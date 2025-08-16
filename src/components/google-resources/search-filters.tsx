'use client';

import React, { useState } from 'react';
import { Filter, X, Calendar, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

export interface SearchFilters {
  query: string;
  fileTypes: string[];
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: 'name' | 'created' | 'modified' | 'size';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: SearchFilters = {
  query: '',
  fileTypes: ['document', 'spreadsheet', 'presentation'],
  dateRange: {
    start: '2020-01-01',
    end: new Date().toISOString().split('T')[0]
  },
  sortBy: 'modified',
  sortOrder: 'desc'
};

export function SearchFilters({ onFiltersChange, onClearFilters }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const fileTypeOptions = [
    { value: 'document', label: 'Documents', icon: '📄' },
    { value: 'spreadsheet', label: 'Spreadsheets', icon: '📊' },
    { value: 'presentation', label: 'Presentations', icon: '📽️' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created', label: 'Created Date' },
    { value: 'modified', label: 'Modified Date' },
    { value: 'size', label: 'File Size' }
  ];

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleFileTypeToggle = (fileType: string) => {
    const newFileTypes = filters.fileTypes.includes(fileType)
      ? filters.fileTypes.filter(type => type !== fileType)
      : [...filters.fileTypes, fileType];
    
    handleFilterChange('fileTypes', newFileTypes);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    onClearFilters();
  };

  const hasActiveFilters = filters.query || 
    filters.fileTypes.length !== 3 || 
    filters.dateRange.start !== '2020-01-01' ||
    filters.sortBy !== 'modified' ||
    filters.sortOrder !== 'desc';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Search & Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Basic Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search documents by name or content..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-4">
          {/* File Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Types
            </label>
            <div className="flex flex-wrap gap-2">
              {fileTypeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filters.fileTypes.includes(option.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFileTypeToggle(option.value)}
                  className="flex items-center space-x-2"
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <Input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: e.target.value
                })}
                min="2020-01-01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <Input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: e.target.value
                })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Clear Filters</span>
            </Button>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          {filters.fileTypes.length} file types selected
        </div>
      </div>
    </div>
  );
}
