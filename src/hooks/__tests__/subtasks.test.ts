// Test file for subtasks hooks
// This file tests the core functionality of our subtasks hooks

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubtasks, useCreateSubtask, useToggleSubtask } from '../subtasks';

// Mock Supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [
              {
                id: '1',
                task_id: 'task-1',
                title: 'Test Subtask 1',
                done: false,
                order_index: 0,
                estimate_hours: 2,
                created_at: '2024-01-01T00:00:00Z'
              }
            ],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: '2',
              task_id: 'task-1',
              title: 'New Subtask',
              done: false,
              order_index: 1,
              estimate_hours: 1,
              created_at: '2024-01-01T00:00:00Z'
            },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: '1',
                task_id: 'task-1',
                title: 'Test Subtask 1',
                done: true,
                order_index: 0,
                estimate_hours: 2,
                created_at: '2024-01-01T00:00:00Z'
              },
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}));

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Subtasks Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSubtasks', () => {
    it('should fetch subtasks for a task', async () => {
      const { result } = renderHook(() => useSubtasks('task-1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].title).toBe('Test Subtask 1');
    });

    it('should not run when taskId is empty', () => {
      const { result } = renderHook(() => useSubtasks(''), {
        wrapper: createWrapper()
      });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useCreateSubtask', () => {
    it('should create a new subtask', async () => {
      const { result } = renderHook(() => useCreateSubtask('task-1'), {
        wrapper: createWrapper()
      });

      const createSubtask = result.current.mutateAsync;
      
      await createSubtask({ title: 'New Subtask', order_index: 1 });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('useToggleSubtask', () => {
    it('should toggle subtask completion status', async () => {
      const { result } = renderHook(() => useToggleSubtask('task-1'), {
        wrapper: createWrapper()
      });

      const toggleSubtask = result.current.mutateAsync;
      
      await toggleSubtask({ id: '1', done: true });

      expect(result.current.isSuccess).toBe(true);
    });
  });
});

// Test utility functions
export const testUtils = {
  createMockSubtask: (overrides: Partial<any> = {}) => ({
    id: 'test-id',
    task_id: 'task-1',
    title: 'Test Subtask',
    done: false,
    order_index: 0,
    estimate_hours: 1,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  }),
  
  createMockSubtasksArray: (count: number = 3) => 
    Array.from({ length: count }, (_, i) => testUtils.createMockSubtask({
      id: `subtask-${i + 1}`,
      title: `Test Subtask ${i + 1}`,
      order_index: i
    }))
};
