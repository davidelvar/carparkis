'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Car,
  Save,
  X,
  CheckCircle2,
  ParkingCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminShell from '@/components/admin/AdminShell';

interface Lot {
  id: string;
  name: string;
  nameEn: string;
  description: string | null;
  descriptionEn: string | null;
  totalSpaces: number;
  availableSpaces: number;
  isActive: boolean;
}

export default function AdminLotsPage() {
  const locale = useLocale();

  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    totalSpaces: 100,
    isActive: true,
  });

  useEffect(() => {
    fetchLots();
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

  const fetchLots = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/lots?includeAll=true');
      const data = await response.json();
      if (data.success) {
        setLots(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch lots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreatePanel = () => {
    setEditingLot(null);
    setFormData({
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      totalSpaces: 100,
      isActive: true,
    });
    setIsPanelOpen(true);
  };

  const openEditPanel = (lot: Lot) => {
    setEditingLot(lot);
    setFormData({
      name: lot.name,
      nameEn: lot.nameEn,
      description: lot.description || '',
      descriptionEn: lot.descriptionEn || '',
      totalSpaces: lot.totalSpaces,
      isActive: lot.isActive,
    });
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingLot(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const url = editingLot ? `/api/lots/${editingLot.id}` : '/api/lots';
    const method = editingLot ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        fetchLots();
        closePanel();
      }
    } catch (error) {
      console.error('Failed to save lot:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'is' ? 'Ertu viss um að þú viljir eyða þessum stæðisvöll?' : 'Are you sure you want to delete this lot?')) {
      return;
    }

    try {
      const response = await fetch(`/api/lots/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        fetchLots();
      }
    } catch (error) {
      console.error('Failed to delete lot:', error);
    }
  };

  const toggleActive = async (lot: Lot, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/lots/${lot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !lot.isActive }),
      });
      const data = await response.json();
      if (data.success) {
        fetchLots();
      }
    } catch (error) {
      console.error('Failed to toggle lot status:', error);
    }
  };

  // Stats
  const totalLots = lots.length;
  const activeLots = lots.filter((l) => l.isActive).length;
  const totalSpaces = lots.reduce((sum, l) => sum + (l.totalSpaces || 0), 0);
  const availableSpaces = lots.reduce((sum, l) => sum + (l.availableSpaces ?? l.totalSpaces ?? 0), 0);
  const occupancyRate = totalSpaces > 0 ? Math.round(((totalSpaces - availableSpaces) / totalSpaces) * 100) : 0;

  return (
    <AdminShell title={locale === 'is' ? 'Bílastæði' : 'Parking Lots'}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <MapPin className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalLots}</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Stæðagarðar' : 'Parking Lots'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeLots}</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Virk' : 'Active'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ParkingCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalSpaces}</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Heildarstæði' : 'Total Spaces'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                occupancyRate > 80 ? 'bg-red-100' : occupancyRate > 50 ? 'bg-amber-100' : 'bg-green-100'
              )}>
                <Car className={cn(
                  'h-5 w-5',
                  occupancyRate > 80 ? 'text-red-600' : occupancyRate > 50 ? 'text-amber-600' : 'text-green-600'
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{occupancyRate}%</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Nýting' : 'Occupancy'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button onClick={openCreatePanel} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {locale === 'is' ? 'Nýr stæðagarður' : 'Add Lot'}
          </button>
        </div>

        {/* Lots Table */}
        <div className="card p-0 overflow-hidden -mx-4 sm:mx-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500">{locale === 'is' ? 'Hleður...' : 'Loading...'}</p>
            </div>
          ) : lots.length === 0 ? (
            <div className="p-12 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">{locale === 'is' ? 'Engir stæðagarðar fundust' : 'No parking lots found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 sm:px-5 py-3">
                      {locale === 'is' ? 'Nafn' : 'Name'}
                    </th>
                    <th className="hidden md:table-cell text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Lýsing' : 'Description'}
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Stæði' : 'Spaces'}
                    </th>
                    <th className="hidden sm:table-cell text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Nýting' : 'Occupancy'}
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
                  {lots.map((lot) => {
                    const totalSpacesVal = lot.totalSpaces || 0;
                    const availableSpacesVal = lot.availableSpaces ?? totalSpacesVal;
                    const usedSpaces = totalSpacesVal - availableSpacesVal;
                    const lotOccupancy = totalSpacesVal > 0 ? Math.round((usedSpaces / totalSpacesVal) * 100) : 0;
                    
                    return (
                      <tr
                        key={lot.id}
                        onClick={() => openEditPanel(lot)}
                        className={cn(
                          'hover:bg-slate-50 transition-colors cursor-pointer',
                          !lot.isActive && 'opacity-60'
                        )}
                      >
                        <td className="px-4 sm:px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                              <MapPin className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {locale === 'is' ? lot.name : lot.nameEn}
                              </p>
                              <p className="text-xs text-slate-500 md:hidden">
                                {locale === 'is' ? lot.description : lot.descriptionEn}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4">
                          <p className="text-sm text-slate-600 max-w-xs truncate">
                            {locale === 'is' ? lot.description : lot.descriptionEn}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Car className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{lot.availableSpaces}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-600">{lot.totalSpaces}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  lotOccupancy > 80 ? 'bg-red-500' : lotOccupancy > 50 ? 'bg-amber-500' : 'bg-green-500'
                                )}
                                style={{ width: `${lotOccupancy}%` }}
                              />
                            </div>
                            <span className={cn(
                              'text-xs font-medium min-w-[2.5rem]',
                              lotOccupancy > 80 ? 'text-red-600' : lotOccupancy > 50 ? 'text-amber-600' : 'text-green-600'
                            )}>
                              {lotOccupancy}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={(e) => toggleActive(lot, e)}
                            className={cn(
                              'inline-flex px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                              lot.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            )}
                          >
                            {lot.isActive
                              ? locale === 'is' ? 'Virkt' : 'Active'
                              : locale === 'is' ? 'Óvirkt' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 sm:px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditPanel(lot);
                              }}
                              className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                              title={locale === 'is' ? 'Breyta' : 'Edit'}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(lot.id);
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-slate-500 hover:text-red-600"
                              title={locale === 'is' ? 'Eyða' : 'Delete'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                {editingLot
                  ? locale === 'is' ? 'Breyta stæðagarði' : 'Edit Parking Lot'
                  : locale === 'is' ? 'Nýr stæðagarður' : 'New Parking Lot'}
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
              {/* Name fields */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="fi fi-is w-4 h-3 rounded-sm" />
                  {locale === 'is' ? 'Íslenska' : 'Icelandic'}
                </div>
                <div>
                  <label className="label">{locale === 'is' ? 'Heiti' : 'Name'}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Stæðagarður A"
                  />
                </div>
                <div>
                  <label className="label">{locale === 'is' ? 'Lýsing' : 'Description'}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder={locale === 'is' ? 'Stutt lýsing...' : 'Short description...'}
                  />
                </div>
              </div>

              <hr className="border-slate-200" />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="fi fi-gb w-4 h-3 rounded-sm" />
                  {locale === 'is' ? 'Enska' : 'English'}
                </div>
                <div>
                  <label className="label">{locale === 'is' ? 'Heiti' : 'Name'}</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="input"
                    placeholder="Parking Lot A"
                  />
                </div>
                <div>
                  <label className="label">{locale === 'is' ? 'Lýsing' : 'Description'}</label>
                  <textarea
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Short description..."
                  />
                </div>
              </div>

              <hr className="border-slate-200" />

              <div>
                <label className="label">{locale === 'is' ? 'Fjöldi stæða' : 'Total Spaces'}</label>
                <div className="relative">
                  <ParkingCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    value={formData.totalSpaces}
                    onChange={(e) => setFormData({ ...formData, totalSpaces: parseInt(e.target.value) || 0 })}
                    className="input pl-10"
                    min={1}
                  />
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
                    <CheckCircle2 className="h-4 w-4 inline mr-2" />
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
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {locale === 'is' ? 'Óvirkt' : 'Inactive'}
                  </button>
                </div>
              </div>

              {/* Current Occupancy (Edit mode only) */}
              {editingLot && (() => {
                const total = editingLot.totalSpaces || 0;
                const available = editingLot.availableSpaces ?? total;
                const occupied = total - available;
                const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;
                return (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                      {locale === 'is' ? 'Núverandi staða' : 'Current Status'}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">{locale === 'is' ? 'Laus stæði' : 'Available'}</span>
                      <span className="font-semibold text-green-600">{available}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">{locale === 'is' ? 'Upptekin' : 'Occupied'}</span>
                      <span className="font-semibold text-amber-600">{occupied}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>{locale === 'is' ? 'Nýting' : 'Occupancy'}</span>
                        <span>{occupancy}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
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
                disabled={isSaving || !formData.name || !formData.nameEn}
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
