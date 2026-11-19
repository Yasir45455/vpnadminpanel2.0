import { useEffect, useState } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Toast from '../components/UI/Toast';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { appBackendAPI } from '../services/api';
import { FiCloud, FiEdit2, FiRefreshCw, FiTrash2, FiWifi } from 'react-icons/fi';

const emptyForm = {
  app_name: '',
  label: '',
  base_url: '',
  service_key: '',
};

const Apps = () => {
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingApp, setEditingApp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setIsLoading(true);
      const response = await appBackendAPI.getAll();
      setApps(response.data || []);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to load apps',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingApp(null);
  };

  const startEdit = (app) => {
    setEditingApp(app.app_name);
    setForm({
      app_name: app.app_name,
      label: app.label,
      base_url: app.base_url,
      service_key: '',
    });
  };

  const saveApp = async (event) => {
    event.preventDefault();
    const payload = {
      app_name: form.app_name.trim().toLowerCase(),
      label: form.label.trim(),
      base_url: form.base_url.trim(),
      service_key: form.service_key.trim(),
    };
    if (!payload.app_name || !payload.label || !payload.base_url) {
      setToast({ message: 'App name, label, and base URL are required', type: 'error' });
      return;
    }
    if (!editingApp && !payload.service_key) {
      setToast({ message: 'Service key is required for new apps', type: 'error' });
      return;
    }

    try {
      setIsSaving(true);
      if (editingApp) {
        await appBackendAPI.update(editingApp, {
          label: payload.label,
          base_url: payload.base_url,
          ...(payload.service_key ? { service_key: payload.service_key } : {}),
        });
        setToast({ message: 'App backend updated successfully', type: 'success' });
      } else {
        await appBackendAPI.create(payload);
        setToast({ message: 'App backend registered successfully', type: 'success' });
      }
      resetForm();
      fetchApps();
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to save app backend',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testApp = async (appName) => {
    try {
      const response = await appBackendAPI.test(appName);
      const users = response.data?.users ?? 0;
      const usageRows = response.data?.usageRows ?? 0;
      setToast({
        message: `Connection OK. Users: ${users}, usage rows: ${usageRows}`,
        type: 'success',
      });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Connection test failed',
        type: 'error',
      });
    }
  };

  const removeApp = async () => {
    if (!confirmRemove) return;
    try {
      await appBackendAPI.remove(confirmRemove.app_name);
      setToast({ message: 'App backend removed successfully', type: 'success' });
      setConfirmRemove(null);
      fetchApps();
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to remove app backend',
        type: 'error',
      });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Apps</h1>
            <p className="mt-2 text-gray-600">
              Register external VPN app backends for central monitoring.
            </p>
          </div>
          <button
            onClick={fetchApps}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <form onSubmit={saveApp} className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <FiCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingApp ? 'Edit App Backend' : 'Register App Backend'}
              </h2>
              <p className="text-sm text-gray-500">
                Enter the app backend base URL only. The admin server adds the
                VPN admin endpoint automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">App Name</label>
              <input
                value={form.app_name}
                onChange={(event) => updateForm('app_name', event.target.value)}
                disabled={Boolean(editingApp)}
                placeholder="secure_vpn"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Display Label</label>
              <input
                value={form.label}
                onChange={(event) => updateForm('label', event.target.value)}
                placeholder="Secure VPN"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">Backend Base URL</label>
              <input
                value={form.base_url}
                onChange={(event) => updateForm('base_url', event.target.value)}
                placeholder="https://hypervpnbackend.oxmite.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Service Key {editingApp ? '(leave blank to keep existing)' : ''}
              </label>
              <input
                value={form.service_key}
                onChange={(event) => updateForm('service_key', event.target.value)}
                type="password"
                placeholder="Must match the app backend INTERNAL_SERVICE_KEY"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            {editingApp && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : editingApp ? 'Update App' : 'Register App'}
            </button>
          </div>
        </form>

        <div className="rounded-lg border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">App</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Base URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No app backends registered
                    </td>
                  </tr>
                ) : (
                  apps.map((app) => (
                    <tr key={app.app_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{app.label}</p>
                        <p className="text-xs text-gray-500">{app.app_name}</p>
                      </td>
                      <td className="max-w-xl px-6 py-4 text-sm text-gray-600">
                        <span className="break-all">{app.base_url}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                          {app.readonly ? 'Env' : 'Database'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => testApp(app.app_name)}
                            className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100"
                          >
                            <FiWifi className="h-4 w-4" />
                            Test
                          </button>
                          {!app.readonly && (
                            <>
                              <button
                                onClick={() => startEdit(app)}
                                className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                              >
                                <FiEdit2 className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => setConfirmRemove(app)}
                                className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                              >
                                <FiTrash2 className="h-4 w-4" />
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmRemove)}
        title="Remove App Backend"
        message={`Remove ${confirmRemove?.label || 'this app'} from the central dashboard? Existing app users are not deleted from their own backend.`}
        confirmText="Remove"
        onConfirm={removeApp}
        onCancel={() => setConfirmRemove(null)}
        type="danger"
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AdminLayout>
  );
};

export default Apps;
