'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  User,
  Users,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Phone,
  Key,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import AdminShell from '@/components/admin/AdminShell';
import PinKeypad from '@/components/ui/PinKeypad';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'CUSTOMER';
  phone: string | null;
  kennitala: string | null;
  createdAt: string;
  _count?: {
    bookings: number;
  };
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  OPERATOR: 'bg-blue-100 text-blue-800',
  CUSTOMER: 'bg-slate-100 text-slate-700',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  ADMIN: <Shield className="h-3.5 w-3.5" />,
  OPERATOR: <Users className="h-3.5 w-3.5" />,
  CUSTOMER: <User className="h-3.5 w-3.5" />,
};

export default function AdminUsersPage() {
  const locale = useLocale();
  const router = useRouter();

  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Panel state for create/edit
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CUSTOMER' as 'ADMIN' | 'OPERATOR' | 'CUSTOMER',
    phone: '',
    kennitala: '',
    pin: '',
  });

  const itemsPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditPanel = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      kennitala: user.kennitala || '',
      pin: '',
    });
    setIsPanelOpen(true);
  };

  const openCreatePanel = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'CUSTOMER',
      phone: '',
      kennitala: '',
      pin: '',
    });
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'CUSTOMER',
      phone: '',
      kennitala: '',
      pin: '',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    if (editingUser) {
      try {
        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (data.success) {
          fetchUsers();
          closePanel();
        }
      } catch (error) {
        console.error('Failed to save user:', error);
      }
    } else {
      if (!formData.email) {
        alert(locale === 'is' ? 'Netfang er nauðsynlegt' : 'Email is required');
        setIsSaving(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (data.success) {
          fetchUsers();
          closePanel();
        } else {
          alert(data.error || (locale === 'is' ? 'Villa við að búa til notanda' : 'Failed to create user'));
        }
      } catch (error) {
        console.error('Failed to create user:', error);
      }
    }
    
    setIsSaving(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(locale === 'is' ? 'Ertu viss um að þú viljir eyða þessum notanda?' : 'Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.kennitala?.includes(searchQuery);

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    operators: users.filter((u) => u.role === 'OPERATOR').length,
    customers: users.filter((u) => u.role === 'CUSTOMER').length,
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return locale === 'is' ? 'Stjórnandi' : 'Admin';
      case 'OPERATOR': return locale === 'is' ? 'Rekstraraðili' : 'Operator';
      default: return locale === 'is' ? 'Viðskiptavinur' : 'Customer';
    }
  };

  return (
    <AdminShell title={locale === 'is' ? 'Notendur' : 'Users'}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-500">{locale === 'is' ? 'Allir' : 'Total'}</div>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.admins}</div>
              <div className="text-sm text-slate-500">{locale === 'is' ? 'Stjórnendur' : 'Admins'}</div>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.operators}</div>
              <div className="text-sm text-slate-500">{locale === 'is' ? 'Rekstraraðilar' : 'Operators'}</div>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.customers}</div>
              <div className="text-sm text-slate-500">{locale === 'is' ? 'Viðskiptavinir' : 'Customers'}</div>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder={locale === 'is' ? 'Leita að notanda...' : 'Search users...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input w-full sm:w-auto sm:min-w-[160px] shrink-0"
          >
            <option value="all">{locale === 'is' ? 'Öll hlutverk' : 'All roles'}</option>
            <option value="ADMIN">{locale === 'is' ? 'Stjórnendur' : 'Admins'}</option>
            <option value="OPERATOR">{locale === 'is' ? 'Rekstraraðilar' : 'Operators'}</option>
            <option value="CUSTOMER">{locale === 'is' ? 'Viðskiptavinir' : 'Customers'}</option>
          </select>
          <button onClick={openCreatePanel} className="btn-primary flex items-center gap-2 shrink-0">
            <UserPlus className="h-4 w-4" />
            {locale === 'is' ? 'Nýr notandi' : 'Add User'}
          </button>
        </div>

        {/* Users Table */}
        <div className="card p-0 overflow-hidden -mx-4 sm:mx-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500">{locale === 'is' ? 'Hleður...' : 'Loading...'}</p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">{locale === 'is' ? 'Engir notendur fundust' : 'No users found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 sm:px-5 py-3">
                      {locale === 'is' ? 'Notandi' : 'User'}
                    </th>
                    <th className="hidden md:table-cell text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Sími' : 'Phone'}
                    </th>
                    <th className="hidden sm:table-cell text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Bókanir' : 'Bookings'}
                    </th>
                    <th className="hidden md:table-cell text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Skráður' : 'Joined'}
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 sm:px-5 py-3">
                      {locale === 'is' ? 'Aðgerðir' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/${locale}/admin/users/${user.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 sm:px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600'
                              : user.role === 'OPERATOR' ? 'bg-blue-100 text-blue-600'
                              : 'bg-slate-100 text-slate-600'
                          )}>
                            {ROLE_ICONS[user.role]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">
                                {user.name || user.email.split('@')[0]}
                              </span>
                              <span className={cn(
                                'hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                ROLE_COLORS[user.role]
                              )}>
                                {getRoleLabel(user.role)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-sm text-slate-600">
                        {user.phone || '—'}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700">
                          {user._count?.bookings || 0}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-sm text-slate-600">
                        {formatDate(user.createdAt, locale)}
                      </td>
                      <td className="px-4 sm:px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditPanel(user);
                            }}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                            title={locale === 'is' ? 'Breyta' : 'Edit'}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(user.id, e)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50">
              <div className="text-sm text-slate-600">
                {locale === 'is'
                  ? `Sýni ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredUsers.length)} af ${filteredUsers.length}`
                  : `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredUsers.length)} of ${filteredUsers.length}`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Panel for Create/Edit */}
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
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300"
          >
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingUser
                  ? locale === 'is' ? 'Breyta notanda' : 'Edit User'
                  : locale === 'is' ? 'Nýr notandi' : 'New User'}
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
              {/* Avatar preview */}
              <div className="flex justify-center">
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center',
                  formData.role === 'ADMIN' ? 'bg-purple-100 text-purple-600'
                    : formData.role === 'OPERATOR' ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-600'
                )}>
                  {formData.role === 'ADMIN' ? <Shield className="h-10 w-10" />
                    : formData.role === 'OPERATOR' ? <Users className="h-10 w-10" />
                    : <User className="h-10 w-10" />}
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="label">{locale === 'is' ? 'Nafn' : 'Name'}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder={locale === 'is' ? 'Fullt nafn' : 'Full name'}
                  />
                </div>

                <div>
                  <label className="label">{locale === 'is' ? 'Netfang' : 'Email'} *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    disabled={!!editingUser}
                    placeholder="email@example.com"
                  />
                  {editingUser && (
                    <p className="text-xs text-slate-500 mt-1">
                      {locale === 'is' ? 'Netfang er ekki hægt að breyta' : 'Email cannot be changed'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">{locale === 'is' ? 'Hlutverk' : 'Role'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['CUSTOMER', 'OPERATOR', 'ADMIN'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role })}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1',
                          formData.role === role
                            ? role === 'ADMIN' ? 'border-purple-500 bg-purple-50'
                              : role === 'OPERATOR' ? 'border-blue-500 bg-blue-50'
                              : 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <span className={cn(
                          formData.role === role
                            ? role === 'ADMIN' ? 'text-purple-600'
                              : role === 'OPERATOR' ? 'text-blue-600'
                              : 'text-primary-600'
                            : 'text-slate-400'
                        )}>
                          {role === 'ADMIN' ? <Shield className="h-5 w-5" />
                            : role === 'OPERATOR' ? <Users className="h-5 w-5" />
                            : <User className="h-5 w-5" />}
                        </span>
                        <span className="text-xs font-medium text-slate-700">
                          {getRoleLabel(role)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">{locale === 'is' ? 'Sími' : 'Phone'}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="+354 xxx xxxx"
                  />
                </div>

                <div>
                  <label className="label">{locale === 'is' ? 'Kennitala' : 'National ID'}</label>
                  <input
                    type="text"
                    value={formData.kennitala}
                    onChange={(e) => setFormData({ ...formData, kennitala: e.target.value })}
                    className="input"
                    placeholder="000000-0000"
                  />
                </div>

                {/* PIN field - only for ADMIN and OPERATOR */}
                {(formData.role === 'ADMIN' || formData.role === 'OPERATOR') && (
                  <div>
                    <label className="label flex items-center gap-2 mb-3">
                      <Key className="h-4 w-4" />
                      {locale === 'is' ? 'PIN-númer' : 'PIN Code'}
                    </label>
                    <PinKeypad
                      value={formData.pin}
                      onChange={(pin) => setFormData({ ...formData, pin })}
                      locale={locale}
                    />
                    {editingUser && (
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        {locale === 'is' 
                          ? 'Skilja eftir auðt til að halda núverandi PIN' 
                          : 'Leave empty to keep current PIN'}
                      </p>
                    )}
                  </div>
                )}
              </div>
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
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
                disabled={isSaving || (!editingUser && !formData.email)}
              >
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingUser
                  ? locale === 'is' ? 'Vista' : 'Save'
                  : locale === 'is' ? 'Búa til' : 'Create'}
              </button>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
