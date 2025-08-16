'use client';

import React, { useState } from 'react';
import { Key, AlertCircle, CheckCircle, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GoogleAuthSetupProps {
  onSetupComplete?: () => void;
}

export function GoogleAuthSetup({ onSetupComplete }: GoogleAuthSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  const steps = [
    {
      id: 1,
      title: 'Enable Google Drive API',
      description: 'Enable the Google Drive API in your Google Cloud Console',
      action: 'Go to Google Cloud Console',
      url: 'https://console.cloud.google.com/',
      completed: false
    },
    {
      id: 2,
      title: 'Create Service Account',
      description: 'Create a service account for API access',
      action: 'Create Service Account',
      url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
      completed: false
    },
    {
      id: 3,
      title: 'Download Key File',
      description: 'Download the JSON key file for your service account',
      action: 'Download Key',
      url: '#',
      completed: false
    },
    {
      id: 4,
      title: 'Share Google Drive Folder',
      description: 'Share a folder with your service account email',
      action: 'Share Folder',
      url: 'https://drive.google.com/',
      completed: false
    },
    {
      id: 5,
      title: 'Configure Environment',
      description: 'Add the key file path to your environment variables',
      action: 'View Instructions',
      url: '#',
      completed: false
    }
  ];

  const handleStepComplete = (stepId: number) => {
    const updatedSteps = steps.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    );
    
    if (stepId === steps.length) {
      setIsCompleted(true);
      onSetupComplete?.();
    } else {
      setCurrentStep(stepId + 1);
    }
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Google Authentication Setup
        </h1>
        <p className="text-gray-600">
          Follow these steps to connect your Google Drive account and start using Google Resources.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Setup Steps */}
      <div className="space-y-4 mb-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`border rounded-lg p-6 transition-all duration-200 ${
              step.completed 
                ? 'border-green-200 bg-green-50' 
                : step.id === currentStep
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start space-x-4">
              {/* Step Number */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.completed
                  ? 'bg-green-500 text-white'
                  : step.id === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step.completed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {step.description}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => handleExternalLink(step.url)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{step.action}</span>
                  </Button>

                  {!step.completed && step.id === currentStep && (
                    <Button
                      onClick={() => handleStepComplete(step.id)}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Mark Complete</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Environment Variables */}
      {currentStep >= 4 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Environment Variables
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
              <code className="text-sm text-gray-700">
                GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Add this to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file
            </p>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {isCompleted && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Setup Complete!
          </h2>
          <p className="text-gray-600 mb-6">
            Your Google Drive is now connected. You can start using Google Resources.
          </p>
          <Button
            onClick={() => window.location.reload()}
            size="lg"
          >
            Start Using Google Resources
          </Button>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Need Help?
            </h3>
            <p className="text-blue-800 mb-3">
              If you encounter any issues during setup, check our detailed documentation or contact support.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/GOOGLE_RESOURCES_SETUP.md', '_blank')}
              >
                View Documentation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://developers.google.com/drive/api/guides/about-sdk', '_blank')}
              >
                Google Drive API Docs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
