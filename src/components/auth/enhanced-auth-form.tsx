'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Zap, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleOAuthButton } from './google-oauth-button';
import { auth } from '@/lib/supabaseClient';

type AuthMode = 'signin' | 'signup' | 'magic-link' | 'reset-password';

export function EnhancedAuthForm() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await auth.signUp(formData.email, formData.password);
        if (error) {
          console.error('Signup error:', error);
          
          // Provide more helpful error messages
          if (error.message.includes('Database error saving new user')) {
            toast.error('Account creation failed. Please contact support or try a different email.');
          } else if (error.message.includes('User already registered')) {
            toast.error('An account with this email already exists. Try signing in instead.');
          } else if (error.message.includes('Password')) {
            toast.error('Password must be at least 6 characters long.');
          } else if (error.message.includes('Email')) {
            toast.error('Please enter a valid email address.');
          } else {
            toast.error(error.message || 'Failed to create account');
          }
          return;
        }
        
        toast.success('Account created! Please check your email to verify your account.');
      } else {
        const { data, error } = await auth.signInWithPassword(formData.email, formData.password);
        if (error) {
          console.error('Signin error:', error);
          
          // Provide more helpful error messages
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Incorrect email or password. Please try again.');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please check your email and click the confirmation link first.');
          } else {
            toast.error(error.message || 'Failed to sign in');
          }
          return;
        }
        
        toast.success('Signed in successfully!');
        // The auth provider will handle redirect
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await auth.signInWithMagicLink(formData.email);
      
      if (error) {
        console.error('Magic link error details:', error);
        
        // Provide specific error messages
        if (error.message.includes('Email rate limit exceeded')) {
          toast.error('Too many emails sent. Please wait a few minutes before trying again.');
        } else if (error.message.includes('Signup is disabled')) {
          toast.error('Email signup is disabled. Please contact support.');
        } else if (error.message.includes('Invalid email')) {
          toast.error('Please enter a valid email address.');
        } else if (error.message.includes('Email not allowed')) {
          toast.error('This email domain is not allowed. Try a different email.');
        } else {
          toast.error(`Magic link failed: ${error.message}`);
        }
        return;
      }

      console.log('Magic link response:', data);
      setMagicLinkSent(true);
      toast.success('Magic link sent! Check your email (including spam folder) to sign in.');
    } catch (error: any) {
      console.error('Magic link error:', error);
      toast.error('Failed to send magic link. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await auth.resetPassword(formData.email);
      if (error) throw error;

      toast.success('Password reset email sent! Check your inbox.');
      setMode('signin');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
    setMagicLinkSent(false);
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create your account';
      case 'magic-link': return 'Sign in with Magic Link';
      case 'reset-password': return 'Reset your password';
      default: return 'Sign in to your account';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup': return 'Join Nexus to get started';
      case 'magic-link': return 'We\'ll send you a secure sign-in link';
      case 'reset-password': return 'Enter your email to reset your password';
      default: return 'Welcome back to Nexus';
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Magic Link Sent!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've sent a secure sign-in link to <strong>{formData.email}</strong>
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Check your email and click the link to sign in. The link will expire in 1 hour.
              </p>
            </div>
            <Button
              onClick={() => {
                setMagicLinkSent(false);
                setMode('signin');
                resetForm();
              }}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {getTitle()}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {getSubtitle()}
          </p>
        </div>

        {/* Google OAuth Button */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="mt-6">
            <GoogleOAuthButton />
          </div>
        )}

        {/* Auth Mode Toggle */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => { setMode('signin'); resetForm(); }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'signin' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); resetForm(); }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'signup' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setMode('magic-link'); resetForm(); }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === 'magic-link' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-1" />
            Magic Link
          </button>
        </div>

        {/* Quick Access to Password Reset */}
        {mode !== 'reset-password' && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode('reset-password')}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              🔑 Forgot your password or can't access Magic Link?
            </button>
          </div>
        )}

        {(mode === 'signin' || mode === 'signup') && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Or continue with email
              </span>
            </div>
          </div>
        )}

        {/* Email + Password Form */}
        {(mode === 'signin' || mode === 'signup') && (
          <form className="mt-8 space-y-6" onSubmit={handleEmailPasswordAuth}>
            <div className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="name" className="sr-only">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required={mode === 'signup'}
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </div>

            {mode === 'signin' && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setMode('reset-password')}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'signup' ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Magic Link Form */}
        {mode === 'magic-link' && (
          <form className="mt-8 space-y-6" onSubmit={handleMagicLink}>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">How Magic Links Work:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Enter your email and we'll send you a secure link</li>
                    <li>• Click the link in your email to sign in instantly</li>
                    <li>• No password required - it's safer and simpler!</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Reset Password Form */}
        {mode === 'reset-password' && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p>We'll send you a link to reset your password. Check your email after clicking send.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode('signin')}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
