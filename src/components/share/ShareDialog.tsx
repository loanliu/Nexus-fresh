'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Mail, User, Crown, Edit, Eye, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface ProjectMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
  user: {
    email: string;
    full_name?: string;
  };
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  inserted_at: string;
  inviter_id: string;
  token?: string;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  currentUserRole: 'owner' | 'admin' | 'editor' | 'viewer';
}

export default function ShareDialog({ 
  isOpen, 
  onClose, 
  projectId, 
  projectName, 
  currentUserRole 
}: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState<'invite' | 'members'>('invite');
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [inviteMessage, setInviteMessage] = useState('');

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadPendingInvites();
    }
  }, [isOpen, projectId]);

  const loadMembers = async () => {
    try {
      // Get the current session to pass the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/projects/${projectId}/members`, {
        credentials: 'include',
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else {
        // Don't show error for members loading - it's not critical for invites
        console.log('Members loading failed, but continuing with invite functionality');
        setMembers([]); // Set empty array so UI doesn't break
      }
    } catch (error) {
      console.log('Members loading failed, but continuing with invite functionality');
      setMembers([]); // Set empty array so UI doesn't break
    }
  };

  const loadPendingInvites = async () => {
    try {
      // Debug: Check cookies before GET request
      if (typeof window !== 'undefined') {
        const allCookies = document.cookie.split(';');
        console.log('🍪 Frontend cookies before GET:', allCookies.length);
        allCookies.forEach(cookie => {
          console.log(`🍪 Frontend Cookie before GET: ${cookie.trim()}`);
        });
        
        // Debug: Check Supabase auth state
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 Supabase session check:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userId: session?.user?.id,
          error: error?.message 
        });
      }

      // Get the current session to pass the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/invites?projectId=${projectId}`, {
        credentials: 'include',
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingInvites(data.invites || []);
      } else {
        const data = await response.json();
        if (data.code === 'AUTH_REQUIRED') {
          toast.error('Please log in to view invites');
        } else {
          console.error('Error loading pending invites:', data.error);
        }
      }
    } catch (error) {
      console.error('Error loading pending invites:', error);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Parse multiple emails (comma-separated)
    const emails = inviteEmail
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);

    console.log('🔍 Parsed emails:', {
      originalInput: inviteEmail,
      parsedEmails: emails
    });

    if (emails.length === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
      // Get the current session to pass the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      // Send invites for all emails
      const invitePromises = emails.map(email => 
        fetch('/api/invites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
          },
          credentials: 'include',
          body: JSON.stringify({
            projectId,
            email,
            role: inviteRole,
            message: inviteMessage.trim(),
          }),
        })
      );

      const responses = await Promise.all(invitePromises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Debug: Check cookies after POST request
      if (typeof window !== 'undefined') {
        const allCookies = document.cookie.split(';');
        console.log('🍪 Frontend cookies after POST:', allCookies.length);
        allCookies.forEach(cookie => {
          console.log(`🍪 Frontend Cookie after POST: ${cookie.trim()}`);
        });
      }

      // Check results
      const successful = results.filter(r => r.ok || r.success);
      const failed = results.filter(r => !r.ok && !r.success);

      if (successful.length === emails.length) {
        toast.success(`Successfully sent ${emails.length} invite${emails.length > 1 ? 's' : ''}!`);
      } else if (successful.length > 0) {
        toast.success(`Sent ${successful.length} invite${successful.length > 1 ? 's' : ''}, ${failed.length} failed`);
      } else {
        toast.error('Failed to send invites');
      }

      if (successful.length > 0) {
        setInviteEmail('');
        setInviteRole('editor');
        setInviteMessage('');
        loadPendingInvites(); // Refresh the list
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invite');
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/accept?token=${token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Get the current session to pass the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        toast.success('Member role updated successfully');
        loadMembers(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to update member role');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return;
    }

    try {
      // Get the current session to pass the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        toast.success('Member removed successfully');
        loadMembers(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <User className="w-4 h-4 text-red-500" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Share Project</h2>
            <p className="text-sm text-gray-600">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'invite'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Invite People
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Members ({members.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'invite' && (
            <div className="space-y-6">
              {/* Invite Form */}
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Addresses
                  </label>
                  <input
                    type="text"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com, teammate@company.com, friend@domain.org"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple emails with commas
                  </p>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="viewer">Viewer - Can view tasks and projects</option>
                    <option value="editor">Editor - Can create and edit tasks</option>
                    <option value="admin">Admin - Can manage members and settings</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Add a personal message to your invite..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Sending Invite...' : 'Send Invite'}
                </button>
              </form>

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Pending Invites</h3>
                  <div className="space-y-2">
                    {pendingInvites
                      .filter(invite => invite.status === 'pending')
                      .map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(invite.role)}
                              <span className="text-sm font-medium text-gray-900">
                                {invite.email}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(invite.role)}`}>
                                {invite.role}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => copyInviteLink(invite.token || '')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy Link</span>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              {members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No members found</p>
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(member.role)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.user.full_name || member.user.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canManageMembers ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                          className={`px-2 py-1 text-xs rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getRoleColor(member.role)}`}
                          disabled={member.role === 'owner'}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                      )}
                      {canManageMembers && member.role !== 'owner' && (
                        <button 
                          onClick={() => handleRemoveMember(member.user_id, member.user.full_name || member.user.email)}
                          className="text-red-600 hover:text-red-800 p-1 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
