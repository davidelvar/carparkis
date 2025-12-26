'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Settings,
  Globe,
  Mail,
  CreditCard,
  Bell,
  Shield,
  Save,
  RefreshCw,
  Database,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminShell from '@/components/admin/AdminShell';
import { useToast } from '@/components/ui/Toast';
import { Switch } from '@/components/ui/Switch';

interface SettingsSection {
  id: string;
  icon: React.ReactNode;
  title: { is: string; en: string };
  description: { is: string; en: string };
}

const SECTIONS: SettingsSection[] = [
  {
    id: 'general',
    icon: <Settings className="h-5 w-5" />,
    title: { is: 'Almennt', en: 'General' },
    description: { is: 'Grunnstillingar kerfisins', en: 'Basic system settings' },
  },
  {
    id: 'localization',
    icon: <Globe className="h-5 w-5" />,
    title: { is: 'Staðsetning', en: 'Localization' },
    description: { is: 'Tungumál og svæðisstillingar', en: 'Language and region settings' },
  },
  {
    id: 'email',
    icon: <Mail className="h-5 w-5" />,
    title: { is: 'Tölvupóstur', en: 'Email' },
    description: { is: 'Tölvupóstsstillingar', en: 'Email configuration' },
  },
  {
    id: 'payment',
    icon: <CreditCard className="h-5 w-5" />,
    title: { is: 'Greiðslur', en: 'Payments' },
    description: { is: 'Greiðsluþjónustustillingar', en: 'Payment gateway settings' },
  },
  {
    id: 'notifications',
    icon: <Bell className="h-5 w-5" />,
    title: { is: 'Tilkynningar', en: 'Notifications' },
    description: { is: 'Tilkynningar til viðskiptavina', en: 'Customer notification settings' },
  },
  {
    id: 'integrations',
    icon: <Database className="h-5 w-5" />,
    title: { is: 'Samþættingar', en: 'Integrations' },
    description: { is: 'Ytri þjónustur (Regla, Isavia)', en: 'External services (Regla, Isavia)' },
  },
];

export default function AdminSettingsPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const toast = useToast();

  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailConfigured, setIsEmailConfigured] = useState(false);
  const [settings, setSettings] = useState({
    // General
    siteName: 'CarPark',
    siteNameEn: 'CarPark',
    contactEmail: 'info@carpark.is',
    contactPhone: '+354 555 1234',
    address: 'Flugvallavegur 1, 235 Keflavíkurflugvöllur',

    // Localization
    defaultLocale: 'is',
    timezone: 'Atlantic/Reykjavik',
    currency: 'ISK',
    dateFormat: 'dd.MM.yyyy',

    // Email (display settings only - credentials in .env)
    smtpFrom: 'noreply@carpark.is',
    smtpFromName: 'CarPark',

    // Payment - Multiple providers can be enabled
    rapydEnabled: true,
    netgiroEnabled: true,
    paymentTestMode: true,

    // Notifications
    sendBookingConfirmation: true,
    sendBookingReminder: true,
    reminderHoursBefore: 24,
    sendCheckInNotification: true,

    // Integrations
    reglaEnabled: false,
    reglaApiKey: '',
    isaviaEnabled: false,
    isaviaApiKey: '',
  });

  // Load settings and check email config on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(prev => ({ ...prev, ...data.data }));
        }
        // Check if email is configured
        if (data.emailConfigured !== undefined) {
          setIsEmailConfigured(data.emailConfigured);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Track which test email is being sent
  const [sendingTestType, setSendingTestType] = useState<string | null>(null);

  // Send test email
  const handleTestEmail = async (type: 'basic' | 'booking-confirmation' | 'booking-reminder' | 'check-in' = 'basic') => {
    setSendingTestType(type);
    try {
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, type }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(locale === 'is' ? 'Prófunarpóstur sendur!' : 'Test email sent!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error(locale === 'is' ? 'Villa við að senda prófunarpóst' : 'Failed to send test email');
    } finally {
      setSendingTestType(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(locale === 'is' ? 'Stillingar vistaðar!' : 'Settings saved!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(locale === 'is' ? 'Villa við að vista stillingar' : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{locale === 'is' ? 'Heiti (íslenska)' : 'Site Name (Icelandic)'}</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">{locale === 'is' ? 'Heiti (enska)' : 'Site Name (English)'}</label>
                <input
                  type="text"
                  value={settings.siteNameEn}
                  onChange={(e) => setSettings({ ...settings, siteNameEn: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">{locale === 'is' ? 'Netfang' : 'Contact Email'}</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">{locale === 'is' ? 'Sími' : 'Contact Phone'}</label>
                <input
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">{locale === 'is' ? 'Heimilisfang' : 'Address'}</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>
        );

      case 'localization':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{locale === 'is' ? 'Sjálfgefið tungumál' : 'Default Language'}</label>
                <select
                  value={settings.defaultLocale}
                  onChange={(e) => setSettings({ ...settings, defaultLocale: e.target.value })}
                  className="input"
                >
                  <option value="is">Íslenska</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="label">{locale === 'is' ? 'Tímabelti' : 'Timezone'}</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="input"
                >
                  <option value="Atlantic/Reykjavik">Atlantic/Reykjavik (GMT+0)</option>
                  <option value="Europe/London">Europe/London (GMT+0/+1)</option>
                </select>
              </div>
              <div>
                <label className="label">{locale === 'is' ? 'Gjaldmiðill' : 'Currency'}</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="input"
                >
                  <option value="ISK">ISK - Íslensk króna</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>
              <div>
                <label className="label">{locale === 'is' ? 'Dagsetningarsnið' : 'Date Format'}</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  className="input"
                >
                  <option value="dd.MM.yyyy">dd.MM.yyyy</option>
                  <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                  <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            {/* SMTP Configuration Info */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h4 className="font-medium text-slate-900">
                  {locale === 'is' ? 'SMTP uppsetning' : 'SMTP Configuration'}
                </h4>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">SMTP Host</label>
                    <input
                      type="text"
                      value={process.env.NEXT_PUBLIC_SMTP_HOST || 'smtp.example.com'}
                      disabled
                      className="input bg-slate-50 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="label">SMTP Port</label>
                    <input
                      type="text"
                      value={process.env.NEXT_PUBLIC_SMTP_PORT || '587'}
                      disabled
                      className="input bg-slate-50 text-slate-500"
                    />
                  </div>
                </div>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>
                    {locale === 'is' 
                      ? 'Stilltu eftirfarandi umhverfisbreytur í .env skránni þinni:'
                      : 'Configure the following environment variables in your .env file:'}
                  </p>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 space-y-1">
                    <p><span className="text-green-400">SMTP_HOST</span>=smtp.example.com</p>
                    <p><span className="text-green-400">SMTP_PORT</span>=587</p>
                    <p><span className="text-green-400">SMTP_USER</span>=your_username</p>
                    <p><span className="text-green-400">SMTP_PASSWORD</span>=your_password</p>
                    <p><span className="text-green-400">SMTP_FROM</span>=noreply@carpark.is</p>
                    <p><span className="text-green-400">SMTP_FROM_NAME</span>=CarPark</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable display settings */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h4 className="font-medium text-slate-900">
                  {locale === 'is' ? 'Sendandi upplýsingar' : 'Sender Information'}
                </h4>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{locale === 'is' ? 'Sendandi netfang' : 'From Email'}</label>
                    <input
                      type="email"
                      value={settings.smtpFrom}
                      onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{locale === 'is' ? 'Sendandi nafn' : 'From Name'}</label>
                    <input
                      type="text"
                      value={settings.smtpFromName}
                      onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {locale === 'is'
                  ? 'Athugaðu: SMTP auðkenni eru stillt í umhverfisbreytum (.env) af öryggisástæðum.'
                  : 'Note: SMTP credentials are configured in environment variables (.env) for security reasons.'}
              </p>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            {/* Test Mode Toggle */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">
                    {locale === 'is' ? 'Prófunarhamur (Sandbox)' : 'Test Mode (Sandbox)'}
                  </h4>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {locale === 'is' 
                      ? 'Notaðu prófunarumhverfi fyrir allar greiðsluþjónustur'
                      : 'Use sandbox environment for all payment providers'}
                  </p>
                </div>
                <Switch
                  id="testMode"
                  checked={settings.paymentTestMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, paymentTestMode: checked })}
                />
              </div>
            </div>

            {/* Rapyd Configuration */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <CreditCard className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Rapyd</h4>
                    <p className="text-xs text-slate-500">
                      {locale === 'is' ? 'Kredit- og debetkort' : 'Credit & Debit Cards'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="rapydEnabled"
                  checked={settings.rapydEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, rapydEnabled: checked })}
                />
              </div>
              {settings.rapydEnabled && (
                <div className="p-4 space-y-4">
                  {/* Environment Indicator */}
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    settings.paymentTestMode 
                      ? "bg-amber-50 border border-amber-200" 
                      : "bg-green-50 border border-green-200"
                  )}>
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      settings.paymentTestMode ? "bg-amber-500" : "bg-green-500"
                    )} />
                    <div className="flex-1">
                      <span className={cn(
                        "font-medium text-sm",
                        settings.paymentTestMode ? "text-amber-800" : "text-green-800"
                      )}>
                        {settings.paymentTestMode 
                          ? (locale === 'is' ? 'Prófunarumhverfi' : 'Sandbox')
                          : (locale === 'is' ? 'Framleiðsla' : 'Production')
                        }
                      </span>
                      <p className={cn(
                        "text-xs",
                        settings.paymentTestMode ? "text-amber-600" : "text-green-600"
                      )}>
                        {settings.paymentTestMode 
                          ? 'sandboxapi.rapyd.net' 
                          : 'api.rapyd.net'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="label">Webhook URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/rapyd`}
                        readOnly
                        className="input flex-1 bg-slate-50 text-slate-600 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/api/webhooks/rapyd`;
                          navigator.clipboard.writeText(url);
                          const btn = document.activeElement as HTMLButtonElement;
                          const originalText = btn.innerHTML;
                          btn.innerHTML = `<svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
                          setTimeout(() => { btn.innerHTML = originalText; }, 1500);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                        title={locale === 'is' ? 'Afrita' : 'Copy'}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>{locale === 'is' ? 'Umhverfisbreytur:' : 'Environment variables:'}</p>
                    <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 space-y-1">
                      <p><span className="text-green-400">RAPYD_ACCESS_KEY</span>=your_access_key</p>
                      <p><span className="text-green-400">RAPYD_SECRET_KEY</span>=your_secret_key</p>
                    </div>
                  </div>
                  <a 
                    href="https://dashboard.rapyd.net/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {locale === 'is' ? 'Opna Rapyd Dashboard' : 'Open Rapyd Dashboard'}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Netgiro Configuration */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <svg className="h-5 w-5 text-[#00A3E0]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Netgíró</h4>
                    <p className="text-xs text-slate-500">
                      {locale === 'is' ? 'Íslensk greiðsluleið' : 'Icelandic Payment'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="netgiroEnabled"
                  checked={settings.netgiroEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, netgiroEnabled: checked })}
                />
              </div>
              {settings.netgiroEnabled && (
                <div className="p-4 space-y-4">
                  {/* Environment Indicator */}
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    settings.paymentTestMode 
                      ? "bg-amber-50 border border-amber-200" 
                      : "bg-green-50 border border-green-200"
                  )}>
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      settings.paymentTestMode ? "bg-amber-500" : "bg-green-500"
                    )} />
                    <div className="flex-1">
                      <span className={cn(
                        "font-medium text-sm",
                        settings.paymentTestMode ? "text-amber-800" : "text-green-800"
                      )}>
                        {settings.paymentTestMode 
                          ? (locale === 'is' ? 'Prófunarumhverfi' : 'Sandbox')
                          : (locale === 'is' ? 'Framleiðsla' : 'Production')
                        }
                      </span>
                      <p className={cn(
                        "text-xs",
                        settings.paymentTestMode ? "text-amber-600" : "text-green-600"
                      )}>
                        {settings.paymentTestMode 
                          ? 'securepay.test.netgiro.is' 
                          : 'securepay.netgiro.is'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="label">Callback URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/netgiro`}
                        readOnly
                        className="input flex-1 bg-slate-50 text-slate-600 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/api/webhooks/netgiro`;
                          navigator.clipboard.writeText(url);
                          const btn = document.activeElement as HTMLButtonElement;
                          const originalText = btn.innerHTML;
                          btn.innerHTML = `<svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
                          setTimeout(() => { btn.innerHTML = originalText; }, 1500);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                        title={locale === 'is' ? 'Afrita' : 'Copy'}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>{locale === 'is' ? 'Umhverfisbreytur:' : 'Environment variables:'}</p>
                    <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 space-y-1">
                      <p><span className="text-green-400">NETGIRO_APPLICATION_ID</span>=your_app_id</p>
                      <p><span className="text-green-400">NETGIRO_SECRET_KEY</span>=your_secret_key</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-700 font-medium mb-1">
                      {locale === 'is' ? 'Prófunargildi:' : 'Test Values:'}
                    </p>
                    <p className="text-xs text-slate-600">SSN: 1111111119 · GSM: 8223281</p>
                  </div>
                  <a 
                    href="https://netgiro.github.io/docs/testing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {locale === 'is' ? 'Netgíró leiðbeiningar' : 'Netgíró Documentation'}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Warning if no payment methods enabled */}
            {!settings.rapydEnabled && !settings.netgiroEnabled && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  {locale === 'is'
                    ? '⚠️ Engin greiðsluþjónusta er virkjuð. Viðskiptavinir geta ekki greitt fyrir bókanir.'
                    : '⚠️ No payment provider is enabled. Customers will not be able to pay for bookings.'}
                </p>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {locale === 'is'
                  ? 'Viðskiptavinir geta valið á milli virkjaðra greiðsluþjónusta við bókun.'
                  : 'Customers can choose between enabled payment providers during booking.'}
              </p>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Email Status */}
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl border",
              isEmailConfigured 
                ? "bg-green-50 border-green-200" 
                : "bg-amber-50 border-amber-200"
            )}>
              <div className={cn(
                "p-2 rounded-full",
                isEmailConfigured ? "bg-green-100" : "bg-amber-100"
              )}>
                {isEmailConfigured ? (
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  isEmailConfigured ? "text-green-800" : "text-amber-800"
                )}>
                  {isEmailConfigured 
                    ? (locale === 'is' ? 'Tölvupóstur er uppsettur' : 'Email is configured')
                    : (locale === 'is' ? 'Tölvupóstur er ekki uppsettur' : 'Email is not configured')
                  }
                </p>
                <p className={cn(
                  "text-sm",
                  isEmailConfigured ? "text-green-600" : "text-amber-600"
                )}>
                  {isEmailConfigured 
                    ? (locale === 'is' ? 'SMTP stillingar fundust í umhverfisbreytum' : 'SMTP settings found in environment')
                    : (locale === 'is' ? 'Stilltu SMTP í .env til að virkja tilkynningar' : 'Configure SMTP in .env to enable notifications')
                  }
                </p>
              </div>
              {isEmailConfigured && (
                <button
                  onClick={() => handleTestEmail('basic')}
                  disabled={sendingTestType !== null}
                  className="btn-secondary text-sm"
                >
                  {sendingTestType === 'basic' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    locale === 'is' ? 'Prófa tengingu' : 'Test Connection'
                  )}
                </button>
              )}
            </div>

            {/* Notification Types */}
            <div className="space-y-4">
              {/* Booking Confirmation */}
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Mail className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {locale === 'is' ? 'Staðfesting bókunar' : 'Booking Confirmation'}
                        </h4>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {locale === 'is' 
                            ? 'Senda tölvupóst þegar bókun er staðfest'
                            : 'Send email when booking is confirmed'}
                        </p>
                      </div>
                      <Switch
                        checked={settings.sendBookingConfirmation}
                        onCheckedChange={(checked) => setSettings({ ...settings, sendBookingConfirmation: checked })}
                        disabled={!isEmailConfigured}
                      />
                    </div>
                    {isEmailConfigured && settings.sendBookingConfirmation && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleTestEmail('booking-confirmation')}
                          disabled={sendingTestType !== null}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1.5"
                        >
                          {sendingTestType === 'booking-confirmation' ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              {locale === 'is' ? 'Sendi...' : 'Sending...'}
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {locale === 'is' ? 'Senda prófunarpóst' : 'Send test email'}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Reminder */}
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Bell className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {locale === 'is' ? 'Áminning um bókun' : 'Booking Reminder'}
                        </h4>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {locale === 'is' 
                            ? 'Senda áminningu fyrir komutíma'
                            : 'Send reminder before drop-off time'}
                        </p>
                      </div>
                      <Switch
                        checked={settings.sendBookingReminder}
                        onCheckedChange={(checked) => setSettings({ ...settings, sendBookingReminder: checked })}
                        disabled={!isEmailConfigured}
                      />
                    </div>
                    {settings.sendBookingReminder && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-slate-600">
                            {locale === 'is' ? 'Senda' : 'Send'}
                          </label>
                          <input
                            type="number"
                            value={settings.reminderHoursBefore}
                            onChange={(e) => setSettings({ ...settings, reminderHoursBefore: parseInt(e.target.value) || 24 })}
                            className="input w-20 text-center"
                            min={1}
                            max={72}
                          />
                          <span className="text-sm text-slate-600">
                            {locale === 'is' ? 'klst. fyrir' : 'hours before'}
                          </span>
                        </div>
                        {isEmailConfigured && (
                          <button
                            onClick={() => handleTestEmail('booking-reminder')}
                            disabled={sendingTestType !== null}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1.5"
                          >
                            {sendingTestType === 'booking-reminder' ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                {locale === 'is' ? 'Sendi...' : 'Sending...'}
                              </>
                            ) : (
                              <>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {locale === 'is' ? 'Senda prófunarpóst' : 'Send test email'}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Check-in Notification */}
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {locale === 'is' ? 'Staðfesting innritunar' : 'Check-in Confirmation'}
                        </h4>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {locale === 'is' 
                            ? 'Senda tölvupóst þegar bíll er skráður inn'
                            : 'Send email when vehicle is checked in'}
                        </p>
                      </div>
                      <Switch
                        checked={settings.sendCheckInNotification}
                        onCheckedChange={(checked) => setSettings({ ...settings, sendCheckInNotification: checked })}
                        disabled={!isEmailConfigured}
                      />
                    </div>
                    {isEmailConfigured && settings.sendCheckInNotification && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleTestEmail('check-in')}
                          disabled={sendingTestType !== null}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1.5"
                        >
                          {sendingTestType === 'check-in' ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              {locale === 'is' ? 'Sendi...' : 'Sending...'}
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {locale === 'is' ? 'Senda prófunarpóst' : 'Send test email'}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SMS Coming Soon */}
            <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-3">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="font-medium text-slate-600 mb-1">
                {locale === 'is' ? 'SMS tilkynningar' : 'SMS Notifications'}
              </h4>
              <p className="text-sm text-slate-400">
                {locale === 'is' ? 'Kemur fljótlega...' : 'Coming soon...'}
              </p>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            {/* Regla.is */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Regla.is</h4>
                  <p className="text-sm text-slate-500">
                    {locale === 'is' ? 'Bókhaldskerfi' : 'Accounting system'}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  process.env.NEXT_PUBLIC_REGLA_CONFIGURED === 'true'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {process.env.NEXT_PUBLIC_REGLA_CONFIGURED === 'true'
                    ? (locale === 'is' ? 'Stillt' : 'Configured')
                    : (locale === 'is' ? 'Ekki stillt' : 'Not configured')}
                </span>
              </div>
              <div className="mt-4 text-sm text-slate-600 space-y-2">
                <p>
                  {locale === 'is' 
                    ? 'Stilltu eftirfarandi umhverfisbreytur í .env skránni þinni:'
                    : 'Configure the following environment variables in your .env file:'}
                </p>
                <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 space-y-1">
                  <p><span className="text-green-400">REGLA_USERNAME</span>=your_username</p>
                  <p><span className="text-green-400">REGLA_PASSWORD</span>=your_password</p>
                </div>
              </div>
            </div>

            {/* Isavia / Kefairport */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ExternalLink className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Kefairport</h4>
                  <p className="text-sm text-slate-500">
                    {locale === 'is' ? 'Flugupplýsingar' : 'Flight information'}
                  </p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {locale === 'is' ? 'Virkt' : 'Active'}
                </span>
              </div>
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-600">
                  {locale === 'is' 
                    ? 'Flugupplýsingar eru sóttar sjálfkrafa af kefairport.com til að aðstoða viðskiptavini við að velja rétta flugtíma.'
                    : 'Flight data is automatically fetched from kefairport.com to help customers select the correct flight times.'}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminShell title={locale === 'is' ? 'Stillingar' : 'Settings'}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="card p-2 lg:sticky lg:top-[88px]">
            <nav className="space-y-1">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span className={activeSection === section.id ? 'text-primary-600' : 'text-slate-400'}>
                    {section.icon}
                  </span>
                  <div>
                    <div className="font-medium text-sm">
                      {locale === 'is' ? section.title.is : section.title.en}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {locale === 'is'
                  ? SECTIONS.find((s) => s.id === activeSection)?.title.is
                  : SECTIONS.find((s) => s.id === activeSection)?.title.en}
              </h2>
              <p className="text-sm text-slate-500">
                {locale === 'is'
                  ? SECTIONS.find((s) => s.id === activeSection)?.description.is
                  : SECTIONS.find((s) => s.id === activeSection)?.description.en}
              </p>
            </div>

            {renderSection()}

            <div className="flex justify-end mt-6 pt-6 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {locale === 'is' ? 'Vista stillingar' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
