/**
 * Profile Tab Component
 * Allows users to edit their first name, last name, and email
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

export function ProfileTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [originalData, setOriginalData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  // Initialize form data from current user
  useEffect(() => {
    if (user) {
      const data: ProfileFormData = {
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        email: user.email,
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<ProfileFormData>) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setOriginalData(formData);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.firstName && formData.firstName.length > 50) {
      newErrors.firstName = 'First name must be 50 characters or less';
    }

    if (formData.lastName && formData.lastName.length > 50) {
      newErrors.lastName = 'Last name must be 50 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Only send changed fields
    const updates: Partial<ProfileFormData> = {};
    if (formData.firstName !== originalData.firstName) {
      updates.firstName = formData.firstName;
    }
    if (formData.lastName !== originalData.lastName) {
      updates.lastName = formData.lastName;
    }
    if (formData.email !== originalData.email) {
      updates.email = formData.email;
    }

    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setErrors({});
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div>
      <h2 className="text-h3 font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Profile Information
      </h2>
      <p className="text-body-sm text-gray-500 dark:text-gray-400 mb-6">
        Update your personal information
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-md border ${
              errors.firstName
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-200 dark:border-gray-700 focus:ring-burmese-ruby/50'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
          />
          {errors.firstName && (
            <p className="text-caption text-red-600 dark:text-red-400 mt-1">
              {errors.firstName}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-md border ${
              errors.lastName
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-200 dark:border-gray-700 focus:ring-burmese-ruby/50'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
          />
          {errors.lastName && (
            <p className="text-caption text-red-600 dark:text-red-400 mt-1">
              {errors.lastName}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-md border ${
              errors.email
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-200 dark:border-gray-700 focus:ring-burmese-ruby/50'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
          />
          {errors.email && (
            <p className="text-caption text-red-600 dark:text-red-400 mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Success/Error Messages */}
        {updateProfileMutation.isSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md p-3">
            <p className="text-body-sm text-emerald-700 dark:text-emerald-400">
              Profile updated successfully
            </p>
          </div>
        )}

        {updateProfileMutation.isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-body-sm text-red-700 dark:text-red-400">
              {(updateProfileMutation.error as Error).message || 'Failed to update profile'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending || !hasChanges}
            className="px-6 py-2 bg-burmese-ruby hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md text-body-sm font-medium transition-colors flex items-center gap-2"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>

          {hasChanges && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateProfileMutation.isPending}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md text-body-sm font-medium transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
