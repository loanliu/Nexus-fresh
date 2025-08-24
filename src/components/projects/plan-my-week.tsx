'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Target, 
  AlertTriangle,
  Plus,
  X,
  TrendingUp,
  BarChart3,
  Zap,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTasks, useUpdateTask } from '@/hooks/use-project-management';
import { Task, WeeklyCapacity, WeeklyPlan, PlannedTask } from '@/types/project-management';

interface PlanMyWeekProps {
  onPlanUpdate: (plan: WeeklyPlan) => void;
}

export function PlanMyWeek({ onPlanUpdate }: PlanMyWeekProps) {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    return startOfWeek.toISOString().split('T')[0];
  });
  
  const [capacity, setCapacity] = useState<WeeklyCapacity>({
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 4,
    sunday: 2
  });

  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([]);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState('');

  const { data: allTasks = [], isLoading } = useTasks();
  const updateTask = useUpdateTask();

  // Get week start date from selected date
  const getWeekStart = (dateString: string) => {
    const date = new Date(dateString);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);
    return startOfWeek.toISOString().split('T')[0];
  };

  // Get week dates
  const getWeekDates = (weekStart: string) => {
    const dates = [];
    const start = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeek);
  const weekStart = getWeekStart(selectedWeek);

  // Filter tasks for the selected week
  const weekTasks = allTasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    return taskDate >= weekStartDate && taskDate <= weekEndDate;
  });

  // Calculate daily workload
  const getDailyWorkload = (date: string) => {
    const dayTasks = plannedTasks.filter(task => task.planned_date === date);
    return dayTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  };

  const getDayOfWeek = (date: string) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const day = new Date(date).getDay();
    return dayNames[day];
  };

  const getDayCapacity = (date: string) => {
    const dayName = getDayOfWeek(date);
    return capacity[dayName as keyof WeeklyCapacity];
  };

  const isOverloaded = (date: string) => {
    const workload = getDailyWorkload(date);
    const dayCapacity = getDayCapacity(date);
    return workload > dayCapacity;
  };

  const handleCapacityChange = (day: keyof WeeklyCapacity, value: number) => {
    setCapacity(prev => ({
      ...prev,
      [day]: Math.max(0, value)
    }));
  };

  const handlePlanTask = (task: Task, date: string) => {
    const existingIndex = plannedTasks.findIndex(pt => pt.task_id === task.id);
    
    if (existingIndex >= 0) {
      // Update existing plan
      setPlannedTasks(prev => prev.map((pt, i) => 
        i === existingIndex ? { ...pt, planned_date: date } : pt
      ));
    } else {
      // Add new plan
      const newPlan: PlannedTask = {
        task_id: task.id,
        planned_date: date,
        day_of_week: getDayOfWeek(date),
        estimated_hours: task.estimated_hours || 2
      };
      setPlannedTasks(prev => [...prev, newPlan]);
    }

    // Update task due date
    updateTask.mutateAsync({
      id: task.id,
      updates: { id: task.id, due_date: date }
    });

    toast.success(`Task "${task.title}" planned for ${new Date(date).toLocaleDateString()}`);
  };

  const handleRemoveTask = (taskId: string) => {
    setPlannedTasks(prev => prev.filter(pt => pt.task_id !== taskId));
    toast.success('Task removed from plan');
  };

  const handleSavePlan = () => {
    const weeklyPlan: WeeklyPlan = {
      week_start: weekStart,
      capacity,
      tasks: plannedTasks,
      overloads: weekDates
        .filter(date => isOverloaded(date))
        .map(date => ({
          date,
          day_of_week: getDayOfWeek(date),
          overload_hours: getDailyWorkload(date) - getDayCapacity(date),
          tasks: plannedTasks
            .filter(pt => pt.planned_date === date)
            .map(pt => pt.task_id)
        }))
    };

    onPlanUpdate(weeklyPlan);
    toast.success('Weekly plan saved successfully!');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Plan My Week
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Capacity-aware weekly planning with smart task distribution
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
            <Button
              onClick={() => setShowCapacityModal(true)}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Set Capacity
            </Button>
            <Button
              onClick={handleSavePlan}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Plan
            </Button>
          </div>
        </div>

        {/* Week Overview */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const dayName = getDayOfWeek(date);
            const workload = getDailyWorkload(date);
            const dayCapacity = getDayCapacity(date);
            const overloaded = isOverloaded(date);
            
            return (
              <div key={date} className="text-center">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className={`text-lg font-bold ${
                  overloaded ? 'text-red-600' : workload > dayCapacity * 0.8 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {workload}/{dayCapacity}h
                </div>
                {overloaded && (
                  <div className="text-xs text-red-600 font-medium">
                    +{workload - dayCapacity}h
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Week of {new Date(weekStart).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-4 p-6">
          {weekDates.map((date) => {
            const dayTasks = plannedTasks.filter(pt => pt.planned_date === date);
            const workload = getDailyWorkload(date);
            const dayCapacity = getDayCapacity(date);
            const overloaded = isOverloaded(date);
            
            return (
              <div key={date} className="min-h-[200px]">
                <div className={`p-3 rounded-lg border ${
                  overloaded 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {workload}/{dayCapacity}h
                  </div>
                  
                  <div className="space-y-2">
                    {dayTasks.map((plannedTask) => {
                      const task = allTasks.find(t => t.id === plannedTask.task_id);
                      if (!task) return null;
                      
                      return (
                        <div key={plannedTask.task_id} className="bg-white dark:bg-gray-700 rounded p-2 border border-gray-200 dark:border-gray-600">
                          <div className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                            {task.title}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-1 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {plannedTask.estimated_hours}h
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveTask(plannedTask.task_id)}
                            className="w-full mt-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {!overloaded && workload < dayCapacity && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowTaskModal(true);
                        setSelectedDate(date);
                      }}
                      className="w-full mt-3 text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Task
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Available Tasks ({weekTasks.filter(t => !plannedTasks.find(pt => pt.task_id === t.id)).length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag and drop or click to plan these tasks
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekTasks
              .filter(task => !plannedTasks.find(pt => pt.task_id === task.id))
              .map((task) => (
                <div key={task.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Est: {task.estimated_hours || 2}h
                    </span>
                    <span className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      Effort: {task.effort || 0}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {weekDates.map((date) => {
                      const dayCapacity = getDayCapacity(date);
                      const dayWorkload = getDailyWorkload(date);
                      const canFit = (task.estimated_hours || 2) <= (dayCapacity - dayWorkload);
                      
                      return (
                        <Button
                          key={date}
                          size="sm"
                          variant="outline"
                          onClick={() => handlePlanTask(task, date)}
                          disabled={!canFit}
                          className={`text-xs ${
                            canFit 
                              ? 'text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20' 
                              : 'text-gray-400 border-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Capacity Modal */}
      {showCapacityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Set Weekly Capacity
            </h3>
            
            <div className="space-y-4">
              {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                <div key={day} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {day}
                  </label>
                  <input
                    type="number"
                    value={capacity[day]}
                    onChange={(e) => handleCapacityChange(day, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    min="0"
                    max="24"
                    step="0.5"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCapacityModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => setShowCapacityModal(false)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Save Capacity
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Selection Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Task for {new Date(selectedDate).toLocaleDateString()}
            </h3>
            
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weekTasks
                  .filter(task => !plannedTasks.find(pt => pt.task_id === task.id))
                  .map((task) => (
                    <div key={task.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <span>Est: {task.estimated_hours || 2}h</span>
                        <span>Effort: {task.effort || 0}</span>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => {
                          handlePlanTask(task, selectedDate);
                          setShowTaskModal(false);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Plan for This Day
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setShowTaskModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
