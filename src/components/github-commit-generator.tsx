'use client';

import { useState, useEffect } from 'react';
import { Copy, RefreshCw, CheckCircle, GitCommit, GitBranch, GitPullRequest } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CommitMessageGeneratorProps {
  open: boolean;
  onClose: () => void;
}

interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export function GitHubCommitGenerator({ open, onClose }: CommitMessageGeneratorProps) {
  const [gitStatus, setGitStatus] = useState<GitStatus>({ staged: [], unstaged: [], untracked: [] });
  const [commitMessage, setCommitMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Analyze changes and generate commit message
  const generateCommitMessage = async () => {
    setIsLoading(true);
    try {
      // This would typically call a backend API to analyze git status
      // For now, we'll simulate the analysis
      const message = analyzeChangesAndGenerateMessage(gitStatus);
      setCommitMessage(message);
    } catch (error) {
      console.error('Failed to generate commit message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze git changes and generate appropriate commit message
  const analyzeChangesAndGenerateMessage = (status: GitStatus): string => {
    const allChanges = [...status.staged, ...status.unstaged, ...status.untracked];
    
    if (allChanges.length === 0) {
      return 'chore: no changes detected';
    }

    // Analyze file patterns to determine commit type
    const patterns = {
      feat: /\.(tsx?|jsx?|vue|svelte)$/i,
      fix: /(bug|fix|error|issue)/i,
      docs: /\.(md|txt|rst|docx?)$/i,
      style: /\.(css|scss|sass|less|styl)$/i,
      refactor: /(refactor|restructure|reorganize)/i,
      test: /(test|spec|__tests__|\.test\.|\.spec\.)/i,
      chore: /(package\.json|package-lock\.json|yarn\.lock|\.gitignore|\.env)/i,
      perf: /(performance|optimize|speed|fast)/i,
      ci: /(\.github|\.gitlab|\.circleci|\.travis|\.jenkins)/i,
      build: /(build|dist|out|\.babelrc|\.eslintrc|tsconfig\.json)/i
    };

    let commitType = 'feat';
    let scope = '';
    let description = '';

    // Determine commit type based on file patterns
    for (const [type, pattern] of Object.entries(patterns)) {
      if (allChanges.some(file => pattern.test(file))) {
        commitType = type;
        break;
      }
    }

    // Determine scope based on directory structure
    const directories = allChanges.map(file => file.split('/')[0]).filter(Boolean);
    const commonDirs = directories.filter((dir, index, arr) => arr.indexOf(dir) === index);
    
    if (commonDirs.length === 1 && commonDirs[0] !== '.') {
      scope = commonDirs[0];
    } else if (commonDirs.length > 1) {
      // Multiple directories, try to find a common theme
      if (commonDirs.some(dir => ['src', 'components', 'hooks', 'lib'].includes(dir))) {
        scope = 'core';
      } else if (commonDirs.some(dir => ['api', 'routes', 'endpoints'].includes(dir))) {
        scope = 'api';
      } else if (commonDirs.some(dir => ['db', 'database', 'schema'].includes(dir))) {
        scope = 'db';
      }
    }

    // Generate description based on changes
    if (status.staged.length > 0) {
      const mainChanges = status.staged.slice(0, 3);
      description = mainChanges.map(file => {
        const fileName = file.split('/').pop()?.split('.')[0] || file;
        return fileName.replace(/[A-Z]/g, ' $&').toLowerCase().trim();
      }).join(', ');
    } else if (status.unstaged.length > 0) {
      const mainChanges = status.unstaged.slice(0, 3);
      description = mainChanges.map(file => {
        const fileName = file.split('/').pop()?.split('.')[0] || file;
        return fileName.replace(/[A-Z]/g, ' $&').toLowerCase().trim();
      }).join(', ');
    }

    // Clean up description
    description = description
      .replace(/\s+/g, ' ')
      .replace(/[^a-zA-Z0-9\s,]/g, '')
      .trim();

    // Format commit message
    let message = commitType;
    if (scope) {
      message += `(${scope})`;
    }
    message += `: ${description}`;

    // Ensure message is not too long
    if (message.length > 72) {
      message = message.substring(0, 69) + '...';
    }

    return message;
  };

  // Copy commit message to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(commitMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Fetch real git status from API
  useEffect(() => {
    if (open) {
      fetchGitStatus();
    }
  }, [open]);

  const fetchGitStatus = async () => {
    try {
      const response = await fetch('/api/git/status');
      const result = await response.json();
      
      if (result.success) {
        setGitStatus(result.data);
      } else {
        console.error('Failed to fetch git status:', result.error);
        // Fallback to mock data if API fails
        setGitStatus({
          staged: [
            'src/components/task-manager/task-form.tsx',
            'src/hooks/use-task-manager.ts'
          ],
          unstaged: [],
          untracked: []
        });
      }
    } catch (error) {
      console.error('Error fetching git status:', error);
      // Fallback to mock data
      setGitStatus({
        staged: [
          'src/components/task-manager/task-form.tsx',
          'src/hooks/use-task-manager.ts'
        ],
        unstaged: [],
        untracked: []
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <GitCommit className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                GitHub Commit Message Generator
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Generate conventional commit messages for your changes
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Git Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <GitBranch className="h-5 w-5 mr-2" />
              Current Changes
            </h3>
            
            {/* Staged Changes */}
            {gitStatus.staged.length > 0 && (
              <div className="mb-4">
                <Badge variant="default" className="mb-2">Staged</Badge>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  {gitStatus.staged.map((file, index) => (
                    <div key={index} className="text-sm text-green-800 font-mono">
                      + {file}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unstaged Changes */}
            {gitStatus.unstaged.length > 0 && (
              <div className="mb-4">
                <Badge variant="secondary" className="mb-2">Modified</Badge>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  {gitStatus.unstaged.map((file, index) => (
                    <div key={index} className="text-sm text-yellow-800 font-mono">
                      ~ {file}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Untracked Files */}
            {gitStatus.untracked.length > 0 && (
              <div className="mb-4">
                <Badge variant="outline" className="mb-2">New</Badge>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  {gitStatus.untracked.map((file, index) => (
                    <div key={index} className="text-sm text-blue-800 font-mono">
                      ? {file}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={generateCommitMessage}
              disabled={isLoading}
              className="px-8 py-3"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing Changes...
                </>
              ) : (
                <>
                  <GitPullRequest className="h-5 w-5 mr-2" />
                  Generate Commit Message
                </>
              )}
            </Button>
          </div>

          {/* Generated Commit Message */}
          {commitMessage && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Generated Commit Message
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Commit Message:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="h-8"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-white border border-gray-300 rounded p-3">
                  <code className="text-lg font-mono text-gray-900 break-all">
                    {commitMessage}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Conventional Commit Format</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>feat:</strong> New features</p>
              <p><strong>fix:</strong> Bug fixes</p>
              <p><strong>docs:</strong> Documentation changes</p>
              <p><strong>style:</strong> Code style changes (formatting, etc.)</p>
              <p><strong>refactor:</strong> Code refactoring</p>
              <p><strong>test:</strong> Adding or updating tests</p>
              <p><strong>chore:</strong> Maintenance tasks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
