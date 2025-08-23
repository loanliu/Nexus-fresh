'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, CheckCircle } from 'lucide-react';
import { AnalyticsData } from '@/hooks/use-analytics';
import { formatStorageSize, formatDate } from '@/lib/analytics-utils';

interface ExportAnalyticsProps {
  data: AnalyticsData;
  onClose: () => void;
}

export function ExportAnalytics({ data, onClose }: ExportAnalyticsProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const exportToCSV = async () => {
    setExporting(true);
    
    try {
      // Create CSV content
      const csvContent = generateCSVContent(data);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `nexus-analytics-${formatDate(new Date())}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExported(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const generateCSVContent = (analyticsData: AnalyticsData): string => {
    const rows: string[] = [];
    
    // Header
    rows.push('Nexus Analytics Report');
    rows.push(`Generated on: ${formatDate(new Date())}`);
    rows.push('');
    
    // Overview
    rows.push('OVERVIEW METRICS');
    rows.push('Metric,Value');
    rows.push(`Total Resources,${analyticsData.totalResources}`);
    rows.push(`Total Tasks,${analyticsData.totalTasks}`);
    rows.push(`Total Categories,${analyticsData.totalCategories}`);
    rows.push(`Total API Keys,${analyticsData.totalApiKeys}`);
    rows.push(`Total Projects,${analyticsData.totalProjects}`);
    rows.push(`Storage Used,${formatStorageSize(analyticsData.storageUsed)}`);
    rows.push('');
    
    // Resources by Category
    if (Object.keys(analyticsData.resourcesByCategory).length > 0) {
      rows.push('RESOURCES BY CATEGORY');
      rows.push('Category,Count');
      Object.entries(analyticsData.resourcesByCategory).forEach(([category, count]) => {
        rows.push(`${category},${count}`);
      });
      rows.push('');
    }
    
    // Tasks by Status
    if (Object.keys(analyticsData.tasksByStatus).length > 0) {
      rows.push('TASKS BY STATUS');
      rows.push('Status,Count');
      Object.entries(analyticsData.tasksByStatus).forEach(([status, count]) => {
        rows.push(`${status},${count}`);
      });
      rows.push('');
    }
    
    // File Types
    if (Object.keys(analyticsData.resourcesByType).length > 0) {
      rows.push('FILE TYPES');
      rows.push('Type,Count');
      Object.entries(analyticsData.resourcesByType).forEach(([type, count]) => {
        rows.push(`${type},${count}`);
      });
      rows.push('');
    }
    
    // API Keys by Service
    if (Object.keys(analyticsData.apiKeysByService).length > 0) {
      rows.push('API KEYS BY SERVICE');
      rows.push('Service,Count');
      Object.entries(analyticsData.apiKeysByService).forEach(([service, count]) => {
        rows.push(`${service},${count}`);
      });
      rows.push('');
    }
    
    // Projects by Status
    if (Object.keys(analyticsData.projectsByStatus).length > 0) {
      rows.push('PROJECTS BY STATUS');
      rows.push('Status,Count');
      Object.entries(analyticsData.projectsByStatus).forEach(([status, count]) => {
        rows.push(`${status},${count}`);
      });
      rows.push('');
    }
    
    // Time-based metrics
    rows.push('TIME-BASED METRICS');
    rows.push('Metric,Value');
    rows.push(`Resources Added This Week,${analyticsData.resourcesAddedThisWeek}`);
    rows.push(`Resources Added This Month,${analyticsData.resourcesAddedThisMonth}`);
    rows.push(`Tasks Completed This Week,${analyticsData.tasksCompletedThisWeek}`);
    rows.push(`Tasks Completed This Month,${analyticsData.tasksCompletedThisMonth}`);
    rows.push('');
    
    // Google Drive metrics
    if (analyticsData.googleDriveFiles > 0) {
      rows.push('GOOGLE DRIVE INTEGRATION');
      rows.push('Metric,Value');
      rows.push(`Accessible Files,${analyticsData.googleDriveFiles}`);
      rows.push(`Storage Used,${formatStorageSize(analyticsData.googleDriveStorage)}`);
      rows.push(`Recent Activity,${analyticsData.recentGoogleDriveActivity}`);
      rows.push('');
    }
    
    return rows.join('\n');
  };

  if (exported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Export Successful!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your analytics report has been downloaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Export Analytics Report
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Download a comprehensive CSV report containing all your analytics data, including:
        </p>
        
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-6">
          <li>• Overview metrics and totals</li>
          <li>• Resource and task distributions</li>
          <li>• Category and project breakdowns</li>
          <li>• API key management summary</li>
          <li>• Time-based activity metrics</li>
          <li>• Google Drive integration status</li>
        </ul>
        
        <div className="flex space-x-3">
          <Button
            onClick={exportToCSV}
            disabled={exporting}
            className="flex-1"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            disabled={exporting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
