/**
 * Notifications Tab Component
 * Allows users to configure notification preferences
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Bell, Mail } from 'lucide-react';
import { api } from '../../lib/api';

interface NotificationPreferences {
  emailNotifications: boolean;
}

export function NotificationsTab() {
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
  });

  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
  });

  // Fetch notification preferences
  const { data: notificationPreferences, isLoading } = useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: () => api.getNotificationPreferences(),
  });

  // Initialize preferences
  useEffect(() => {
    if (notificationPreferences) {
      setPreferences(notificationPreferences);
      setOriginalPreferences(notificationPreferences);
    }
  }, [notificationPreferences]);

  // Update notification preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) => api.updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
      setOriginalPreferences(preferences);
    },
  });

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Only send changed preferences
    const updates: Partial<NotificationPreferences> = {};
    if (preferences.emailNotifications !== originalPreferences.emailNotifications) {
      updates.emailNotifications = preferences.emailNotifications;
    }

    if (Object.keys(updates).length > 0) {
      updatePreferencesMutation.mutate(updates);
    }
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-burmese-ruby" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-h3 font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Notification Preferences
      </h2>
      <p className="text-body-sm text-gray-500 dark:text-gray-400 mb-6">
        Choose how you want to receive updates
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {/* Email Notifications Toggle */}
        <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="mt-1">
            <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-body font-semibold text-gray-900 dark:text-gray-100">
              Email Notifications
            </h3>
            <p className="text-body-sm text-gray-500 dark:text-gray-400 mt-1">
              Receive general email notifications about your account and updates
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              data-testid="email-notifications-toggle"
              checked={preferences.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-burmese-ruby/50 dark:peer-focus:ring-burmese-ruby rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-burmese-ruby"></div>
          </label>
        </div>


        {/* Success/Error Messages */}
        {updatePreferencesMutation.isSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md p-3">
            <p className="text-body-sm text-emerald-700 dark:text-emerald-400">
              Notification preferences updated successfully
            </p>
          </div>
        )}

        {updatePreferencesMutation.isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-body-sm text-red-700 dark:text-red-400">
              {(updatePreferencesMutation.error as Error).message || 'Failed to update preferences'}
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={updatePreferencesMutation.isPending || !hasChanges}
            className="px-6 py-2 bg-burmese-ruby hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md text-body-sm font-medium transition-colors flex items-center gap-2"
          >
            {updatePreferencesMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
