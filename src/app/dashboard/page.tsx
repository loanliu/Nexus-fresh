'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { TaskManager } from '@/components/task-manager/task-manager';
import { GoogleResources } from '@/components/google-resources/google-resources';
import { AdvancedSearch } from '@/components/search/advanced-search';
import { ApiKeyManager } from '@/components/api-keys/api-key-manager';
import { CategoryManager } from '@/components/categories/category-manager';
import { ProjectManager } from '@/components/projects/project-manager';
import { Analytics } from '@/components/analytics/analytics';
import { ResourceManager } from '@/components/resources/resource-manager';

type Tab = 'search' | 'resources' | 'google-resources' | 'task-manager' | 'api-keys' | 'categories' | 'projects' | 'analytics';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search');

  const renderTabContent = (tab: Tab) => {
    switch (tab) {
      case 'search':
        return <AdvancedSearch onTabChange={setActiveTab} />;
      case 'task-manager':
        return <TaskManager />;
      case 'resources':
        return <ResourceManager />;
      case 'google-resources':
        return <GoogleResources />;
      case 'api-keys':
        return <ApiKeyManager />;
      case 'categories':
        return <CategoryManager />;
      case 'projects':
        return <ProjectManager />;
      case 'analytics':
        return <Analytics />;
      default:
        return <AdvancedSearch onTabChange={setActiveTab} />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTabContent(activeTab)}
    </DashboardLayout>
  );
}
