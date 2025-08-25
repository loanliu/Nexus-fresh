'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Plus, 
  Loader2, 
  CheckCircle, 
  X,
  Target,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCreateTask, useLabels } from '@/hooks/use-project-management';
import { CreateTaskData, Task } from '@/types/project-management';
import { useAuth } from '@/components/auth/auth-provider';

interface NaturalLanguageTaskCaptureProps {
  onTaskCreate: (task: Task) => void;
  projectId?: string;
}

export function NaturalLanguageTaskCapture({ onTaskCreate, projectId }: NaturalLanguageTaskCaptureProps) {
  const { user } = useAuth();
  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Omit<CreateTaskData, 'user_id'>[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const createTask = useCreateTask();
  const { data: labels = [] } = useLabels();

  const generateSubtasks = async () => {
    if (!goal.trim()) {
      toast.error('Please enter a goal first');
      return;
    }

    console.log('generateSubtasks called with goal:', goal);
    setIsGenerating(true);
    try {
      // Simulate AI generation - replace with actual AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
            // Generate truly dynamic subtasks based on goal content analysis
      const goalLower = goal.toLowerCase();
      console.log('goalLower:', goalLower);
      let subtasks: Omit<CreateTaskData, 'user_id'>[] = [];
      
      // Analyze the goal content for specific keywords and generate relevant tasks
      console.log('Analyzing goal content for dynamic task generation...');
      
      // Extract key concepts from the goal
      const keyConcepts = [];
      if (goalLower.includes('deploy')) keyConcepts.push('deployment');
      if (goalLower.includes('vercel')) keyConcepts.push('vercel');
      if (goalLower.includes('hosting')) keyConcepts.push('hosting');
      if (goalLower.includes('website')) keyConcepts.push('website');
      if (goalLower.includes('bolt.new')) keyConcepts.push('external_integration');
      if (goalLower.includes('link')) keyConcepts.push('linking');
      if (goalLower.includes('web app') || goalLower.includes('webapp')) keyConcepts.push('web_application');
      
      console.log('Key concepts detected:', keyConcepts);
      
      // Generate dynamic subtasks based on detected concepts
      if (keyConcepts.includes('deployment') && keyConcepts.includes('vercel')) {
        console.log('Generating Vercel deployment-specific tasks');
        subtasks = [
          {
            title: 'Set up Vercel project configuration',
            description: `Configure Vercel project settings for ${goal.includes('nexus') ? 'Nexus' : 'your web app'} deployment`,
            status: 'pending',
            priority: 'high',
            effort: 3,
            estimated_hours: 2
          },
          {
            title: 'Configure environment variables and secrets',
            description: 'Set up necessary environment variables, API keys, and configuration for production deployment',
            status: 'pending',
            priority: 'high',
            effort: 2,
            estimated_hours: 1.5
          },
          {
            title: 'Set up custom domain and DNS configuration',
            description: 'Configure domain settings, SSL certificates, and DNS records for your Vercel deployment',
            status: 'pending',
            priority: 'medium',
            effort: 3,
            estimated_hours: 2
          },
          {
            title: 'Test deployment pipeline and build process',
            description: 'Verify that the build process works correctly and all dependencies are properly configured',
            status: 'pending',
            priority: 'high',
            effort: 2,
            estimated_hours: 2
          },
          {
            title: 'Monitor deployment status and performance',
            description: 'Track deployment progress, check for errors, and verify the app is running correctly',
            status: 'pending',
            priority: 'medium',
            effort: 1,
            estimated_hours: 1
          }
        ];
      } else if (keyConcepts.includes('external_integration') && keyConcepts.includes('bolt.new')) {
        console.log('Generating external integration tasks');
        subtasks = [
          {
            title: 'Research bolt.new website structure and API',
            description: 'Analyze the bolt.new website to understand how to properly integrate and link to it',
            status: 'pending',
            priority: 'high',
            effort: 2,
            estimated_hours: 2
          },
          {
            title: 'Design integration architecture and user flow',
            description: 'Plan how users will navigate between your app and the bolt.new website seamlessly',
            status: 'pending',
            priority: 'high',
            effort: 3,
            estimated_hours: 3
          },
          {
            title: 'Implement external link functionality',
            description: 'Add clickable links, buttons, or navigation elements that connect to bolt.new',
            status: 'pending',
            priority: 'medium',
            effort: 2,
            estimated_hours: 2
          },
          {
            title: 'Test cross-site navigation and user experience',
            description: 'Verify that users can smoothly transition between your app and bolt.new website',
            status: 'pending',
            priority: 'medium',
            effort: 2,
            estimated_hours: 2
          },
          {
            title: 'Add analytics and tracking for external links',
            description: 'Implement tracking to monitor how users interact with the bolt.new integration',
            status: 'pending',
            priority: 'low',
            effort: 1,
            estimated_hours: 1
          }
        ];
      } else if (keyConcepts.includes('web_application')) {
        console.log('Generating web application development tasks');
        subtasks = [
          {
            title: 'Set up development environment and tools',
            description: 'Install and configure necessary development tools, frameworks, and dependencies',
            status: 'pending',
            priority: 'high',
            effort: 2,
            estimated_hours: 2
          },
          {
            title: 'Create project structure and architecture',
            description: 'Design and implement the foundational structure for your web application',
            status: 'pending',
            priority: 'high',
            effort: 3,
            estimated_hours: 4
          },
          {
            title: 'Implement core functionality and features',
            description: 'Develop the main features and functionality based on your requirements',
            status: 'pending',
            priority: 'high',
            effort: 4,
            estimated_hours: 6
          },
          {
            title: 'Design and implement user interface',
            description: 'Create responsive and user-friendly interface components and layouts',
            status: 'pending',
            priority: 'medium',
            effort: 3,
            estimated_hours: 4
          },
          {
            title: 'Test and debug application functionality',
            description: 'Perform comprehensive testing to ensure all features work correctly',
            status: 'pending',
            priority: 'medium',
            effort: 2,
            estimated_hours: 3
          }
        ];
      } else {
        // Fallback: Generate tasks based on general goal analysis
        console.log('Generating general goal-based tasks');
        const words = goal.split(' ').filter(word => word.length > 3);
        const uniqueWords = Array.from(new Set(words)).slice(0, 5);
        
        subtasks = uniqueWords.map((word, index) => ({
          title: `Complete ${word}-related task ${index + 1}`,
          description: `Work on the ${word} aspect of your goal: ${goal}`,
          status: 'pending',
          priority: index < 2 ? 'high' : 'medium',
          effort: Math.max(1, Math.min(5, 3 + (index % 3))),
          estimated_hours: Math.max(2, Math.min(16, Math.round(4 + (index * 2))))
        }));
      }
      
      console.log('Dynamic subtasks generated:', subtasks.length, 'tasks');

      // Add some randomization to make it feel more AI-like
      console.log('Before randomization:', subtasks);
      
      // Simple randomization - just vary effort and hours slightly
      subtasks = subtasks.map(task => {
        const newEffort = Math.max(1, Math.min(5, task.effort + (Math.random() > 0.5 ? 1 : -1)));
        const newHours = Math.max(2, Math.round((task.estimated_hours || 8) + (Math.random() - 0.5) * 4));
        
        console.log(`Task: ${task.title}, Original effort: ${task.effort}, New effort: ${newEffort}`);
        console.log(`Original hours: ${task.estimated_hours}, New hours: ${newHours}`);
        
        return {
          ...task,
          effort: newEffort,
          estimated_hours: newHours
        };
      });
      
      console.log('After randomization:', subtasks);

      console.log('Final subtasks array:', subtasks);
      setGeneratedTasks(subtasks);
      setShowForm(true);
      toast.success(projectId ? 'Project subtasks generated successfully!' : 'Subtasks generated successfully!');
    } catch (error) {
      toast.error('Failed to generate subtasks');
      console.error('Error generating subtasks:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTask = async (taskData: CreateTaskData) => {
    try {
      const newTask = await createTask.mutateAsync({
        ...taskData,
        user_id: user?.id || '',
        project_id: projectId || undefined
      });
      
      onTaskCreate(newTask);
      toast.success(projectId ? 'Task added to project successfully!' : 'Task created successfully!');
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Error creating task:', error);
    }
  };

  const handleCreateAllTasks = async () => {
    try {
      for (const taskData of generatedTasks) {
        await createTask.mutateAsync({
          ...taskData,
          user_id: user?.id || '',
          project_id: projectId || undefined
        });
      }
      
      toast.success(projectId 
        ? `${generatedTasks.length} tasks added to project successfully!`
        : `${generatedTasks.length} tasks created successfully!`
      );
      setGeneratedTasks([]);
      setShowForm(false);
      setGoal('');
    } catch (error) {
      toast.error('Failed to create some tasks');
      console.error('Error creating tasks:', error);
    }
  };

  const removeTask = (index: number) => {
    setGeneratedTasks(prev => prev.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, updates: Partial<CreateTaskData>) => {
    setGeneratedTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, ...updates } : task
    ));
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {projectId ? 'Generate Project Subtasks' : 'AI-Powered Task Generation'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {projectId 
            ? 'Describe what you want to accomplish for this project and AI will generate relevant subtasks.'
            : 'Describe your goal in natural language and let AI generate a structured list of subtasks to help you achieve it.'
          }
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What do you want to accomplish?
          </label>
                      <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={projectId 
                ? "e.g., 'Deploy the web app to production' or 'Set up user authentication system'"
                : "e.g., 'Launch a new website for my business' or 'Organize my home office'"
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white dark:text-gray-900"
              rows={3}
            />
        </div>

        <div className="flex justify-center">
                      <Button
              onClick={generateSubtasks}
              disabled={!goal.trim() || isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
                ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {projectId ? 'Generate Project Subtasks' : 'Generate Subtasks'}
                </>
              )}
            </Button>
        </div>
      </div>

      {/* Generated Tasks Form */}
      {showForm && generatedTasks.length > 0 && (
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review and Customize Generated Tasks
              </h3>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 mb-6">
              {generatedTasks.map((task, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(index, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-medium"
                        placeholder="Task title"
                      />
                      
                      <textarea
                        value={task.description}
                        onChange={(e) => updateTask(index, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        rows={2}
                        placeholder="Task description"
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(index)}
                      className="text-red-600 hover:text-red-700 ml-3"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <select
                        value={task.priority}
                        onChange={(e) => updateTask(index, { priority: e.target.value as any })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Effort (1-5)
                      </label>
                      <select
                        value={task.effort}
                        onChange={(e) => updateTask(index, { effort: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Est. Hours
                      </label>
                      <input
                        type="number"
                        value={task.estimated_hours || 8}
                        onChange={(e) => updateTask(index, { estimated_hours: parseInt(e.target.value) || 8 })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="8"
                        min="1"
                        step="1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedTasks([]);
                  setShowForm(false);
                  setGoal('');
                }}
              >
                Start Over
              </Button>
              
              <div className="flex space-x-3">
                                                  <Button
                                       onClick={() => generatedTasks.forEach(task => handleCreateTask({ ...task, user_id: user?.id || '', project_id: projectId || undefined }))}
                   className="bg-blue-600 hover:bg-blue-700 text-white"
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   {projectId ? 'Add All to Project' : 'Create All Tasks'}
                 </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
