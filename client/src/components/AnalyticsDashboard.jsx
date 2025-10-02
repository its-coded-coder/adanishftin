import { useState, useEffect } from 'react';
import axios from 'axios';

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
        axios.get('/api/analytics/revenue', { params: { startDate, endDate } }),
        axios.get('/api/analytics/readers', { params: { startDate, endDate } }),
        axios.get('/api/analytics/content', { params: { period: timeRange } }),
        axios.get('/api/analytics/realtime')
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
      const { data } = await axios.get('/api/analytics/realtime');
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
    return <div className="flex justify-center items-center h-screen">Loading analytics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {realtime && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Real-time Activity</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold text-blue-600">{realtime.activeReaders}</div>
              <div className="text-sm text-gray-600">Active Readers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{realtime.recentPurchases}</div>
              <div className="text-sm text-gray-600">Recent Purchases (5min)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{realtime.recentComments}</div>
              <div className="text-sm text-gray-600">Recent Comments (5min)</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {revenue && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-900">${revenue.totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-2">{revenue.totalTransactions} transactions</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Stripe Fees</h3>
              <p className="text-3xl font-bold text-gray-900">${revenue.totalFees.toFixed(2)}</p>
            </div>
          </>
        )}
        {readers && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Readers</h3>
              <p className="text-3xl font-bold text-gray-900">{readers.totalReaders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Returning Visitors</h3>
              <p className="text-3xl font-bold text-gray-900">{readers.returningVisitors}</p>
              <p className="text-sm text-gray-500 mt-2">{((readers.returningVisitors / readers.totalReaders) * 100).toFixed(1)}%</p>
            </div>
          </>
        )}
      </div>

      {content && content.topArticles && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Top Performing Articles</h2>
          <div className="space-y-4">
            {content.topArticles.map((article, idx) => (
              <div key={article.id} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-gray-400">{idx + 1}</span>
                  <div>
                    <h3 className="font-semibold">{article.title}</h3>
                    <p className="text-sm text-gray-500">By {article.author.name}</p>
                  </div>
                </div>
                <div className="flex space-x-6 text-sm">
                  <div>
                    <span className="text-gray-500">Views:</span> {article.views}
                  </div>
                  <div>
                    <span className="text-gray-500">Likes:</span> {article.likes}
                  </div>
                  <div>
                    <span className="text-gray-500">Comments:</span> {article._count.comments}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {revenue && revenue.byArticle && revenue.byArticle.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Revenue by Article</h2>
          <div className="space-y-3">
            {revenue.byArticle.slice(0, 10).map((item) => (
              <div key={item.articleId} className="flex justify-between items-center">
                <span className="text-sm">Article {item.articleId.substring(0, 8)}</span>
                <div className="flex space-x-4 text-sm">
                  <span className="text-gray-600">{item._count} sales</span>
                  <span className="font-semibold">${item._sum.netRevenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}