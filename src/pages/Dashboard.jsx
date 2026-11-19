import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/Layout/AdminLayout';
import StatCard from '../components/Dashboard/StatCard';
import { FiCloud, FiUsers, FiBarChart2, FiShield } from 'react-icons/fi';
import { userAPI, vpnAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Toast from '../components/UI/Toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlockedUsers: 0,
    totalVPNUsage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, vpnResponse] = await Promise.all([
        userAPI.getAllUsers(),
        vpnAPI.getAllUsersUsage(),
      ]);

      const users = usersResponse.data || [];
      const blockedUsers = users.filter((user) => user.status === 'blocked').length;
      const totalUsage =
        vpnResponse.data?.reduce((sum, item) => sum + (item.totalUsageMB || 0), 0) || 0;

      setStats({
        totalUsers: users.length,
        totalBlockedUsers: blockedUsers,
        totalVPNUsage: totalUsage,
      });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to load dashboard data',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your VPN management system</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<FiUsers className="h-6 w-6" />}
            color="blue"
          />
          <StatCard
            title="Blocked Users"
            value={stats.totalBlockedUsers}
            icon={<FiShield className="h-6 w-6" />}
            color="red"
          />
          <StatCard
            title="Total VPN Usage"
            value={`${stats.totalVPNUsage.toFixed(2)} MB`}
            icon={<FiBarChart2 className="h-6 w-6" />}
            color="green"
          />
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Link
              to="/apps"
              className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:bg-gray-50"
            >
              <FiCloud className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <p className="font-medium text-gray-900">Register Apps</p>
            </Link>
            <Link
              to="/users"
              className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:bg-gray-50"
            >
              <FiUsers className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <p className="font-medium text-gray-900">Manage Users</p>
            </Link>
            <Link
              to="/vpn-usage"
              className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:bg-gray-50"
            >
              <FiBarChart2 className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <p className="font-medium text-gray-900">View VPN Usage</p>
            </Link>
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <FiShield className="mx-auto mb-2 h-8 w-8 text-red-600" />
              <p className="font-medium text-gray-900">Security Settings</p>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AdminLayout>
  );
};

export default Dashboard;
