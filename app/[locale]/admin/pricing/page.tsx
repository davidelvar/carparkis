'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import {
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Save,
  X,
  Car,
  TrendingUp,
  Percent,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import AdminShell from '@/components/admin/AdminShell';

interface VehicleType {
  id: string;
  name: string;
  nameEn: string;
}

interface Lot {
  id: string;
  name: string;
  nameEn: string;
}

interface LotPricing {
  id: string;
  vehicleTypeId: string;
  vehicleType: VehicleType;
  lotId: string;
  lot: Lot;
  baseFee: number;
  pricePerDay: number;
  weeklyDiscount?: number | null;
  monthlyDiscount?: number | null;
  isActive: boolean;
}

export default function AdminPricingPage() {
  const locale = useLocale();

  const [pricing, setPricing] = useState<LotPricing[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<LotPricing | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    vehicleTypeId: '',
    lotId: '',
    baseFee: 7000,
    pricePerDay: 2000,
    weeklyDiscount: 0,
    monthlyDiscount: 0,
    isActive: true,
  });

  // Filter state
  const [filterVehicleType, setFilterVehicleType] = useState<string>('all');
  const [filterLot, setFilterLot] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  // Click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        closePanel();
      }
    };

    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isPanelOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pricingRes, vehicleTypesRes, lotsRes] = await Promise.all([
        fetch('/api/admin/pricing'),
        fetch('/api/admin/pricing/vehicle-types'),
        fetch('/api/lots?includeAll=true'),
      ]);
      const [pricingData, vehicleTypesData, lotsData] = await Promise.all([
        pricingRes.json(),
        vehicleTypesRes.json(),
        lotsRes.json(),
      ]);

      if (pricingData.success) setPricing(pricingData.data || []);
      if (vehicleTypesData.success) setVehicleTypes(vehicleTypesData.data || []);
      if (lotsData.success) setLots(lotsData.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreatePanel = () => {
    setEditingPricing(null);
    setFormData({
      vehicleTypeId: vehicleTypes[0]?.id || '',
      lotId: lots[0]?.id || '',
      baseFee: 7000,
      pricePerDay: 2000,
      weeklyDiscount: 0,
      monthlyDiscount: 0,
      isActive: true,
    });
    setIsPanelOpen(true);
  };

  const openEditPanel = (price: LotPricing) => {
    setEditingPricing(price);
    setFormData({
      vehicleTypeId: price.vehicleTypeId,
      lotId: price.lotId,
      baseFee: price.baseFee || 0,
      pricePerDay: price.pricePerDay,
      weeklyDiscount: price.weeklyDiscount || 0,
      monthlyDiscount: price.monthlyDiscount || 0,
      isActive: price.isActive,
    });
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingPricing(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const url = editingPricing ? `/api/admin/pricing/${editingPricing.id}` : '/api/admin/pricing';
    const method = editingPricing ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
        closePanel();
      }
    } catch (error) {
      console.error('Failed to save pricing:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'is' ? 'Ertu viss?' : 'Are you sure?')) return;

    try {
      const response = await fetch(`/api/admin/pricing/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) fetchData();
    } catch (error) {
      console.error('Failed to delete pricing:', error);
    }
  };

  // Filter pricing
  const filteredPricing = pricing.filter((p) => {
    if (filterVehicleType !== 'all' && p.vehicleTypeId !== filterVehicleType) return false;
    if (filterLot !== 'all' && p.lotId !== filterLot) return false;
    return true;
  });

  // Stats
  const activePricing = pricing.filter((p) => p.isActive).length;
  const avgPrice = pricing.length > 0
    ? Math.round(pricing.reduce((sum, p) => sum + p.pricePerDay, 0) / pricing.length)
    : 0;
  const avgDiscount = pricing.length > 0
    ? Math.round(pricing.reduce((sum, p) => sum + (p.weeklyDiscount || 0), 0) / pricing.length)
    : 0;

  return (
    <AdminShell title={locale === 'is' ? 'Verðskrá' : 'Pricing'}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pricing.length}</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Verðflokkar' : 'Price Tiers'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activePricing}</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Virk' : 'Active'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatPrice(avgPrice, locale)}</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Meðalverð' : 'Avg. Price'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Percent className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{avgDiscount}%</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Meðalafsl.' : 'Avg. Discount'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterVehicleType}
            onChange={(e) => setFilterVehicleType(e.target.value)}
            className="input w-full sm:w-auto sm:min-w-[180px]"
          >
            <option value="all">{locale === 'is' ? 'Allar tegundir' : 'All Vehicle Types'}</option>
            {vehicleTypes.map((vt) => (
              <option key={vt.id} value={vt.id}>
                {locale === 'is' ? vt.name : vt.nameEn}
              </option>
            ))}
          </select>
          <select
            value={filterLot}
            onChange={(e) => setFilterLot(e.target.value)}
            className="input w-full sm:w-auto sm:min-w-[180px]"
          >
            <option value="all">{locale === 'is' ? 'Allir stæðagarðar' : 'All Lots'}</option>
            {lots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {locale === 'is' ? lot.name : lot.nameEn}
              </option>
            ))}
          </select>
          <div className="flex-1" />
          <button onClick={openCreatePanel} className="btn-primary flex items-center justify-center gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            {locale === 'is' ? 'Nýtt verð' : 'Add Pricing'}
          </button>
        </div>

        {/* Pricing Table */}
        <div className="card p-0 overflow-hidden -mx-4 sm:mx-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500">{locale === 'is' ? 'Hleður...' : 'Loading...'}</p>
            </div>
          ) : filteredPricing.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">{locale === 'is' ? 'Engin verð fundust' : 'No pricing found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 sm:px-5 py-3">
                      {locale === 'is' ? 'Tegund' : 'Vehicle Type'}
                    </th>
                    <th className="hidden sm:table-cell text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Stæðagarður' : 'Lot'}
                    </th>
                    <th className="hidden lg:table-cell text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Grunn' : 'Base'}
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Dagverð' : 'Daily'}
                    </th>
                    <th className="hidden md:table-cell text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Vikuafsl.' : 'Weekly'}
                    </th>
                    <th className="hidden md:table-cell text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Mán.afsl.' : 'Monthly'}
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Staða' : 'Status'}
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 sm:px-5 py-3">
                      {locale === 'is' ? 'Aðgerðir' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPricing.map((tier) => (
                    <tr
                      key={tier.id}
                      onClick={() => openEditPanel(tier)}
                      className={cn(
                        'hover:bg-slate-50 transition-colors cursor-pointer',
                        !tier.isActive && 'opacity-60'
                      )}
                    >
                      <td className="px-4 sm:px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <Car className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="font-medium text-slate-900">
                            {locale === 'is' ? tier.vehicleType.name : tier.vehicleType.nameEn}
                          </span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="h-3.5 w-3.5" />
                          {locale === 'is' ? tier.lot.name : tier.lot.nameEn}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-4 text-right">
                        <span className="text-sm text-slate-600">
                          {formatPrice(tier.baseFee || 0, locale)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-primary-600">
                          {formatPrice(tier.pricePerDay, locale)}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-center">
                        {tier.weeklyDiscount ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            -{tier.weeklyDiscount}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-center">
                        {tier.monthlyDiscount ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            -{tier.monthlyDiscount}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={cn(
                            'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                            tier.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {tier.isActive
                            ? locale === 'is' ? 'Virkt' : 'Active'
                            : locale === 'is' ? 'Óvirkt' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditPanel(tier);
                            }}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                            title={locale === 'is' ? 'Breyta' : 'Edit'}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tier.id);
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-slate-500 hover:text-red-600"
                            title={locale === 'is' ? 'Eyða' : 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Panel */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 transition-opacity" />

          {/* Panel */}
          <div
            ref={panelRef}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingPricing
                  ? locale === 'is' ? 'Breyta verði' : 'Edit Pricing'
                  : locale === 'is' ? 'Nýtt verð' : 'New Pricing'}
              </h2>
              <button
                onClick={closePanel}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="label">{locale === 'is' ? 'Tegund ökutækis' : 'Vehicle Type'}</label>
                <select
                  value={formData.vehicleTypeId}
                  onChange={(e) => setFormData({ ...formData, vehicleTypeId: e.target.value })}
                  className="input"
                >
                  {vehicleTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {locale === 'is' ? vt.name : vt.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{locale === 'is' ? 'Stæðagarður' : 'Parking Lot'}</label>
                <select
                  value={formData.lotId}
                  onChange={(e) => setFormData({ ...formData, lotId: e.target.value })}
                  className="input"
                >
                  {lots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {locale === 'is' ? lot.name : lot.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{locale === 'is' ? 'Grunngjald (ISK)' : 'Base Fee (ISK)'}</label>
                <p className="text-xs text-slate-500 mb-1.5">
                  {locale === 'is' ? 'Fast gjald sem bætist við hverja bókun' : 'Fixed fee added to each booking'}
                </p>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    value={formData.baseFee}
                    onChange={(e) => setFormData({ ...formData, baseFee: parseInt(e.target.value) || 0 })}
                    className="input pl-10"
                    min={0}
                    step={500}
                  />
                </div>
              </div>

              <div>
                <label className="label">{locale === 'is' ? 'Verð á dag (ISK)' : 'Price per Day (ISK)'}</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: parseInt(e.target.value) || 0 })}
                    className="input pl-10"
                    min={0}
                    step={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{locale === 'is' ? 'Vikuafsláttur (%)' : 'Weekly Discount (%)'}</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      value={formData.weeklyDiscount}
                      onChange={(e) => setFormData({ ...formData, weeklyDiscount: parseInt(e.target.value) || 0 })}
                      className="input pl-10"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">{locale === 'is' ? 'Mánaðarafsl. (%)' : 'Monthly Discount (%)'}</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      value={formData.monthlyDiscount}
                      onChange={(e) => setFormData({ ...formData, monthlyDiscount: parseInt(e.target.value) || 0 })}
                      className="input pl-10"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">{locale === 'is' ? 'Staða' : 'Status'}</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: true })}
                    className={cn(
                      'flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                      formData.isActive
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {locale === 'is' ? 'Virkt' : 'Active'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: false })}
                    className={cn(
                      'flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                      !formData.isActive
                        ? 'border-slate-500 bg-slate-50 text-slate-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {locale === 'is' ? 'Óvirkt' : 'Inactive'}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                  {locale === 'is' ? 'Forskoðun' : 'Preview'}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-200 pb-2 mb-2">
                    <span className="text-sm text-slate-600">{locale === 'is' ? 'Grunngjald' : 'Base fee'}</span>
                    <span className="font-semibold text-primary-600">{formatPrice(formData.baseFee, locale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">{locale === 'is' ? '1 dagur' : '1 day'}</span>
                    <span className="font-semibold text-slate-900">{formatPrice(formData.baseFee + formData.pricePerDay, locale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">{locale === 'is' ? '7 dagar' : '7 days'}</span>
                    <span className="font-semibold text-slate-900">
                      {formatPrice(formData.baseFee + Math.round(formData.pricePerDay * 7 * (1 - (formData.weeklyDiscount || 0) / 100)), locale)}
                      {formData.weeklyDiscount ? (
                        <span className="text-green-600 text-xs ml-1">(-{formData.weeklyDiscount}%)</span>
                      ) : null}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">{locale === 'is' ? '30 dagar' : '30 days'}</span>
                    <span className="font-semibold text-slate-900">
                      {formatPrice(formData.baseFee + Math.round(formData.pricePerDay * 30 * (1 - (formData.monthlyDiscount || 0) / 100)), locale)}
                      {formData.monthlyDiscount ? (
                        <span className="text-blue-600 text-xs ml-1">(-{formData.monthlyDiscount}%)</span>
                      ) : null}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={closePanel}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" />
                {locale === 'is' ? 'Hætta við' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {locale === 'is' ? 'Vista' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
