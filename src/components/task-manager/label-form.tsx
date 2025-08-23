// Task Manager MVP Label Form Component
// Phase 1: Core Label Creation

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateLabel } from '@/hooks/use-task-manager';
import { LABEL_COLORS } from '@/types/task-manager';

// Form validation schema
const labelFormSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(100, 'Label name must be less than 100 characters'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

type LabelFormValues = z.infer<typeof labelFormSchema>;

interface LabelFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LabelForm({ open, onClose, onSuccess }: LabelFormProps) {
  const createLabel = useCreateLabel();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<LabelFormValues>({
    resolver: zodResolver(labelFormSchema),
    defaultValues: {
      name: '',
      color: LABEL_COLORS[0],
    },
  });

  const watchedColor = watch('color');

  const onSubmit = async (data: LabelFormValues) => {
    try {
      await createLabel.mutateAsync(data);
      reset();
      onSuccess?.(); // Call onSuccess if provided
      onClose();
    } catch (error) {
      console.error('Failed to create label:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Label</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Label Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label Name *
            </label>
            <Input
              {...register('name')}
              placeholder="Enter label name..."
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="inline h-4 w-4 mr-1" />
              Label Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {LABEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    watchedColor === color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <Input
              {...register('color')}
              className="mt-2 font-mono text-sm"
              placeholder="#6B7280"
            />
            {errors.color && (
              <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? 'Creating...' : 'Create Label'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
