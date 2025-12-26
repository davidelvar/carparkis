'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocale } from 'next-intl';
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Save,
  X,
  Zap,
  Shield,
  Sun,
  Wrench,
  Brush,
  Armchair,
  ChevronDown,
  ChevronRight,
  Car,
  Truck,
  CircleDollarSign,
  FolderPlus,
  Folder,
  Droplets,
  Wind,
  Battery,
  Plug,
  Snowflake,
  Flame,
  Star,
  Heart,
  Clock,
  Package,
  Check,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import AdminShell from '@/components/admin/AdminShell';
import { Switch } from '@/components/ui/Switch';

interface VehicleType {
  id: string;
  name: string;
  nameEn: string;
  code: string;
}

interface LotService {
  id: string;
  price: number;
  lot: {
    id: string;
    name: string;
  };
  vehicleType: VehicleType;
}

interface ServiceCategory {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  icon: string | null;
  sortOrder: number;
}

interface Service {
  id: string;
  name: string;
  nameEn: string;
  description: string | null;
  descriptionEn: string | null;
  code: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  category: ServiceCategory | null;
  categoryId: string | null;
  lotServices: LotService[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  charging: <Zap className="h-5 w-5" />,
  cleaning: <Sparkles className="h-5 w-5" />,
  deep_cleaning: <Brush className="h-5 w-5" />,
  leather: <Armchair className="h-5 w-5" />,
  detailing: <Wrench className="h-5 w-5" />,
  coating: <Shield className="h-5 w-5" />,
  polishing: <Sun className="h-5 w-5" />,
  droplets: <Droplets className="h-5 w-5" />,
  wind: <Wind className="h-5 w-5" />,
  battery: <Battery className="h-5 w-5" />,
  plug: <Plug className="h-5 w-5" />,
  snowflake: <Snowflake className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />,
  clock: <Clock className="h-5 w-5" />,
  package: <Package className="h-5 w-5" />,
  car: <Car className="h-5 w-5" />,
  truck: <Truck className="h-5 w-5" />,
  folder: <Folder className="h-5 w-5" />,
};

// Icon options for selection
const ICON_OPTIONS = [
  { code: 'charging', label: 'Charging / Hleðsla' },
  { code: 'cleaning', label: 'Cleaning / Þrif' },
  { code: 'deep_cleaning', label: 'Deep Cleaning / Djúpþrif' },
  { code: 'leather', label: 'Leather / Leður' },
  { code: 'detailing', label: 'Detailing / Frágang' },
  { code: 'coating', label: 'Coating / Húðun' },
  { code: 'polishing', label: 'Polishing / Bónun' },
  { code: 'droplets', label: 'Water / Vatn' },
  { code: 'wind', label: 'Air / Loft' },
  { code: 'battery', label: 'Battery / Rafhlaða' },
  { code: 'plug', label: 'Electric / Rafmagn' },
  { code: 'snowflake', label: 'Cold / Kuldi' },
  { code: 'flame', label: 'Heat / Hiti' },
  { code: 'star', label: 'Premium / Úrvals' },
  { code: 'heart', label: 'Care / Umönnun' },
  { code: 'clock', label: 'Time / Tími' },
  { code: 'package', label: 'Package / Pakki' },
  { code: 'car', label: 'Car / Bíll' },
  { code: 'truck', label: 'Truck / Trukkur' },
  { code: 'folder', label: 'Other / Annað' },
];

const VEHICLE_SIZE_ICONS: Record<string, React.ReactNode> = {
  small: <Car className="h-4 w-4" />,
  medium: <Car className="h-4 w-4" />,
  large: <Truck className="h-4 w-4" />,
  xlarge: <Truck className="h-4 w-4" />,
};

export default function AdminServicesPage() {
  const locale = useLocale();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'service' | 'category'>('service');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Service form data
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    categoryId: '',
    icon: 'star',
    isActive: true,
  });
  
  // Category form data
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    nameEn: '',
    code: '',
    icon: '',
    isActive: true,
  });
  
  // Pricing data - keyed by vehicleTypeId
  const [pricing, setPricing] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchServices();
    fetchVehicleTypes();
  }, []);

  // Group services by category
  const groupedServices = useMemo(() => {
    const groups: { category: ServiceCategory | null; services: Service[] }[] = [];
    
    categories.forEach(cat => {
      const catServices = services.filter(s => s.categoryId === cat.id);
      if (catServices.length > 0) {
        groups.push({ category: cat, services: catServices });
      }
    });
    
    const uncategorized = services.filter(s => !s.categoryId);
    if (uncategorized.length > 0) {
      groups.push({ category: null, services: uncategorized });
    }
    
    return groups;
  }, [services, categories]);

  // Expand all categories by default
  useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(categories.map(c => c.id)));
    }
  }, [categories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/services');
      const data = await response.json();
      if (data.success) {
        setServices(data.data || []);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch('/api/admin/vehicle-types');
      const data = await response.json();
      if (data.success) {
        setVehicleTypes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch vehicle types:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
    const method = editingService ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pricing, // Include pricing data
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchServices();
        closePanel();
      }
    } catch (error) {
      console.error('Failed to save service:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'is' ? 'Ertu viss um að þú viljir eyða þessari þjónustu?' : 'Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) fetchServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const openEditPanel = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      nameEn: service.nameEn,
      description: service.description || '',
      descriptionEn: service.descriptionEn || '',
      categoryId: service.categoryId || '',
      icon: service.icon || 'star',
      isActive: service.isActive,
    });
    
    // Load existing pricing
    const existingPricing: Record<string, number> = {};
    service.lotServices.forEach(ls => {
      existingPricing[ls.vehicleType.id] = ls.price;
    });
    setPricing(existingPricing);
    
    setPanelMode('service');
    setIsPanelOpen(true);
  };

  const openCreatePanel = () => {
    setEditingService(null);
    setFormData({
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      categoryId: '',
      icon: 'star',
      isActive: true,
    });
    setPricing({});
    setPanelMode('service');
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingService(null);
    setEditingCategory(null);
    setFormData({
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      categoryId: '',
      icon: 'star',
      isActive: true,
    });
    setCategoryFormData({
      name: '',
      nameEn: '',
      code: '',
      icon: '',
      isActive: true,
    });
    setPricing({});
  };

  // Category handlers
  const openCreateCategoryPanel = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      nameEn: '',
      code: 'folder',
      icon: '',
      isActive: true,
    });
    setPanelMode('category');
    setIsPanelOpen(true);
  };

  const openEditCategoryPanel = (category: ServiceCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      nameEn: category.nameEn,
      code: category.code,
      icon: category.icon || category.code, // Use existing icon, or fall back to code
      isActive: true,
    });
    setPanelMode('category');
    setIsPanelOpen(true);
  };

  const handleSaveCategory = async () => {
    setIsSaving(true);
    const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
    const method = editingCategory ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData),
      });
      const data = await response.json();
      if (data.success) {
        fetchServices();
        closePanel();
      }
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(locale === 'is' ? 'Ertu viss? Þjónustur í þessum flokki verða óflokkðar.' : 'Are you sure? Services in this category will become uncategorized.')) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) fetchServices();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      const data = await response.json();
      if (data.success) fetchServices();
    } catch (error) {
      console.error('Failed to toggle service status:', error);
    }
  };

  const updatePrice = (vehicleTypeId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setPricing(prev => ({
      ...prev,
      [vehicleTypeId]: numValue,
    }));
  };

  return (
    <AdminShell title={locale === 'is' ? 'Aukaþjónustur' : 'Add-on Services'}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-slate-600 hidden sm:block">
            {locale === 'is' 
              ? 'Hér getur þú stjórnað aukaþjónustum og verðum.'
              : 'Manage add-on services and pricing here.'}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={openCreateCategoryPanel} className="btn-secondary flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              <span className="hidden sm:inline">{locale === 'is' ? 'Nýr flokkur' : 'New Category'}</span>
            </button>
            <button onClick={openCreatePanel} className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {locale === 'is' ? 'Ný þjónusta' : 'New Service'}
            </button>
          </div>
        </div>

        {/* Services List by Category */}
        {isLoading ? (
          <div className="card p-12 text-center text-slate-500">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            {locale === 'is' ? 'Hleður...' : 'Loading...'}
          </div>
        ) : services.length === 0 ? (
          <div className="card p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">
              {locale === 'is' ? 'Engar þjónustur fundust' : 'No services found'}
            </p>
            <button onClick={openCreatePanel} className="btn-primary">
              {locale === 'is' ? 'Búa til fyrstu þjónustu' : 'Create your first service'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 -mx-4 sm:-mx-6">
            {groupedServices.map(({ category, services: catServices }) => (
              <div key={category?.id || 'uncategorized'} className="bg-white rounded-none sm:rounded-xl shadow-sm border-y sm:border border-slate-200 overflow-hidden">
                {/* Category Header */}
                <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
                  <button
                    onClick={() => toggleCategory(category?.id || 'uncategorized')}
                    className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                  >
                    <div className="text-primary-600">
                      {category ? CATEGORY_ICONS[category.code] || <Folder className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-slate-900">
                        {category 
                          ? (locale === 'is' ? category.name : category.nameEn)
                          : (locale === 'is' ? 'Óflokkað' : 'Uncategorized')}
                      </h3>
                      <span className="text-sm text-slate-500">
                        {catServices.length} {locale === 'is' ? 'þjónustur' : 'services'}
                      </span>
                    </div>
                    {expandedCategories.has(category?.id || 'uncategorized') ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                  {category && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditCategoryPanel(category);
                        }}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                        title={locale === 'is' ? 'Breyta flokki' : 'Edit category'}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-slate-500 hover:text-red-600"
                        title={locale === 'is' ? 'Eyða flokki' : 'Delete category'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Services in Category */}
                {expandedCategories.has(category?.id || 'uncategorized') && (
                  <div className="divide-y divide-slate-100">
                    {catServices.map((service) => {
                      const getPriceByCode = (code: string) => {
                        const ls = service.lotServices.find(l => l.vehicleType?.code === code);
                        return ls ? ls.price : null;
                      };
                      const sizes = ['small', 'medium', 'large', 'xlarge'];
                      const sizeLabels = ['S', 'M', 'L', 'XL'];
                      const hasPrices = service.lotServices.length > 0;

                      return (
                        <div
                          key={service.id}
                          className={cn(
                            'px-5 py-4 hover:bg-slate-50 transition-colors',
                            !service.isActive && 'opacity-50'
                          )}
                        >
                          <div className="flex items-center gap-4">
                            {/* Service Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">
                                  {locale === 'is' ? service.name : service.nameEn}
                                </span>
                                {!service.isActive && (
                                  <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                                    {locale === 'is' ? 'Óvirkt' : 'Inactive'}
                                  </span>
                                )}
                              </div>
                              {(service.description || service.descriptionEn) && (
                                <p className="text-sm text-slate-500 mt-0.5 truncate">
                                  {locale === 'is' ? service.description : service.descriptionEn}
                                </p>
                              )}
                            </div>
                            
                            {/* Size-based pricing */}
                            <div className="hidden sm:flex items-center gap-1.5">
                              {hasPrices ? (
                                sizes.map((size, idx) => {
                                  const price = getPriceByCode(size);
                                  if (price === null) return null;
                                  return (
                                    <div key={size} className="text-center bg-slate-100 rounded-lg px-2.5 py-1 min-w-[60px]">
                                      <div className="text-[10px] font-medium text-slate-500">{sizeLabels[idx]}</div>
                                      <div className="text-xs font-semibold text-slate-700">
                                        {formatPrice(price, locale)}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-600 text-xs px-2">
                                  <CircleDollarSign className="h-3.5 w-3.5" />
                                  {locale === 'is' ? 'Ekkert verð' : 'No price'}
                                </span>
                              )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditPanel(service)}
                                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                                title={locale === 'is' ? 'Breyta' : 'Edit'}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(service.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-slate-500 hover:text-red-600"
                                title={locale === 'is' ? 'Eyða' : 'Delete'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <Switch
                                checked={service.isActive}
                                onCheckedChange={() => toggleActive(service)}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-out Panel for Edit/Create */}
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 z-40 transition-opacity"
            onClick={closePanel}
          />
          
          {/* Panel */}
          <div 
            ref={panelRef}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300"
          >
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-slate-900">
                {panelMode === 'category' 
                  ? (editingCategory
                      ? locale === 'is' ? 'Breyta flokki' : 'Edit Category'
                      : locale === 'is' ? 'Nýr flokkur' : 'New Category')
                  : (editingService
                      ? locale === 'is' ? 'Breyta þjónustu' : 'Edit Service'
                      : locale === 'is' ? 'Ný þjónusta' : 'New Service')}
              </h2>
              <button 
                onClick={closePanel}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="p-6 space-y-6">
              {panelMode === 'category' ? (
                /* Category Form */
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900 flex items-center gap-2">
                    <Folder className="h-4 w-4 text-primary-600" />
                    {locale === 'is' ? 'Flokksupplýsingar' : 'Category Information'}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="label">{locale === 'is' ? 'Heiti (íslenska)' : 'Name (Icelandic)'}</label>
                      <input
                        type="text"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        className="input"
                        placeholder={locale === 'is' ? 'Hleðsla' : 'Charging'}
                      />
                    </div>
                    <div>
                      <label className="label">{locale === 'is' ? 'Heiti (enska)' : 'Name (English)'}</label>
                      <input
                        type="text"
                        value={categoryFormData.nameEn}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, nameEn: e.target.value })}
                        className="input"
                        placeholder="Charging"
                      />
                    </div>
                    
                    {/* Icon Selection */}
                    <div>
                      <label className="label">{locale === 'is' ? 'Táknmynd' : 'Icon'}</label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {ICON_OPTIONS.map((option) => (
                          <button
                            key={option.code}
                            type="button"
                            onClick={() => setCategoryFormData({ ...categoryFormData, code: option.code, icon: option.code })}
                            className={cn(
                              'p-3 rounded-lg border-2 transition-all flex items-center justify-center',
                              categoryFormData.code === option.code
                                ? 'border-primary-500 bg-primary-50 text-primary-600'
                                : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700'
                            )}
                            title={option.label}
                          >
                            {CATEGORY_ICONS[option.code]}
                            {categoryFormData.code === option.code && (
                              <Check className="h-3 w-3 absolute -top-1 -right-1 bg-primary-500 text-white rounded-full p-0.5" />
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {locale === 'is' ? 'Valið: ' : 'Selected: '}
                        <span className="font-medium">{ICON_OPTIONS.find(o => o.code === categoryFormData.code)?.label || categoryFormData.code}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">
                          {locale === 'is' ? 'Virkur flokkur' : 'Active Category'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {locale === 'is' ? 'Sýna flokk og þjónustur' : 'Show category and services'}
                        </p>
                      </div>
                      <Switch
                        checked={categoryFormData.isActive}
                        onCheckedChange={(checked) => setCategoryFormData({ ...categoryFormData, isActive: checked })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Service Form */
                <>
                  {/* Basic Info Section */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary-600" />
                      {locale === 'is' ? 'Grunnupplýsingar' : 'Basic Information'}
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="label">{locale === 'is' ? 'Heiti (íslenska)' : 'Name (Icelandic)'}</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="input"
                          placeholder="Bílaþvottur"
                        />
                      </div>
                      <div>
                        <label className="label">{locale === 'is' ? 'Heiti (enska)' : 'Name (English)'}</label>
                        <input
                          type="text"
                          value={formData.nameEn}
                          onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                          className="input"
                          placeholder="Car Wash"
                        />
                      </div>
                      <div>
                        <label className="label">{locale === 'is' ? 'Lýsing (íslenska)' : 'Description (Icelandic)'}</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="input"
                          rows={2}
                          placeholder={locale === 'is' ? 'Stutt lýsing á þjónustunni...' : 'Brief description of the service...'}
                        />
                      </div>
                      <div>
                        <label className="label">{locale === 'is' ? 'Lýsing (enska)' : 'Description (English)'}</label>
                        <textarea
                          value={formData.descriptionEn}
                          onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                          className="input"
                          rows={2}
                          placeholder="Brief description of the service..."
                        />
                      </div>
                      <div>
                        <label className="label">{locale === 'is' ? 'Flokkur' : 'Category'}</label>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          className="input"
                        >
                          <option value="">{locale === 'is' ? 'Enginn flokkur' : 'No category'}</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {locale === 'is' ? cat.name : cat.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">
                            {locale === 'is' ? 'Virk þjónusta' : 'Active Service'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {locale === 'is' ? 'Sýna þjónustu í bókunarferli' : 'Show service in booking flow'}
                          </p>
                        </div>
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900 flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-primary-600" />
                      {locale === 'is' ? 'Verðlagning' : 'Pricing'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {locale === 'is' 
                        ? 'Settu verð fyrir hverja bílastærð. Skildu autt ef þjónusta er ekki í boði fyrir þá stærð.'
                        : 'Set price for each vehicle size. Leave empty if service is not available for that size.'}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {vehicleTypes.length > 0 ? (
                        vehicleTypes.map((vt) => (
                          <div key={vt.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-slate-500">
                                {VEHICLE_SIZE_ICONS[vt.code] || <Car className="h-4 w-4" />}
                              </span>
                              <span className="font-medium text-slate-700">
                                {locale === 'is' ? vt.name : vt.nameEn}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={pricing[vt.id] || ''}
                                onChange={(e) => updatePrice(vt.id, e.target.value)}
                                className="input w-28 text-right"
                                placeholder="0"
                                min="0"
                                step="100"
                              />
                              <span className="text-slate-500 text-sm">kr.</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                          {locale === 'is' 
                            ? 'Engar bílastærðir fundust. Bættu við bílastærðum til að setja verð.'
                            : 'No vehicle types found. Add vehicle types to set pricing.'}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Panel Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={closePanel} 
                className="btn-secondary"
                disabled={isSaving}
              >
                {locale === 'is' ? 'Hætta við' : 'Cancel'}
              </button>
              <button 
                onClick={panelMode === 'category' ? handleSaveCategory : handleSave} 
                className="btn-primary flex items-center gap-2"
                disabled={isSaving || (panelMode === 'category' 
                  ? !categoryFormData.name || !categoryFormData.nameEn
                  : !formData.name || !formData.nameEn)}
              >
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {locale === 'is' ? 'Vista' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
