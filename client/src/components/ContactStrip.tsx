import { useState } from 'react';
import { MessageCircle, Phone, PhoneCall, X } from 'lucide-react';
import { useBusinessSettings } from '../hooks/useBusinessSettings';

interface ContactStripProps {
  variant?: 'banner' | 'compact';
  className?: string;
}

export function ContactStrip({
  variant = 'compact',
  className = '',
}: ContactStripProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { settings } = useBusinessSettings();

  const { fbPageUrl, fbPageName, viberNumber, phoneNumber } = settings;

  if (variant === 'banner') {
    return (
      <div
        className={`rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-5 sm:p-6 text-white ${className}`}
      >
        <h3 className="text-lg font-bold">
          Already paid? Reach us on Facebook Messenger!
        </h3>
        <p className="text-sm text-red-100 mt-1">
          Most Myanmar customers send their payment screenshot via Facebook — you
          can do the same, or upload it on the next page.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <a
            href={fbPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold text-sm transition-colors px-4"
          >
            <MessageCircle className="w-5 h-5" />
            Message on Facebook
          </a>

          <a
            href={`viber://chat?number=${viberNumber.replace(/\s/g, '')}`}
            className="flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-purple-500 hover:bg-purple-600 font-semibold text-sm transition-colors px-4"
          >
            <Phone className="w-5 h-5" />
            Viber: {viberNumber}
          </a>

          <a
            href={`tel:${phoneNumber.replace(/\s/g, '')}`}
            className="flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-green-500 hover:bg-green-600 font-semibold text-sm transition-colors px-4"
          >
            <PhoneCall className="w-5 h-5" />
            Call: {phoneNumber}
          </a>
        </div>
      </div>
    );
  }

  // variant === 'compact'
  return (
    <>
      <div
        className={`rounded-xl bg-red-50 border border-red-100 overflow-hidden ${className}`}
      >
        {/* Mobile: full-width image banner on top */}
        <div className="sm:hidden relative">
          <img
            src="/thi_thi_FB_page.jpg"
            alt="ThiThi Facebook Page"
            onClick={() => setLightboxOpen(true)}
            className="w-full h-44 object-cover cursor-pointer hover:opacity-95 transition-opacity"
          />
          <div className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
            tap to enlarge
          </div>
        </div>

        {/* Content row — links left, image right (desktop) */}
        <div className="flex items-stretch">
          {/* Left: header + links */}
          <div className="flex-1 p-4">
            <p className="text-sm font-semibold text-red-700 mb-3">
              အကူအညီလိုအပ်ပါက :
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 flex-shrink-0 text-blue-600" />
                <a
                  href={fbPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
                >
                  {fbPageName}
                </a>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0 text-purple-600" />
                <a
                  href={`viber://chat?number=${viberNumber.replace(/\s/g, '')}`}
                  className="font-medium text-purple-600 hover:text-purple-700 underline-offset-2 hover:underline"
                >
                  Viber: {viberNumber}
                </a>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <PhoneCall className="w-4 h-4 flex-shrink-0 text-green-600" />
                <a
                  href={`tel:${phoneNumber.replace(/\s/g, '')}`}
                  className="font-medium text-green-600 hover:text-green-700 underline-offset-2 hover:underline"
                >
                  {phoneNumber}
                </a>
              </div>
            </div>
          </div>

          {/* Right: image panel — desktop only, fills full card height */}
          <div className="hidden sm:block w-44 flex-shrink-0 relative">
            <img
              src="/thi_thi_FB_page.jpg"
              alt="ThiThi Facebook Page"
              onClick={() => setLightboxOpen(true)}
              className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
            <div className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
              tap to enlarge
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src="/thi_thi_FB_page.jpg"
            alt="ThiThi Facebook Page"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
