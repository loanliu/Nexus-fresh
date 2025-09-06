'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface ProjectMember {
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export default function ManageProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        setStatus(`Error fetching projects: ${projectsError.message}`);
        return;
      }

      setProjects(projectsData || []);

      // Fetch project members
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select('*');

      if (membersError) {
        setStatus(`Error fetching members: ${membersError.message}`);
        return;
      }

      setMembers(membersData || []);
      setStatus(`Found ${projectsData?.length || 0} projects and ${membersData?.length || 0} members`);

    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      setStatus('Please enter a project name');
      return;
    }

    try {
      setStatus('Creating project...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('Not logged in. Please log in first.');
        return;
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: newProjectName,
          description: newProjectDescription || null
        })
        .select()
        .single();

      if (projectError) {
        setStatus(`Error creating project: ${projectError.message}`);
        return;
      }

      // Add user as owner of the project
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        setStatus(`Project created but error adding you as owner: ${memberError.message}`);
      } else {
        setStatus(`✅ Project "${project.name}" created successfully! You are the owner.`);
        setNewProjectName('');
        setNewProjectDescription('');
        fetchData(); // Refresh the list
      }

    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Manage Projects</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Projects</h1>
      
      {/* Create New Project */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Create New Project</h2>
        <div className="space-y-3">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
              Project Name:
            </label>
            <input
              type="text"
              id="projectName"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">
              Description (optional):
            </label>
            <textarea
              id="projectDescription"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          <button
            onClick={createProject}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Project
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Your Projects ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500">No projects found. Create one above!</p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold">{project.name}</h3>
                <p className="text-sm text-gray-600">ID: {project.id}</p>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(project.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Members */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Project Members ({members.length})</h2>
        {members.length === 0 ? (
          <p className="text-gray-500">No project members found.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member, index) => (
              <div key={index} className="bg-white border rounded p-3 text-sm">
                <span className="font-medium">Project:</span> {member.project_id.substring(0, 8)}... | 
                <span className="font-medium ml-2">User:</span> {member.user_id.substring(0, 8)}... | 
                <span className="font-medium ml-2">Role:</span> {member.role}
              </div>
            ))}
          </div>
        )}
      </div>

      {status && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <p>{status}</p>
        </div>
      )}
    </div>
  );
}
