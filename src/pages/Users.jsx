import { useEffect, useState } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { userAPI, vpnAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Toast from '../components/UI/Toast';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { FiShield, FiUnlock, FiRefreshCw, FiEdit2, FiX } from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [appNameFilter, setAppNameFilter] = useState('');
  const [availableApps, setAvailableApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    userId: null,
    action: null,
  });
  const [editLimitDialog, setEditLimitDialog] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    currentLimit: 1024,
    newLimit: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [appNameFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, vpnResponse] = await Promise.all([
        userAPI.getAllUsers(appNameFilter || undefined),
        vpnAPI.getAllUsersUsage(appNameFilter || undefined),
      ]);

      const usersData = usersResponse.data || [];
      const usageData = vpnResponse.data || [];

      const apps = new Set(usersData.map((u) => u.app_name || 'default'));
      setAvailableApps(Array.from(apps).sort());

      const usersWithUsage = usersData.map((user) => {
        const usage = usageData.find((u) => u.userId === user._id);
        return {
          ...user,
          totalUsageMB: usage?.totalUsageMB || 0,
          usageLimit: usage?.usageLimit || user.usageLimit || 1024,
          usageLimitLabel: usage?.usageLimitLabel || user.usageLimitLabel || null,
          app_name: user.app_name || 'default',
        };
      });

      setUsers(usersWithUsage);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to load users',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await userAPI.updateUserStatus(userId, newStatus);
      setToast({
        message: `User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
        type: 'success',
      });
      fetchUsers();
      setConfirmDialog({ isOpen: false, userId: null, action: null });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to update user status',
        type: 'error',
      });
    }
  };

  const openConfirmDialog = (userId, action) => {
    setConfirmDialog({ isOpen: true, userId, action });
  };

  const handleConfirm = () => {
    if (confirmDialog.userId && confirmDialog.action) {
      const newStatus = confirmDialog.action === 'block' ? 'blocked' : 'active';
      handleStatusChange(confirmDialog.userId, newStatus);
    }
  };

  const openEditLimitDialog = (user) => {
    setEditLimitDialog({
      isOpen: true,
      userId: user._id,
      userName: user.name,
      currentLimit: user.usageLimit || 1024,
      newLimit: (user.usageLimit || 1024).toString(),
    });
  };

  const handleUpdateUsageLimit = async () => {
    if (!editLimitDialog.userId) return;

    const newLimit = parseFloat(editLimitDialog.newLimit);
    if (isNaN(newLimit) || newLimit < 0) {
      setToast({ message: 'Please enter a valid usage limit (must be >= 0)', type: 'error' });
      return;
    }

    try {
      await userAPI.updateUserUsageLimit(editLimitDialog.userId, newLimit);
      setToast({ message: 'Usage limit updated successfully', type: 'success' });
      fetchUsers();
      setEditLimitDialog({ isOpen: false, userId: null, userName: '', currentLimit: 1024, newLimit: '' });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to update usage limit',
        type: 'error',
      });
    }
  };

  const getUsagePercentage = (usage, limit) => {
    if (limit === 0) return 0;
    return Math.min((usage / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="mt-2 text-gray-600">Manage user accounts and permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={appNameFilter}
              onChange={(e) => setAppNameFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Apps</option>
              {availableApps.map((app) => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-lg border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">App</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Usage / Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Usage Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const limit = user.usageLimit || 1024;
                    const limitLabel = user.usageLimitLabel || `${limit} MB`;
                    const usagePercentage = getUsagePercentage(user.totalUsageMB, limit);
                    const remaining = Math.max(0, limit - user.totalUsageMB);

                    return (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            {user.app_name || 'default'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              user.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.status === 'active' ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-[200px]">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-700">
                                {user.totalUsageMB.toFixed(2)} MB / {limitLabel}
                              </span>
                              <span className="text-gray-500">{usagePercentage.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                              <div
                                className={`h-full transition-all ${getUsageColor(usagePercentage)}`}
                                style={{ width: `${usagePercentage}%` }}
                              ></div>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {remaining.toFixed(2)} MB remaining
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{limitLabel}</span>
                            <button
                              onClick={() => openEditLimitDialog(user)}
                              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                              title="Edit usage limit"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {user.status === 'active' ? (
                              <button
                                onClick={() => openConfirmDialog(user._id, 'block')}
                                className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                              >
                                <FiShield className="h-4 w-4" />
                                Block
                              </button>
                            ) : (
                              <button
                                onClick={() => openConfirmDialog(user._id, 'unblock')}
                                className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100"
                              >
                                <FiUnlock className="h-4 w-4" />
                                Unblock
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.action === 'block' ? 'Block User' : 'Unblock User'}
        message={
          confirmDialog.action === 'block'
            ? 'Are you sure you want to block this user? They will not be able to log in.'
            : 'Are you sure you want to unblock this user? They will be able to log in again.'
        }
        confirmText={confirmDialog.action === 'block' ? 'Block User' : 'Unblock User'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, userId: null, action: null })}
        type="danger"
      />

      {editLimitDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Update Usage Limit</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Set usage limit for <span className="font-medium">{editLimitDialog.userName}</span>
                </p>
              </div>
              <button
                onClick={() =>
                  setEditLimitDialog({ isOpen: false, userId: null, userName: '', currentLimit: 1024, newLimit: '' })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">Usage Limit (MB)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={editLimitDialog.newLimit}
                onChange={(e) => setEditLimitDialog({ ...editLimitDialog, newLimit: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter usage limit in MB"
              />
              <p className="mt-2 text-xs text-gray-500">
                Current limit: {editLimitDialog.currentLimit} MB
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() =>
                  setEditLimitDialog({ isOpen: false, userId: null, userName: '', currentLimit: 1024, newLimit: '' })
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUsageLimit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Update Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AdminLayout>
  );
};

export default Users;
