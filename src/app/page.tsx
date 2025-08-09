'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { ResourceManager } from '@/components/resources/resource-manager';
import { CategoryManager } from '@/components/categories/category-manager';
import { ApiKeyManager } from '@/components/api-keys/api-key-manager';
import { ProjectManager } from '@/components/projects/project-manager';
import { TaskManager } from '@/components/tasks/task-manager';
import { SearchInterface } from '@/components/search/search-interface';
import { Analytics } from '@/components/analytics/analytics';
import { AuthForm } from '@/components/auth/auth-form';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('resources');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'resources':
        return <ResourceManager />;
      case 'categories':
        return <CategoryManager />;
      case 'api-keys':
        return <ApiKeyManager />;
      case 'projects':
        return <ProjectManager />;
      case 'tasks':
        return <TaskManager />;
      case 'search':
        return <SearchInterface />;
      case 'analytics':
        return <Analytics />;
      default:
        return <ResourceManager />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderActiveTab()}
    </DashboardLayout>
  );
}
