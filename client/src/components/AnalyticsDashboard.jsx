import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const [revenue, setRevenue] = useState(null);
  const [readers, setReaders] = useState(null);
  const [content, setContent] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadRealtime, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const startDate = getStartDate(timeRange);
      const endDate = new Date();

      const [revenueRes, readersRes, contentRes, realtimeRes] = await Promise.all([
        api.get('/analytics/revenue', { params: { startDate, endDate } }),
        api.get('/analytics/readers', { params: { startDate, endDate } }),
        api.get('/analytics/content', { params: { period: timeRange } }),
        api.get('/analytics/realtime')
      ]);

      setRevenue(revenueRes.data);
      setReaders(readersRes.data);
      setContent(contentRes.data);
      setRealtime(realtimeRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealtime = async () => {
    try {
      const { data } = await api.get('/analytics/realtime');
      setRealtime(data);
    } catch (error) {
      console.error('Error loading realtime data:', error);
    }
  };

  const getStartDate = (range) => {
    const date = new Date();
    switch (range) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date.toISOString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const revenueByArticle = revenue?.byArticle?.slice(0, 10).map((item, index) => ({
    name: `Article ${index + 1}`,
    revenue: item._sum.netRevenue,
    sales: item._count
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive platform insights</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {realtime && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-bold">Real-time Activity</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-4xl font-bold">{realtime.activeReaders}</div>
                <div className="text-blue-100 mt-1">Active Readers</div>
              </div>
              <div>
                <div className="text-4xl font-bold">{realtime.recentPurchases}</div>
                <div className="text-blue-100 mt-1">Purchases (5min)</div>
              </div>
              <div>
                <div className="text-4xl font-bold">{realtime.recentComments}</div>
                <div className="text-blue-100 mt-1">Comments (5min)</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {revenue && (
            <>
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">${revenue.totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{revenue.totalTransactions} transactions</p>
              </div>
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Revenue</h3>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">${(revenue.totalRevenue - revenue.totalFees).toFixed(2)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">After ${revenue.totalFees.toFixed(2)} fees</p>
              </div>
            </>
          )}
          {readers && (
            <>
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Readers</h3>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{readers.totalReaders}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Unique visitors</p>
              </div>
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Returning</h3>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{readers.returningVisitors}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{((readers.returningVisitors / readers.totalReaders) * 100).toFixed(1)}% return rate</p>
              </div>
            </>
          )}
        </div>

        {revenueByArticle.length > 0 && (
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Revenue by Article</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={revenueByArticle}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-primary)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem'
                  }} 
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                <Bar dataKey="sales" fill="#8b5cf6" name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {content && content.topArticles && (
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Top Performing Articles</h2>
            <div className="space-y-4">
              {content.topArticles.map((article, idx) => (
                <div key={article.id} className="flex items-center justify-between border-b border-gray-200 dark:border-dark-700 pb-4 last:border-0">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{article.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">By {article.author.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm ml-4">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">{article.views || 0}</div>
                      <div className="text-gray-500 dark:text-gray-400">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">{article.likes || 0}</div>
                      <div className="text-gray-500 dark:text-gray-400">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">{article._count.comments}</div>
                      <div className="text-gray-500 dark:text-gray-400">Comments</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}