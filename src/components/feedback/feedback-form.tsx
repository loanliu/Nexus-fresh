'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  X,
  Lightbulb
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FeedbackFormProps {
  onClose?: () => void;
  className?: string;
}

export function FeedbackForm({ onClose, className = '' }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use our proxy API to avoid CORS issues
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      if (response.ok) {
        toast.success('Thank you for your feedback!');
        setFeedback('');
        setShowForm(false);
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          if (onClose) onClose();
        }, 3000);
      } else {
        throw new Error('Failed to send feedback');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAIFeedback = async () => {
    if (!feedback.trim()) {
      toast.error('Please start writing your feedback first');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Use our local AI endpoint
      const aiEndpoint = '/api/feedback/improve';
      
      const response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          instruction: 'Improve this feedback to be more clear, constructive, and helpful while maintaining the user\'s original intent and tone.'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.improvedFeedback || feedback);
        toast.success('AI has improved your feedback!');
      } else {
        throw new Error('Failed to generate AI feedback');
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      toast.error('AI assistance unavailable. Please continue writing your feedback.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!showForm) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${className}`}>
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-900 mb-2">
          Feedback Sent Successfully!
        </h3>
        <p className="text-green-700">
          Thank you for taking the time to share your thoughts. Your feedback helps us improve!
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Share Your Feedback
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Help us improve your experience
            </p>
          </div>
        </div>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Feedback
          </label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think! Share your suggestions, report issues, or let us know what you love about the app..."
            className="min-h-[120px] resize-none"
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {feedback.length}/1000 characters
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateAIFeedback}
              disabled={isGenerating || !feedback.trim() || isSubmitting}
              className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assist
                </>
              )}
            </Button>
          </div>
        </div>

        {/* AI Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">💡 Writing Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Be specific about what you liked or didn't like</li>
                <li>• Include steps to reproduce any issues</li>
                <li>• Suggest specific improvements when possible</li>
                <li>• Use the AI Assist button to improve your writing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-2">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!feedback.trim() || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Feedback
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
