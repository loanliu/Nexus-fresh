'use client';

import React from 'react';
import { MessageSquare, Heart, Lightbulb, Bug, Star, Users } from 'lucide-react';
import { FeedbackForm } from './feedback-form';

export function FeedbackPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          We'd Love Your Feedback!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your thoughts help us make Nexus even better. Share your experience, suggestions, 
          or report any issues you've encountered.
        </p>
      </div>

      {/* Feedback Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            What You Love
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tell us what features you enjoy most and what's working well for you.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Suggestions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Share ideas for new features or improvements that would help your workflow.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bug className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Report Issues
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Help us identify and fix any bugs or problems you've encountered.
          </p>
        </div>
      </div>

      {/* Feedback Form */}
      <div className="max-w-4xl mx-auto">
        <FeedbackForm />
      </div>

      {/* Additional Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              Why Your Feedback Matters
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Helps us prioritize the most important features</li>
              <li>• Identifies usability issues we might miss</li>
              <li>• Guides our development roadmap</li>
              <li>• Ensures we're building what you actually need</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              What Happens Next
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Your feedback is sent directly to our team</li>
              <li>• We review and categorize all submissions</li>
              <li>• Popular requests influence our development</li>
              <li>• We may follow up for more details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
