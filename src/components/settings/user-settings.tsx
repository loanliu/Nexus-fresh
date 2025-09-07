'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Phone, Mail, Save, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  phone: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export function UserSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    phone: ''
  });

  // Format phone number as (xxx) xxx-xxxx
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (xxx) xxx-xxxx
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length > 0) {
      return `(${phoneNumber}`;
    }
    return phoneNumber;
  };

  // Remove formatting for storage
  const unformatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, '');
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        toast.error('Failed to load user profile');
        return;
      }

      // Extract data from user metadata
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at || ''
      };

      setProfile(userProfile);
      setFormData({
        display_name: userProfile.display_name,
        phone: formatPhoneNumber(userProfile.phone)
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: formData.display_name,
          phone: unformatPhoneNumber(formData.phone)
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Profile updated successfully!');
      
      // Update the profile state with the new data
      setProfile(prev => prev ? {
        ...prev,
        display_name: formData.display_name,
        phone: unformatPhoneNumber(formData.phone) // Store unformatted for consistency
      } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: 'display_name' | 'phone', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-gray-500">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Failed to load profile</p>
          <Button onClick={loadUserProfile}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Update your personal information and display preferences
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <Input
                id="display_name"
                type="text"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Enter your display name"
              />
              <p className="text-sm text-gray-500 mt-1">
                This is how your name appears to other users
              </p>
            </div>


            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  handleInputChange('phone', formatted);
                }}
                placeholder="(xxx) xxx-xxxx"
                maxLength={14}
              />
              <p className="text-sm text-gray-500 mt-1">
                Format: (xxx) xxx-xxxx
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Account Information</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Your account details and authentication status
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-600">User ID</span>
                <span className="text-sm text-gray-900 font-mono">{profile.id}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-600">Email Status</span>
                <span className="text-sm text-green-600">Verified</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-600">Display Name</span>
                <span className="text-sm text-gray-900">
                  {profile.display_name || 'Not set'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-600">Phone Number</span>
                <span className="text-sm text-gray-900">
                  {profile.phone ? formatPhoneNumber(profile.phone) : 'Not set'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-600">Account Created</span>
                <span className="text-sm text-gray-900">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>

            {profile.avatar_url && (
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                <div className="mt-2">
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
