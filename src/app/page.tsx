'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { ResourceManager } from '@/components/resources/resource-manager';
import { CategoryManager } from '@/components/categories/category-manager';
import { ApiKeyManager } from '@/components/api-keys/api-key-manager';
import { ProjectManager } from '@/components/projects/project-manager';
import { TaskManager } from '@/components/task-manager/task-manager';
import { AdvancedSearch } from '@/components/search/advanced-search';
import { Analytics } from '@/components/analytics/analytics';
import GoogleResources from '@/components/google-resources/google-resources';
import { FeedbackPage } from '@/components/feedback/feedback-page';
import { EnhancedAuthForm } from '@/components/auth/enhanced-auth-form';
import { useAuth } from '@/components/auth/auth-provider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { GoogleDriveConnect } from '@/components/GoogleDriveConnect';
import { GoogleDriveStatus } from '@/components/GoogleDriveStatus'; 

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <EnhancedAuthForm />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'resources':
        return <ResourceManager />;
      case 'google-resources':
        return <GoogleResources />;
      case 'task-manager':
        return <TaskManager />;
      case 'categories':
        return <CategoryManager />;
      case 'api-keys':
        return <ApiKeyManager />;
      case 'projects':
        return <ProjectManager />;
      case 'search':
        return <AdvancedSearch onTabChange={setActiveTab} />;
      case 'analytics':
        return <Analytics />;
      case 'feedback':
        return <FeedbackPage />;
      case 'google-drive':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Google Drive Integration</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <GoogleDriveStatus />
              <GoogleDriveConnect />
            </div>
          </div>
        );       
      default:
        return <ProjectManager />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderActiveTab()}
    </DashboardLayout>
  );
}
