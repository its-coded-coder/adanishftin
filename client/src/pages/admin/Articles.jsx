import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin, articles } from '../../utils/api';

export default function AdminArticles() {
  const [articleList, setArticleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadArticles();
  }, [filter]);

  const loadArticles = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const { data } = await admin.getArticles(params);
      setArticleList(data.articles);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await articles.updateStatus(id, status);
      loadArticles();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await articles.delete(id);
      loadArticles();
    } catch (error) {
      alert('Failed to delete article');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Articles</h1>
        <Link
          to="/admin/articles/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Article
        </Link>
      </div>

      <div className="mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          <option value="">All Articles</option>
          <option value="DRAFT">Draft</option>
          <option value="STAGING">Staging</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articleList.map((article) => (
              <tr key={article.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{article.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={article.status}
                    onChange={(e) => handleStatusChange(article.id, e.target.value)}
                    className="text-sm border-gray-300 rounded"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="STAGING">Staging</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {article.isPremium ? `$${article.price}` : 'Free'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <Link
                    to={`/admin/articles/edit/${article.slug}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}