import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { firebaseAuth } from '../firebase';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { MailIcon, ArrowLeftIcon } from 'lucide-react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { success, error } = await firebaseAuth.sendPasswordReset(email);
      
      if (success) {
        setEmailSent(true);
        toast.success('Password reset email sent!');
      } else {
        // Handle specific Firebase errors
        let errorMessage = 'Failed to send reset email';
        if (error.includes('user-not-found')) {
          errorMessage = 'No account found with this email address';
        } else if (error.includes('invalid-email')) {
          errorMessage = 'Please enter a valid email address';
        } else if (error.includes('too-many-requests')) {
          errorMessage = 'Too many requests. Please try again later.';
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <MailIcon className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-gray-600 mb-2">
                We've sent password reset instructions to:
              </p>
              <p className="font-semibold text-primary-600 mb-6">
                {email}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> The email may take a few minutes to arrive. 
                  Please also check your spam folder.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                data-testid="resend-email-btn"
              >
                Send another email
              </button>
              <Link
                to="/login"
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                data-testid="back-to-login-btn"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-14 w-14 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl">K</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Forgot your password?
            </h2>
            <p className="mt-2 text-gray-600">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Enter your email address"
                data-testid="email-input"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="submit-btn"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Send reset link'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                data-testid="login-link"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
