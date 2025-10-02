import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await admin.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Articles</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.articles.total}</p>
          <div className="mt-4 text-sm text-gray-600">
            <div>Draft: {stats.articles.draft}</div>
            <div>Staging: {stats.articles.staging}</div>
            <div>Published: {stats.articles.published}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Newsletter Subscribers</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.newsletter.active}</p>
          <div className="mt-4 text-sm text-gray-600">
            Total: {stats.newsletter.total}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">${stats.revenue.total.toFixed(2)}</p>
          <div className="mt-4 text-sm text-gray-600">
            Recent purchases: {stats.revenue.recentPurchases}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/articles"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Articles</h3>
          <p className="text-gray-600">Create, edit, and publish articles</p>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h3>
          <p className="text-gray-600">View and manage user accounts</p>
        </Link>

        <Link
          to="/admin/newsletter"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Newsletter</h3>
          <p className="text-gray-600">Manage subscribers and send campaigns</p>
        </Link>
      </div>
    </div>
  );
}