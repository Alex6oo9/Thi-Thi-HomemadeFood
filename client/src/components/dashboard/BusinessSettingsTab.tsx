/**
 * Business Settings Tab Component
 * Allows sellers/admins to configure contact info, social links, and payment details.
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, X } from 'lucide-react';
import { api } from '../../lib/api';

interface BusinessSettingsFormData {
  phoneNumber: string;
  viberNumber: string;
  contactEmail: string;
  fbPageUrl: string;
  fbPageName: string;
  kbzPayNumber: string;
  kbzPayName: string;
  bankName: string;
}

const EMPTY: BusinessSettingsFormData = {
  phoneNumber: '',
  viberNumber: '',
  contactEmail: '',
  fbPageUrl: '',
  fbPageName: '',
  kbzPayNumber: '',
  kbzPayName: '',
  bankName: '',
};

export function BusinessSettingsTab() {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<BusinessSettingsFormData>(EMPTY);
  const [originalData, setOriginalData] = useState<BusinessSettingsFormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessSettingsFormData, string>>>({});

  const { data: businessSettings, isLoading } = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: () => api.getBusinessSettings(),
  });

  useEffect(() => {
    if (businessSettings) {
      const data: BusinessSettingsFormData = {
        phoneNumber: businessSettings.phoneNumber || '',
        viberNumber: businessSettings.viberNumber || '',
        contactEmail: businessSettings.contactEmail || '',
        fbPageUrl: businessSettings.fbPageUrl || '',
        fbPageName: businessSettings.fbPageName || '',
        kbzPayNumber: businessSettings.kbzPayNumber || '',
        kbzPayName: businessSettings.kbzPayName || '',
        bankName: businessSettings.bankName || '',
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [businessSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<BusinessSettingsFormData>) => api.updateBusinessSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'business'] });
      setOriginalData(formData);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BusinessSettingsFormData, string>> = {};

    if (formData.phoneNumber && !/^(\+?950?|0)[0-9]{6,12}$/.test(formData.phoneNumber.replace(/[\s\-]/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid Myanmar phone number (e.g. 09xxxxxxxx)';
    }
    if (formData.viberNumber && !/^(\+?950?|0)[0-9]{6,12}$/.test(formData.viberNumber.replace(/[\s\-]/g, ''))) {
      newErrors.viberNumber = 'Enter a valid Myanmar phone number (e.g. 09xxxxxxxx)';
    }
    if (formData.kbzPayNumber && !/^(\+?950?|0)[0-9]{6,12}$/.test(formData.kbzPayNumber.replace(/[\s\-]/g, ''))) {
      newErrors.kbzPayNumber = 'Enter a valid Myanmar phone number (e.g. 09xxxxxxxx)';
    }
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Enter a valid email address';
    }
    if (formData.fbPageUrl && !/^https?:\/\/.+/.test(formData.fbPageUrl)) {
      newErrors.fbPageUrl = 'Enter a valid URL starting with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const updates: Partial<BusinessSettingsFormData> = {};
    (Object.keys(formData) as (keyof BusinessSettingsFormData)[]).forEach((key) => {
      if (formData[key] !== originalData[key]) {
        updates[key] = formData[key];
      }
    });

    if (Object.keys(updates).length > 0) {
      updateSettingsMutation.mutate(updates);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setErrors({});
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-burmese-ruby" />
      </div>
    );
  }

  const fieldClass = (name: keyof BusinessSettingsFormData) =>
    `w-full px-4 py-2 rounded-md border ${
      errors[name]
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-200 dark:border-gray-700 focus:ring-burmese-ruby/50'
    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`;

  return (
    <div>
      <h2 className="text-h3 font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Business Settings
      </h2>
      <p className="text-body-sm text-gray-500 dark:text-gray-400 mb-6">
        Manage contact info, social links, and payment details shown to customers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-xl">

        {/* Contact section */}
        <div className="space-y-4">
          <h3 className="text-body-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
            Contact
          </h3>

          <div>
            <label htmlFor="phoneNumber" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+95 9 123 456 789" className={fieldClass('phoneNumber')} />
            {errors.phoneNumber && <p className="text-caption text-red-600 dark:text-red-400 mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label htmlFor="viberNumber" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Viber Number
            </label>
            <input type="tel" id="viberNumber" name="viberNumber" value={formData.viberNumber} onChange={handleChange} placeholder="+95 9 123 456 789" className={fieldClass('viberNumber')} />
            {errors.viberNumber && <p className="text-caption text-red-600 dark:text-red-400 mt-1">{errors.viberNumber}</p>}
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Email
            </label>
            <input type="email" id="contactEmail" name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="hello@thithi.com" className={fieldClass('contactEmail')} />
            {errors.contactEmail && <p className="text-caption text-red-600 dark:text-red-400 mt-1">{errors.contactEmail}</p>}
          </div>
        </div>

        {/* Facebook section */}
        <div className="space-y-4">
          <h3 className="text-body-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
            Facebook
          </h3>

          <div>
            <label htmlFor="fbPageUrl" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Facebook Page URL
            </label>
            <input type="url" id="fbPageUrl" name="fbPageUrl" value={formData.fbPageUrl} onChange={handleChange} placeholder="https://www.facebook.com/yourpage" className={fieldClass('fbPageUrl')} />
            {errors.fbPageUrl && <p className="text-caption text-red-600 dark:text-red-400 mt-1">{errors.fbPageUrl}</p>}
          </div>

          <div>
            <label htmlFor="fbPageName" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Facebook Page Name
            </label>
            <input type="text" id="fbPageName" name="fbPageName" value={formData.fbPageName} onChange={handleChange} placeholder="ThiThi Myanmar Food" className={fieldClass('fbPageName')} />
          </div>
        </div>

        {/* Payment section */}
        <div className="space-y-4">
          <h3 className="text-body-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
            Payment Details
          </h3>

          <div>
            <label htmlFor="kbzPayNumber" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              KBZPay Number
            </label>
            <input type="tel" id="kbzPayNumber" name="kbzPayNumber" value={formData.kbzPayNumber} onChange={handleChange} placeholder="09 123 456 789" className={fieldClass('kbzPayNumber')} />
            {errors.kbzPayNumber && <p className="text-caption text-red-600 dark:text-red-400 mt-1">{errors.kbzPayNumber}</p>}
          </div>

          <div>
            <label htmlFor="kbzPayName" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              KBZPay Account Name
            </label>
            <input type="text" id="kbzPayName" name="kbzPayName" value={formData.kbzPayName} onChange={handleChange} placeholder="Daw Thi Thi" className={fieldClass('kbzPayName')} />
          </div>

          <div>
            <label htmlFor="bankName" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bank Name
            </label>
            <input type="text" id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="KBZ Bank" className={fieldClass('bankName')} />
          </div>
        </div>

        {/* Feedback messages */}
        {updateSettingsMutation.isSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md p-3">
            <p className="text-body-sm text-emerald-700 dark:text-emerald-400">Business settings updated successfully</p>
          </div>
        )}
        {updateSettingsMutation.isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-body-sm text-red-700 dark:text-red-400">
              {(updateSettingsMutation.error as Error).message || 'Failed to update settings'}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending || !hasChanges}
            className="px-6 py-2 bg-burmese-ruby hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md text-body-sm font-medium transition-colors flex items-center gap-2"
          >
            {updateSettingsMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4" />Save Changes</>
            )}
          </button>

          {hasChanges && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateSettingsMutation.isPending}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md text-body-sm font-medium transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
