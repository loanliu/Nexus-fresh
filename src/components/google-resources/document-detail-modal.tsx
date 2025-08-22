'use client';

import React from 'react';
import { X, ExternalLink, Calendar, FileText, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoogleDocument } from '@/hooks/use-google-docs';

interface DocumentDetailModalProps {
  document: GoogleDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentDetailModal({ document, isOpen, onClose }: DocumentDetailModalProps) {
  if (!isOpen || !document) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('document')) return '📄';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('folder')) return '📁';
    return '📄';
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.includes('document')) return 'Google Document';
    if (mimeType.includes('spreadsheet')) return 'Google Spreadsheet';
    if (mimeType.includes('presentation')) return 'Google Presentation';
    return 'Google File';
  };

  const openDocument = () => {
    window.open(document.webViewLink, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getFileIcon(document.mimeType)}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {document.name}
              </h2>
              <p className="text-sm text-gray-500">
                {getFileTypeLabel(document.mimeType)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Document Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Created:</span>
                <span className="text-sm font-medium">
                  {formatDate(document.createdTime)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Modified:</span>
                <span className="text-sm font-medium">
                  {formatDate(document.modifiedTime)}
                </span>
              </div>
              

            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Type:</span>
                <Badge variant="outline" className="text-xs">
                  {document.mimeType.split('.').pop()?.toUpperCase() || 'DOC'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">ID:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {document.id}
                </code>
              </div>
            </div>
          </div>



          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={openDocument}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in Google Drive</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
