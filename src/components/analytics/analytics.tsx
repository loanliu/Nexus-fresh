'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  FileText, 
  CheckSquare, 
  FolderOpen, 
  Key,
  Briefcase,
  Calendar,
  Download,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';
import { Chart, MetricCard, ProgressBar } from './chart-components';
import { ExportAnalytics } from './export-analytics';
import { 
  formatStorageSize, 
  formatPercentage, 
  generateInsights,
  getTimeRanges 
} from '@/lib/analytics-utils';

export function Analytics() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [showExport, setShowExport] = useState(false);
  const { data, loading, error, refetch } = useAnalytics();
  const timeRanges = getTimeRanges();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics & Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track resource usage, category distribution, and productivity metrics
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics & Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track resource usage, category distribution, and productivity metrics
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Activity className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Analytics
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
            {error}
          </p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics & Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track resource usage, category distribution, and productivity metrics
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Start using the app to see analytics and insights about your workflow.
          </p>
        </div>
      </div>
    );
  }

  const insights = generateInsights(data);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics & Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track resource usage, category distribution, and productivity metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
            {Object.entries(timeRanges).map(([key, range]) => (
              <button
                key={key}
                onClick={() => setTimeRange(key as 'week' | 'month' | 'quarter')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  timeRange === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowExport(true)}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Resources"
          value={data.totalResources}
          subtitle={`${data.recentUploads} added this week`}
          icon={<FileText className="h-8 w-8 text-blue-600" />}
        />
        <MetricCard
          title="Active Tasks"
          value={data.totalTasks}
          subtitle={`${data.completedTasksThisWeek} completed this week`}
          icon={<CheckSquare className="h-8 w-8 text-green-600" />}
        />
        <MetricCard
          title="Categories"
          value={data.totalCategories}
          subtitle="Organizational structure"
          icon={<FolderOpen className="h-8 w-8 text-purple-600" />}
        />
        <MetricCard
          title="Storage Used"
          value={formatStorageSize(data.storageUsed)}
          subtitle="Total file storage"
          icon={<Activity className="h-8 w-8 text-orange-600" />}
        />
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Smart Insights
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800 dark:text-blue-200">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Distribution by Category */}
        <Chart
          data={data.resourcesByCategory}
          title="Resources by Category"
          type="pie"
          height={300}
        />

        {/* Task Status Distribution */}
        <Chart
          data={data.tasksByStatus}
          title="Tasks by Status"
          type="bar"
          height={300}
        />

        {/* File Types */}
        <Chart
          data={data.resourcesByType}
          title="File Types"
          type="bar"
          height={300}
        />

        {/* API Keys by Service */}
        <Chart
          data={data.apiKeysByService}
          title="API Keys by Service"
          type="pie"
          height={300}
        />
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Task Completion Progress
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="This Week"
              value={data.completedTasksThisWeek}
              max={data.totalTasks}
            />
            <ProgressBar
              label="This Month"
              value={data.tasksCompletedThisMonth}
              max={data.totalTasks}
            />
            <ProgressBar
              label="Overdue Tasks"
              value={data.overdueTasks}
              max={data.totalTasks}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Project Status
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="Active Projects"
              value={data.activeProjects}
              max={data.totalProjects}
            />
            <ProgressBar
              label="Completed Projects"
              value={data.completedProjects}
              max={data.totalProjects}
            />
            <ProgressBar
              label="Storage Usage"
              value={data.storageUsed}
              max={1024 * 1024 * 1024} // 1GB limit example
            />
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Categories by Resources
          </h3>
          <div className="space-y-3">
            {data.categoriesWithMostResources.slice(0, 5).map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {category.count} resources
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Categories by Tasks
          </h3>
          <div className="space-y-3">
            {data.categoriesWithMostTasks.slice(0, 5).map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {category.count} tasks
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Google Drive Integration Status */}
      {data.googleDriveFiles > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Google Drive Integration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data.googleDriveFiles}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Accessible Files
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatStorageSize(data.googleDriveStorage)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Storage Used
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data.recentGoogleDriveActivity}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Recent Activity
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExport && data && (
        <ExportAnalytics 
          data={data} 
          onClose={() => setShowExport(false)} 
        />
      )}
    </div>
  );
}
