import { useEffect, useState } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { vpnAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Toast from '../components/UI/Toast';
import { FiBarChart2, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';

const VPNUsage = () => {
  const [usageData, setUsageData] = useState([]);
  const [appNameFilter, setAppNameFilter] = useState('');
  const [availableApps, setAvailableApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [sortBy, setSortBy] = useState('usage');

  useEffect(() => {
    fetchVPNUsage();
  }, [appNameFilter]);

  const fetchVPNUsage = async () => {
    try {
      setIsLoading(true);
      const response = await vpnAPI.getAllUsersUsage(appNameFilter || undefined);
      const data = response.data || [];

      const apps = new Set(data.map((u) => u.app_name || 'default'));
      setAvailableApps(Array.from(apps).sort());

      const sortedData = [...data].sort((a, b) => {
        if (sortBy === 'usage') return b.totalUsageMB - a.totalUsageMB;
        return a.userName.localeCompare(b.userName);
      });

      setUsageData(sortedData);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to load VPN usage data',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    const sorted = [...usageData].sort((a, b) => {
      if (newSort === 'usage') return b.totalUsageMB - a.totalUsageMB;
      return a.userName.localeCompare(b.userName);
    });
    setUsageData(sorted);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalUsage = usageData.reduce((sum, item) => sum + item.totalUsageMB, 0);
  const averageUsage = usageData.length > 0 ? totalUsage / usageData.length : 0;

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
            <h1 className="text-3xl font-bold text-gray-900">VPN Usage Monitoring</h1>
            <p className="mt-2 text-gray-600">Track and monitor VPN usage across all users</p>
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
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="usage">Sort by Usage</option>
              <option value="name">Sort by Name</option>
            </select>
            <button
              onClick={fetchVPNUsage}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{totalUsage.toFixed(2)} MB</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <FiBarChart2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Usage</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{averageUsage.toFixed(2)} MB</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <FiTrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {usageData.filter((u) => u.userStatus === 'active').length}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <FiBarChart2 className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Usage Table */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">App</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Usage / Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Usage Sessions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {usageData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No usage data available
                    </td>
                  </tr>
                ) : (
                  usageData.map((item) => {
                    const limit = item.usageLimit || 1024;
                    const limitLabel = item.usageLimitLabel || `${limit} MB`;
                    const usagePercentage = limit > 0 ? Math.min((item.totalUsageMB / limit) * 100, 100) : 0;
                    const remaining = Math.max(0, limit - item.totalUsageMB);

                    return (
                      <tr key={item.userId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.userName}</p>
                            <p className="text-sm text-gray-500">{item.userEmail}</p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            {item.app_name || 'default'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              item.userStatus === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.userStatus === 'active' ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-[200px]">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-700">
                                {item.totalUsageMB.toFixed(2)} MB / {limitLabel}
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
                          {item.usageCount}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(item.lastUsage)}
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AdminLayout>
  );
};

export default VPNUsage;
