'use client';

import { useState } from 'react';

export default function FixOwnershipPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const fixOwnership = async () => {
    setLoading(true);
    setResult('Fixing project ownership...');
    
    try {
      const response = await fetch('/api/fix-project-ownership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ ${data.message}
        
📊 Summary:
- Total projects: ${data.total_projects}
- Fixed ownership: ${data.fixed_count}
- Projects that already had ownership: ${data.total_projects - data.fixed_count}

🔗 Fixed projects:
${data.added.map((item: any) => `- ${item.project_id} (${item.role})`).join('\n')}

You can now try sending invites to any of these projects!`);
      } else {
        setResult(`❌ Error: ${data.error}
Details: ${data.details || 'No additional details'}`);
      }
    } catch (error: any) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Fix Project Ownership</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">What this does:</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Finds all your existing projects</li>
          <li>Adds you as the "owner" of projects where you don't have a membership record</li>
          <li>This will allow you to send invites to those projects</li>
        </ul>
      </div>

      <button
        onClick={fixOwnership}
        disabled={loading}
        className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Fixing...' : 'Fix Project Ownership'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Next steps after fixing:</strong></p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Try sending an invite to one of your projects</li>
          <li>Go to <code>/manage-projects</code> to create a new project and test the UI</li>
          <li>Verify that new projects automatically add you as owner</li>
        </ol>
      </div>
    </div>
  );
}
