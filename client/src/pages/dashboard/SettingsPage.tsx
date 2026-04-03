import { Settings as SettingsIcon } from 'lucide-react';
import { BusinessSettingsTab } from '../../components/dashboard/BusinessSettingsTab';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-burmese-ruby" />
        <div>
          <h1 className="text-h1 font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
          <p className="text-body-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your business contact info and payment details
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <BusinessSettingsTab />
      </div>
    </div>
  );
}
