'use client';

import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Tag, 
  Key, 
  Briefcase, 
  CheckSquare, 
  Search, 
  BarChart3, 
  Menu, 
  X,
  Plus,
  Settings,
  User,
  LogOut,
  GitCommit,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { TaskManager } from '@/components/task-manager/task-manager';
import { ProjectManager } from '@/components/projects/project-manager';
import { CategoryManager } from '@/components/categories/category-manager';
import { GitHubCommitGenerator } from '@/components/github-commit-generator';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationTabs = [
  { id: 'search', label: 'Search', icon: Search, description: 'Advanced search across all content' },
  { id: 'projects', label: 'Projects', icon: Briefcase, description: 'Client project management' },
  { id: 'resources', label: 'Resources', icon: FolderOpen, description: 'Manage files and content' },
  // { id: 'google-resources', label: 'Google Resources', icon: FolderOpen, description: 'Google Drive documents and search' },
  { id: 'task-manager', label: 'Task Manager', icon: CheckSquare, description: 'Manage tasks, projects, and labels' },
  { id: 'categories', label: 'Categories', icon: Tag, description: 'Organize with categories and tags' },
  { id: 'api-keys', label: 'API Keys', icon: Key, description: 'Secure API key management' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Usage statistics and insights' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, description: 'Share your thoughts and suggestions' },
  // { id: 'google-drive', label: 'Google Drive', icon: FolderOpen, description: 'Connect and manage Google Drive integration' },  
];

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();
  const [showCommitGenerator, setShowCommitGenerator] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showGoogleAuthSuccess, setShowGoogleAuthSuccess] = useState(false);

  // Set up client state and show Google Drive auth success message
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('google_drive_auth') === 'success') {
      setShowGoogleAuthSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowGoogleAuthSuccess(false), 5000);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading state while authentication is loading
  if (authLoading || !isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nexus</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Personal Workspace
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('Layout: Tab clicked:', tab.id);
                  console.log('Layout: onTabChange function:', onTabChange);
                  console.log('Layout: onTabChange type:', typeof onTabChange);
                  
                  try {
                    onTabChange(tab.id);
                    setSidebarOpen(false);
                  } catch (error) {
                    console.error('Layout: Error calling onTabChange:', error);
                  }
                }}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{tab.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tab.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onTabChange('resources')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* GitHub Commit Generator Button 
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowCommitGenerator(true)}
            >
              <GitCommit className="h-4 w-4 mr-2" />
              Generate Commit
            </Button>
          </div>*/}
        </div>
      </div> 

      {/* Main content */}
      <div className="flex-1 min-w-0 lg:pl-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigationTabs.find(tab => tab.id === activeTab)?.label}
              </h2>
            </div>
          </div>
        </div>

        {/* Success message for Google Drive auth */}
        {isClient && showGoogleAuthSuccess && (
          <div className="px-6 py-4 bg-green-50 border-b border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <CheckSquare className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Google Drive access granted successfully! You can now view your documents.
              </p>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="px-6 py-6">
          {children}
        </main>
      </div>

      {/* GitHub Commit Generator Modal */}
      <GitHubCommitGenerator 
        open={showCommitGenerator} 
        onClose={() => setShowCommitGenerator(false)} 
      />
    </div>
  );
}
