'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';
import { FeedbackForm } from './feedback-form';

interface FeedbackButtonProps {
  variant?: 'default' | 'floating' | 'inline';
  className?: string;
  children?: React.ReactNode;
}

export function FeedbackButton({ 
  variant = 'floating', 
  className = '',
  children 
}: FeedbackButtonProps) {
  const [showForm, setShowForm] = useState(false);

  const toggleForm = () => setShowForm(!showForm);

  if (variant === 'floating') {
    return (
      <>
        {/* Floating Feedback Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={toggleForm}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-14 h-14 p-0"
            aria-label="Share Feedback"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        </div>

        {/* Feedback Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <FeedbackForm onClose={toggleForm} />
            </div>
          </div>
        )}
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <>
        <Button
          onClick={toggleForm}
          variant="outline"
          className={`border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 ${className}`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {children || 'Share Feedback'}
        </Button>

        {/* Inline Feedback Form */}
        {showForm && (
          <div className="mt-4">
            <FeedbackForm onClose={toggleForm} />
          </div>
        )}
      </>
    );
  }

  // Default variant
  return (
    <>
      <Button
        onClick={toggleForm}
        className={`bg-blue-600 hover:bg-blue-700 text-white ${className}`}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        {children || 'Share Feedback'}
      </Button>

      {/* Default Feedback Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <FeedbackForm onClose={toggleForm} />
          </div>
        </div>
      )}
    </>
  );
}
