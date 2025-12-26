'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Shield,
  Download,
  Trash2,
  Bell,
  Globe,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Car,
  Calendar,
  Edit3,
  Save,
  X,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Zap,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  emailVerified: string | null;
  bookingsCount: number;
  vehiclesCount: number;
}

interface Vehicle {
  id: string;
  licensePlate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  isElectric: boolean;
  vehicleType: {
    id: string;
    name: string;
    nameEn: string;
  };
  _count: {
    bookings: number;
  };
  createdAt: string;
}

export default function AccountPage() {
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  
  // GDPR states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState('');
  const [removingVehicleId, setRemovingVehicleId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    } else if (status === 'authenticated') {
      fetchProfile();
      fetchVehicles();
    }
  }, [status, locale, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/account');
      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        setEditedName(result.data.name || '');
        setEditedPhone(result.data.phone || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const result = await response.json();
      if (result.success) {
        setVehicles(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!newPlate.trim()) return;
    
    setAddingVehicle(true);
    setVehicleError('');
    
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licensePlate: newPlate }),
      });
      const result = await response.json();
      
      if (result.success) {
        setVehicles(prev => [result.data, ...prev]);
        setNewPlate('');
        setShowAddVehicle(false);
        // Update profile count
        if (profile) {
          setProfile({ ...profile, vehiclesCount: profile.vehiclesCount + 1 });
        }
      } else {
        setVehicleError(result.error || 'Failed to add vehicle');
      }
    } catch (error) {
      console.error('Failed to add vehicle:', error);
      setVehicleError('Failed to add vehicle');
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleRemoveVehicle = async (vehicleId: string) => {
    setRemovingVehicleId(vehicleId);
    
    try {
      const response = await fetch(`/api/vehicles?id=${vehicleId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        setVehicles(prev => prev.filter(v => v.id !== vehicleId));
        // Update profile count
        if (profile) {
          setProfile({ ...profile, vehiclesCount: Math.max(0, profile.vehiclesCount - 1) });
        }
      } else {
        alert(result.error || 'Failed to remove vehicle');
      }
    } catch (error) {
      console.error('Failed to remove vehicle:', error);
    } finally {
      setRemovingVehicleId(null);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName, phone: editedPhone }),
      });
      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/account/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Failed to download data:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setDeleting(true);
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push(`/${locale}`);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-slate-600">
            {locale === 'is' ? 'Hleð...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {locale === 'is' ? 'Minn reikningur' : 'My Account'}
              </h1>
              <p className="text-slate-600">
                {locale === 'is' 
                  ? 'Stjórnaðu prófíl og stillingum'
                  : 'Manage your profile and settings'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  {locale === 'is' ? 'Prófíl' : 'Profile'}
                </h2>
                <p className="text-sm text-slate-500">
                  {locale === 'is' ? 'Grunnupplýsingar' : 'Basic information'}
                </p>
              </div>
            </div>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                {locale === 'is' ? 'Breyta' : 'Edit'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                  {locale === 'is' ? 'Hætta við' : 'Cancel'}
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {locale === 'is' ? 'Vista' : 'Save'}
                </button>
              </div>
            )}
          </div>
          <div className="p-6 space-y-4">
            {/* Name */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {locale === 'is' ? 'Nafn' : 'Name'}
                </span>
              </div>
              {editMode ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={locale === 'is' ? 'Nafn þitt' : 'Your name'}
                />
              ) : (
                <span className="font-medium text-slate-900">
                  {profile?.name || (locale === 'is' ? 'Ekki sett' : 'Not set')}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {locale === 'is' ? 'Netfang' : 'Email'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{profile?.email}</span>
                {profile?.emailVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {locale === 'is' ? 'Staðfest' : 'Verified'}
                  </span>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {locale === 'is' ? 'Sími' : 'Phone'}
                </span>
              </div>
              {editMode ? (
                <input
                  type="tel"
                  value={editedPhone}
                  onChange={(e) => setEditedPhone(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+354 xxx xxxx"
                />
              ) : (
                <span className="font-medium text-slate-900">
                  {profile?.phone || (locale === 'is' ? 'Ekki sett' : 'Not set')}
                </span>
              )}
            </div>

            {/* Member Since */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {locale === 'is' ? 'Meðlimur síðan' : 'Member since'}
                </span>
              </div>
              <span className="font-medium text-slate-900">
                {profile?.createdAt && formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{profile?.bookingsCount || 0}</p>
                <p className="text-sm text-slate-500">
                  {locale === 'is' ? 'Bókanir' : 'Bookings'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Car className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{profile?.vehiclesCount || 0}</p>
                <p className="text-sm text-slate-500">
                  {locale === 'is' ? 'Ökutæki' : 'Vehicles'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Vehicles */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Car className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  {locale === 'is' ? 'Mín ökutæki' : 'My Vehicles'}
                </h2>
                <p className="text-sm text-slate-500">
                  {locale === 'is' ? 'Skráð ökutæki' : 'Registered vehicles'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAddVehicle(true);
                setVehicleError('');
                setNewPlate('');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {locale === 'is' ? 'Bæta við' : 'Add'}
            </button>
          </div>

          {/* Add Vehicle Form */}
          {showAddVehicle && (
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {locale === 'is' ? 'Númeraplata' : 'License Plate'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newPlate}
                      onChange={(e) => {
                        setNewPlate(e.target.value.toUpperCase());
                        setVehicleError('');
                      }}
                      placeholder={locale === 'is' ? 't.d. ABC12' : 'e.g. ABC12'}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      maxLength={6}
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {locale === 'is' 
                      ? 'Við sækjum upplýsingar um bílinn sjálfkrafa'
                      : 'We\'ll automatically fetch vehicle info'}
                  </p>
                  {vehicleError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {vehicleError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <button
                    onClick={() => setShowAddVehicle(false)}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white transition-colors"
                  >
                    {locale === 'is' ? 'Hætta við' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleAddVehicle}
                    disabled={!newPlate.trim() || addingVehicle}
                    className="px-6 py-3 rounded-xl bg-primary-600 text-sm font-medium text-white hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {addingVehicle ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {locale === 'is' ? 'Leita...' : 'Searching...'}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {locale === 'is' ? 'Skrá ökutæki' : 'Add Vehicle'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vehicles List */}
          <div className="divide-y divide-slate-100">
            {loadingVehicles ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">
                  {locale === 'is' ? 'Engin ökutæki skráð' : 'No vehicles registered'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {locale === 'is' 
                    ? 'Bættu við ökutæki til að flýta fyrir bókun'
                    : 'Add a vehicle to speed up booking'}
                </p>
              </div>
            ) : (
              vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* License Plate styled like real plate */}
                    <div className="relative">
                      <div className={cn(
                        "h-12 px-4 rounded-lg flex items-center justify-center border-2",
                        vehicle.isElectric 
                          ? "bg-green-600 border-green-700" 
                          : "bg-slate-800 border-slate-900"
                      )}>
                        <span className="font-mono font-bold text-white text-lg tracking-widest">
                          {vehicle.licensePlate}
                        </span>
                      </div>
                      {vehicle.isElectric && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm">
                          <Zap className="h-3 w-3 text-yellow-900" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {vehicle.make && vehicle.model 
                          ? `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}`
                          : locale === 'is' ? vehicle.vehicleType?.name : vehicle.vehicleType?.nameEn}
                      </p>
                      <p className="text-sm text-slate-500">
                        {vehicle.color && <span>{vehicle.color}</span>}
                        {vehicle.color && (vehicle.make && vehicle.model) && ' · '}
                        {(vehicle.make && vehicle.model) && (locale === 'is' ? vehicle.vehicleType?.name : vehicle.vehicleType?.nameEn)}
                        {(vehicle.color || (vehicle.make && vehicle.model)) && ' · '}
                        {vehicle._count?.bookings || 0} {locale === 'is' ? 'bókanir' : 'bookings'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveVehicle(vehicle.id)}
                    disabled={removingVehicleId === vehicle.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title={locale === 'is' ? 'Fjarlægja' : 'Remove'}
                  >
                    {removingVehicleId === vehicle.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  {locale === 'is' ? 'Tilkynningar' : 'Notifications'}
                </h2>
                <p className="text-sm text-slate-500">
                  {locale === 'is' ? 'Stilltu hvernig við náum í þig' : 'Choose how we contact you'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-900">
                  {locale === 'is' ? 'Bókunartilkynningar' : 'Booking notifications'}
                </p>
                <p className="text-sm text-slate-500">
                  {locale === 'is' ? 'Fá tilkynningar um bókanir' : 'Receive booking updates'}
                </p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  emailNotifications ? 'bg-primary-600' : 'bg-slate-200'
                )}
              >
                <span className={cn(
                  'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                  emailNotifications && 'translate-x-6'
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-900">
                  {locale === 'is' ? 'Markaðspóstur' : 'Marketing emails'}
                </p>
                <p className="text-sm text-slate-500">
                  {locale === 'is' ? 'Tilboð og fréttir' : 'Offers and news'}
                </p>
              </div>
              <button
                onClick={() => setMarketingEmails(!marketingEmails)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  marketingEmails ? 'bg-primary-600' : 'bg-slate-200'
                )}
              >
                <span className={cn(
                  'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                  marketingEmails && 'translate-x-6'
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Data (GDPR) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  {locale === 'is' ? 'Persónuvernd & gögn' : 'Privacy & Data'}
                </h2>
                <p className="text-sm text-slate-500">
                  {locale === 'is' ? 'Stjórnaðu gögnunum þínum' : 'Manage your personal data'}
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Download Data */}
            <button
              onClick={handleDownloadData}
              disabled={downloading}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Download className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {locale === 'is' ? 'Sækja gögnin mín' : 'Download my data'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {locale === 'is' 
                      ? 'Fá afrit af öllum gögnum sem við höfum um þig'
                      : 'Get a copy of all your personal data'}
                  </p>
                </div>
              </div>
              {downloading ? (
                <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {/* Privacy Policy */}
            <a
              href={`/${locale}/privacy`}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {locale === 'is' ? 'Persónuverndarstefna' : 'Privacy Policy'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {locale === 'is' 
                      ? 'Lestu um hvernig við meðhöndlum gögnin þín'
                      : 'Learn how we handle your data'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </a>

            {/* Delete Account */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-6 hover:bg-red-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-600">
                    {locale === 'is' ? 'Eyða reikningi' : 'Delete account'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {locale === 'is' 
                      ? 'Eyða reikningi og öllum gögnum varanlega'
                      : 'Permanently delete your account and all data'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-red-400 group-hover:text-red-600" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6 bg-red-50 border-b border-red-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-900">
                      {locale === 'is' ? 'Eyða reikningi?' : 'Delete account?'}
                    </h3>
                    <p className="text-sm text-red-700">
                      {locale === 'is' ? 'Þetta er ekki hægt að afturkalla' : 'This cannot be undone'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600">
                  {locale === 'is'
                    ? 'Öll gögnin þín verða eytt varanlega, þar á meðal bókanir, ökutæki og stillingar. Sláðu inn DELETE til að staðfesta.'
                    : 'All your data will be permanently deleted, including bookings, vehicles, and settings. Type DELETE to confirm.'}
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {locale === 'is' ? 'Hætta við' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      locale === 'is' ? 'Eyða reikningi' : 'Delete account'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
