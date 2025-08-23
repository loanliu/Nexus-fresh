export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
}

export function getTimeRanges() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  return {
    week: { start: oneWeekAgo, end: now, label: 'Last 7 days' },
    month: { start: oneMonthAgo, end: now, label: 'Last 30 days' },
    quarter: { start: threeMonthsAgo, end: now, label: 'Last 90 days' }
  };
}

export function calculateTrend(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
  }
  
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(change), isPositive: change >= 0 };
}

export function getPriorityColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
  }
}

export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    case 'in_progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    case 'overdue': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
  }
}

export function generateInsights(data: any): string[] {
  const insights: string[] = [];
  
  // Resource insights
  if (data.totalResources > 0) {
    if (data.recentUploads > 0) {
      insights.push(`You've added ${data.recentUploads} resources this week`);
    }
    
    const topCategory = Object.entries(data.resourcesByCategory)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    if (topCategory) {
      insights.push(`"${topCategory[0]}" is your most active category with ${topCategory[1]} resources`);
    }
  }
  
  // Task insights
  if (data.totalTasks > 0) {
    if (data.completedTasksThisWeek > 0) {
      insights.push(`Great job! You completed ${data.completedTasksThisWeek} tasks this week`);
    }
    
    if (data.overdueTasks > 0) {
      insights.push(`You have ${data.overdueTasks} overdue tasks - consider reprioritizing`);
    }
    
    const completionRate = (data.tasksCompletedThisMonth / data.totalTasks) * 100;
    if (completionRate > 80) {
      insights.push(`Excellent task completion rate: ${completionRate.toFixed(1)}% this month`);
    }
  }
  
  // Project insights
  if (data.totalProjects > 0) {
    if (data.activeProjects > 0) {
      insights.push(`You have ${data.activeProjects} active projects in progress`);
    }
    
    if (data.completedProjects > 0) {
      insights.push(`Congratulations on completing ${data.completedProjects} projects!`);
    }
  }
  
  // API insights
  if (data.totalApiKeys > 0) {
    insights.push(`You're managing ${data.totalApiKeys} API keys across ${Object.keys(data.apiKeysByService).length} services`);
  }
  
  // Google Drive insights
  if (data.googleDriveFiles > 0) {
    insights.push(`Connected to Google Drive with ${data.googleDriveFiles} accessible files`);
  }
  
  return insights;
}
