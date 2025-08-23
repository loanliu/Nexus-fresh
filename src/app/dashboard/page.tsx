'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { TaskManager } from '@/components/task-manager/task-manager';
import GoogleResources from '@/components/google-resources/google-resources';
import { AdvancedSearch } from '@/components/search/advanced-search';
import { ApiKeyManager } from '@/components/api-keys/api-key-manager';
import { CategoryManager } from '@/components/categories/category-manager';
import { ProjectManager } from '@/components/projects/project-manager';
import { Analytics } from '@/components/analytics/analytics';
import { ResourceManager } from '@/components/resources/resource-manager';

type Tab = 'search' | 'resources' | 'google-resources' | 'task-manager' | 'api-keys' | 'categories' | 'projects' | 'analytics';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search');

  // Auto-switch to Google Resources tab after successful Google Drive authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const googleDriveAuth = urlParams.get('google_drive_auth');
      
      console.log('Dashboard page: Checking for Google Drive auth success:', { googleDriveAuth, currentTab: activeTab });
      
      if (googleDriveAuth === 'success') {
        console.log('Dashboard page: Google Drive auth success detected, switching to google-resources tab');
        // Switch to Google Resources tab
        setActiveTab('google-resources');
        
        // Clean up the URL by removing the parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('google_drive_auth');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []); // Only run once on mount

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab);
  };

  const renderTabContent = (tab: Tab) => {
    switch (tab) {
      case 'search':
        return <AdvancedSearch onTabChange={handleTabChange} />;
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
        return <AdvancedSearch onTabChange={handleTabChange} />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderTabContent(activeTab)}
    </DashboardLayout>
  );
}
