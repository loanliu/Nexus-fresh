'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, GripVertical } from 'lucide-react';
import { useSubtasks, useCreateSubtask, useToggleSubtask, useRenameSubtask, useDeleteSubtask, useReorderSubtasks } from '@/hooks/subtasks';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

interface SubtaskListProps {
  taskId: string;
  className?: string;
}

export function SubtaskList({ taskId, className = '' }: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskStatus, setNewSubtaskStatus] = useState('');
  const [newSubtaskEstimateHours, setNewSubtaskEstimateHours] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingStatus, setEditingStatus] = useState('');
  const [editingEstimateHours, setEditingEstimateHours] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Hooks for subtask operations
  const { data: subtasks = [], isLoading, error } = useSubtasks(taskId);
  const createSubtask = useCreateSubtask(taskId);
  const toggleSubtask = useToggleSubtask(taskId);
  const renameSubtask = useRenameSubtask(taskId);
  const deleteSubtask = useDeleteSubtask(taskId);
  const reorderSubtasks = useReorderSubtasks(taskId);

  // Handle creating a new subtask
  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    
    try {
      const nextOrderIndex = subtasks.length;
      await createSubtask.mutateAsync({
        title: newSubtaskTitle.trim(),
        order_index: nextOrderIndex,
        status: newSubtaskStatus || 'pending',
        estimate_hours: newSubtaskEstimateHours
      });
      
      setNewSubtaskTitle('');
      setNewSubtaskStatus('');
      setNewSubtaskEstimateHours(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create subtask:', error);
    }
  };

  // Handle starting edit mode
  const handleStartEdit = (subtask: any) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
    setEditingStatus(subtask.status || '');
    setEditingEstimateHours(subtask.estimate_hours || null);
  };

  // Handle saving edit
  const handleSaveEdit = async () => {
    if (!editingId || !editingTitle.trim()) return;
    
    try {
      // Update title
      await renameSubtask.mutateAsync({
        id: editingId,
        title: editingTitle.trim()
      });
      
      // Update status and estimate hours if they changed
      if (editingStatus !== undefined || editingEstimateHours !== undefined) {
        await supabase
          .from('subtasks')
          .update({
            status: editingStatus || 'pending',
            estimate_hours: editingEstimateHours
          })
          .eq('id', editingId);
      }
      
      setEditingId(null);
      setEditingTitle('');
      setEditingStatus('');
      setEditingEstimateHours(null);
    } catch (error) {
      console.error('Failed to update subtask:', error);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
    setEditingStatus('');
    setEditingEstimateHours(null);
  };

  // Handle toggling subtask completion
  const handleToggleSubtask = async (id: string, currentDone: boolean) => {
    try {
      await toggleSubtask.mutateAsync({ id, done: !currentDone });
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  // Handle deleting subtask
  const handleDeleteSubtask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subtask?')) return;
    
    try {
      await deleteSubtask.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  // Handle reordering subtasks
  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const reorderedSubtasks = [...subtasks];
    const [movedItem] = reorderedSubtasks.splice(fromIndex, 1);
    reorderedSubtasks.splice(toIndex, 0, movedItem);
    
    // Update order_index for all affected items
    const updates = reorderedSubtasks.map((subtask, index) => ({
      id: subtask.id,
      order_index: index
    }));
    
    try {
      await reorderSubtasks.mutateAsync(updates);
    } catch (error) {
      console.error('Failed to reorder subtasks:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error loading subtasks: {error.message}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Subtasks ({subtasks.length})
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="h-8 px-2 text-xs"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Subtask
        </Button>
      </div>

      {/* Create new subtask form */}
      {isCreating && (
        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* Title */}
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="Enter subtask title..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateSubtask()}
            autoFocus
          />
          
          {/* Status and Estimate Hours */}
          <div className="flex space-x-2">
            <select
              value={newSubtaskStatus}
              onChange={(e) => setNewSubtaskStatus(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">No Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <input
              type="number"
              value={newSubtaskEstimateHours || ''}
              onChange={(e) => setNewSubtaskEstimateHours(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Hours"
              className="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              min="0"
              step="0.5"
            />
          </div>
          
          {/* Buttons */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={handleCreateSubtask}
              disabled={!newSubtaskTitle.trim() || createSubtask.isPending}
              className="h-8 px-3"
            >
              {createSubtask.isPending ? 'Adding...' : 'Add'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                setNewSubtaskTitle('');
                setNewSubtaskStatus('');
                setNewSubtaskEstimateHours(null);
              }}
              className="h-8 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Subtasks list */}
      {subtasks.length === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          No subtasks yet. Click "Add Subtask" to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {subtasks.map((subtask, index) => (
            <div
              key={subtask.id}
              className={`flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors ${
                subtask.done ? 'opacity-75' : ''
              }`}
            >
              {/* Drag handle */}
              <button
                className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                onMouseDown={() => {/* TODO: Implement drag and drop */}}
              >
                <GripVertical className="w-4 h-4" />
              </button>

              {/* Checkbox */}
              <button
                onClick={() => handleToggleSubtask(subtask.id, subtask.done)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  subtask.done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
                disabled={toggleSubtask.isPending}
              >
                {subtask.done && <Check className="w-3 h-3" />}
              </button>

                             {/* Title */}
               <div className="flex-1 min-w-0">
                 {editingId === subtask.id ? (
                   <div className="space-y-2">
                     <input
                       type="text"
                       value={editingTitle}
                       onChange={(e) => setEditingTitle(e.target.value)}
                       className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                       onKeyDown={(e) => e.key === 'Escape' && handleCancelEdit()}
                       autoFocus
                     />
                     
                     {/* Status and Estimate Hours in Edit Mode */}
                     <div className="flex space-x-2">
                       <select
                         value={editingStatus}
                         onChange={(e) => setEditingStatus(e.target.value)}
                         className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       >
                         <option value="">No Status</option>
                         <option value="pending">Pending</option>
                         <option value="in_progress">In Progress</option>
                         <option value="completed">Completed</option>
                         <option value="cancelled">Cancelled</option>
                       </select>
                       
                       <input
                         type="number"
                         value={editingEstimateHours || ''}
                         onChange={(e) => setEditingEstimateHours(e.target.value ? parseFloat(e.target.value) : null)}
                         placeholder="Hours"
                         className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                         min="0"
                         step="0.5"
                       />
                     </div>
                   </div>
                 ) : (
                   <span
                     className={`text-sm ${
                       subtask.done
                         ? 'line-through text-gray-500 dark:text-gray-400'
                         : 'text-gray-900 dark:text-white'
                     }`}
                   >
                     {subtask.title}
                   </span>
                 )}
               </div>

              {/* Status */}
              {subtask.status && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  subtask.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  subtask.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {subtask.status.replace('_', ' ')}
                </span>
              )}

              {/* Estimate hours */}
              {subtask.estimate_hours && (
                <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {subtask.estimate_hours}h
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-1">
                {editingId === subtask.id ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editingTitle.trim() || renameSubtask.isPending}
                      className="h-6 px-2 text-xs"
                    >
                      {renameSubtask.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-6 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(subtask)}
                      className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      disabled={deleteSubtask.isPending}
                      className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
