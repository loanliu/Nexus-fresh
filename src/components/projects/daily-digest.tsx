'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target, 
  Settings,
  Send,
  TestTube,
  ToggleLeft,
  ToggleRight,
  Mail,
  MessageSquare,
  Zap,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Task, Project, DailyDigestSettings } from '@/types/project-management';
import { useTasks, useDailyDigestSettings } from '@/hooks/use-project-management';
import { useAuth } from '@/components/auth/auth-provider';

interface DailyDigestProps {
  onSettingsUpdate?: (settings: DailyDigestSettings) => void;
}

export function DailyDigest({ onSettingsUpdate }: DailyDigestProps) {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const { data: allTasks = [] } = useTasks();
  const { data: digestSettings, isLoading: settingsLoading } = useDailyDigestSettings();

  // Generate digest data
  const digestData = useMemo((): {
    dueToday: Task[];
    atRisk: Task[];
    needsDecision: Task[];
    blocked: Task[];
    idleTasks: Task[];
  } => {
    const today = new Date();
    const idleThreshold = new Date();
    idleThreshold.setDate(today.getDate() - (digestSettings?.idle_task_threshold || 7));

    return {
      dueToday: allTasks.filter(task => {
        if (!task.due_date || task.status === 'completed') return false;
        const dueDate = new Date(task.due_date);
        return dueDate.toDateString() === today.toDateString();
      }),
      atRisk: allTasks.filter(task => {
        if (!task.due_date || task.status === 'completed') return false;
        const dueDate = new Date(task.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 2 && daysUntilDue > 0;
      }),
      needsDecision: allTasks.filter(task => 
        task.status === 'pending' && task.priority === 'high'
      ),
      blocked: allTasks.filter(task => 
        task.status === 'pending' && task.priority === 'urgent'
      ),
      idleTasks: allTasks.filter(task => {
        if (task.status === 'completed') return false;
        const lastActivity = new Date(task.updated_at);
        return lastActivity < idleThreshold;
      })
    };
  }, [allTasks, digestSettings]);

  const handleSendDigest = async () => {
    setIsSending(true);
    try {
      // Simulate sending digest
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSent(new Date().toISOString());
      toast.success('Daily digest sent successfully!');
    } catch (error) {
      toast.error('Failed to send digest');
    } finally {
      setIsSending(false);
    }
  };

  const handleTestDigest = async () => {
    try {
      // Simulate test digest
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Test digest sent successfully!');
    } catch (error) {
      toast.error('Failed to send test digest');
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Digest</h2>
          <p className="text-gray-600">Proactive alerts and daily summaries</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleTestDigest}
            variant="outline"
            size="sm"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button
            onClick={handleSendDigest}
            disabled={isSending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Now
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Digest Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-blue-600">{digestData.dueToday.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">At Risk</p>
              <p className="text-2xl font-bold text-orange-600">{digestData.atRisk.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Need Decision</p>
              <p className="text-2xl font-bold text-purple-600">{digestData.needsDecision.length}</p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blocked</p>
              <p className="text-2xl font-bold text-red-600">{digestData.blocked.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Idle Tasks</p>
              <p className="text-2xl font-bold text-gray-600">{digestData.idleTasks.length}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Digest Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Today */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Due Today ({digestData.dueToday.length})
          </h3>
          {digestData.dueToday.length > 0 ? (
            <div className="space-y-3">
              {digestData.dueToday.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">
                      Effort: {task.effort} • Priority: {task.priority}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No tasks due today</p>
          )}
        </div>

        {/* At Risk */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            At Risk ({digestData.atRisk.length})
          </h3>
          {digestData.atRisk.length > 0 ? (
            <div className="space-y-3">
              {digestData.atRisk.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(task.due_date!).toLocaleDateString()} • Effort: {task.effort}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    At Risk
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No tasks at risk</p>
          )}
        </div>

        {/* Need Decision */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            Need Decision ({digestData.needsDecision.length})
          </h3>
          {digestData.needsDecision.length > 0 ? (
            <div className="space-y-3">
              {digestData.needsDecision.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">
                      High priority • Effort: {task.effort}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    High Priority
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No high-priority decisions needed</p>
          )}
        </div>

        {/* Idle Tasks */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-600" />
            Idle Tasks ({digestData.idleTasks.length})
          </h3>
          {digestData.idleTasks.length > 0 ? (
            <div className="space-y-3">
              {digestData.idleTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">
                      Last activity: {new Date(task.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Idle
                  </span>
                </div>
              ))}
              {digestData.idleTasks.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{digestData.idleTasks.length - 5} more idle tasks
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No idle tasks</p>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Digest Settings</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Daily Digest</h4>
                  <p className="text-sm text-gray-600">Automatically send daily summaries</p>
                </div>
                <Button
                  variant={digestSettings?.is_enabled ? "default" : "outline"}
                  onClick={() => {
                    // Toggle digest settings
                  }}
                  className={digestSettings?.is_enabled ? "bg-blue-600" : ""}
                >
                  {digestSettings?.is_enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {/* Send Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Time
                </label>
                <input
                  type="time"
                  value={digestSettings?.digest_time || "09:00"}
                  onChange={(e) => {
                    // Update digest time
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Channels */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Notification Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-gray-600" />
                      <span>Email</span>
                    </div>
                    <Button
                      variant={digestSettings?.channels.includes('email') ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        // Toggle email channel
                      }}
                    >
                      {digestSettings?.channels.includes('email') ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-3 text-gray-600" />
                      <span>Slack</span>
                    </div>
                    <Button
                      variant={digestSettings?.channels.includes('slack') ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        // Toggle slack channel
                      }}
                    >
                      {digestSettings?.channels.includes('slack') ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 mr-3 text-gray-600" />
                      <span>Webhook</span>
                    </div>
                    <Button
                      variant={digestSettings?.webhook_url ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        // Toggle webhook
                      }}
                    >
                      {digestSettings?.webhook_url ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Idle Task Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idle Task Threshold (days)
                </label>
                <input
                  type="number"
                  value={digestSettings?.idle_task_threshold || 7}
                  onChange={(e) => {
                    // Update idle threshold
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="30"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Tasks with no activity for this many days will be marked as idle
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                onClick={() => setShowSettings(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Save settings
                  setShowSettings(false);
                  toast.success('Settings saved successfully!');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Last Sent Info */}
      {lastSent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">
              Last digest sent on {new Date(lastSent).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
