'use client';

import React from 'react';
import { FileText, Calendar, Eye, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GoogleDocument } from '@/hooks/use-google-docs';

interface DocumentCardProps {
  document: GoogleDocument;
  onViewDetails: (document: GoogleDocument) => void;
  onOpenDocument: (webViewLink: string) => void;
}

export function DocumentCard({ document, onViewDetails, onOpenDocument }: DocumentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    if (mimeType.includes('document')) return 'Document';
    if (mimeType.includes('spreadsheet')) return 'Spreadsheet';
    if (mimeType.includes('presentation')) return 'Presentation';
    return 'File';
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.includes('document')) return 'bg-blue-100 text-blue-800';
    if (mimeType.includes('spreadsheet')) return 'bg-green-100 text-green-800';
    if (mimeType.includes('presentation')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{getFileIcon(document.mimeType)}</span>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getFileTypeColor(document.mimeType)}`}
          >
            {getFileTypeLabel(document.mimeType)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {document.size}
          </Badge>
        </div>
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {document.name}
      </h3>
      
      {/* Content Preview */}
      {document.content && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {document.content.length > 150 
            ? `${document.content.substring(0, 150)}...`
            : document.content
          }
        </p>
      )}
      
      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Created: {formatDate(document.createdTime)}</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>Modified: {formatDate(document.modifiedTime)}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(document)}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          <span>Details</span>
        </Button>
        
        <Button
          size="sm"
          onClick={() => onOpenDocument(document.webViewLink)}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Open</span>
        </Button>
      </div>
    </div>
  );
}
