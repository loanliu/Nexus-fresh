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
import { FeedbackPage } from '@/components/feedback/feedback-page';
//import { GoogleDriveConnect } from '@/components/GoogleDriveConnect';
//import { GoogleDriveStatus } from '@/components/GoogleDriveStatus';

type Tab = 'search' | 'projects' | 'resources' | 'google-resources' | 'api-keys' | 'analytics' | 'feedback' | 'task-manager' | 'categories' | 'google-drive';
// Add a new tab for Google Drive
const tabs: Tab [] = [
  'search', 
  'projects', 
  'resources', 
  'google-resources', 
  'api-keys', 
  'analytics', 
  'feedback', 
  'task-manager', 
  'categories',
  'google-drive' // Add this new tab
];

export default function DashboardPage() {
  console.log('🚀 DashboardPage component is being rendered!'); // Add this line
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  console.log('Dashboard: Loan Rendering tab:');

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

  const handleTabChange = useCallback((tab: string) => {
    console.log('Dashboard: Tab change requested:', tab);
    setActiveTab(tab as Tab);
  }, []); // Empty dependency array to ensure stability

  const renderTabContent = (tab: Tab) => {
    console.log('Dashboard page: Rendering tab:', tab);
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
      case 'feedback':
        return <FeedbackPage />;
        case 'google-drive':
          console.log('Dashboard: Google Drive case matched!'); // Add this
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Google Drive Integration</h2>
              </div>
              
              {/* Temporarily comment out these components to test */}
              {/* <div className="grid gap-6 md:grid-cols-2">
                <GoogleDriveStatus />
                <GoogleDriveConnect />
              </div> */}
              
              {/* Add this simple test content instead */}
              <div className="p-6 bg-blue-50 rounded-lg">
                <p className="text-blue-800">Google Drive tab is working! Components are temporarily disabled for testing.</p>
              </div>
            </div>
          );        
      default:
        return <AdvancedSearch onTabChange={handleTabChange} />;
    }
  };
  console.log('Dashboard: handleTabChange function:', handleTabChange); // Add this before return
  return (
    <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderTabContent(activeTab)}
    </DashboardLayout>
  );
}
