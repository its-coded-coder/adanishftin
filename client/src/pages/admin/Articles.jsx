import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { admin, articles } from '../../utils/api';

export default function AdminArticles() {
  const [articleList, setArticleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedArticles, setSelectedArticles] = useState([]);

  useEffect(() => {
    loadArticles();
  }, [filter]);

  const loadArticles = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const { data } = await admin.getArticles(params);
      setArticleList(data.articles);
    } catch (error) {
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await articles.updateStatus(id, status);
      toast.success('Status updated successfully');
      loadArticles();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await articles.delete(id);
      toast.success('Article deleted successfully');
      loadArticles();
    } catch (error) {
      toast.error('Failed to delete article');
    }
  };

  const toggleSelectArticle = (id) => {
    setSelectedArticles(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedArticles.length === 0) {
      toast.error('No articles selected');
      return;
    }

    if (!confirm(`${action} ${selectedArticles.length} articles?`)) return;

    try {
      await Promise.all(
        selectedArticles.map(id => {
          if (action === 'Delete') return articles.delete(id);
          return articles.updateStatus(id, action.toUpperCase());
        })
      );
      toast.success(`${action} completed successfully`);
      setSelectedArticles([]);
      loadArticles();
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} articles`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Articles</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{articleList.length} total articles</p>
        </div>
        <Link
          to="/admin/articles/new"
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Article</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Articles</option>
          <option value="DRAFT">Draft</option>
          <option value="STAGING">Staging</option>
          <option value="PUBLISHED">Published</option>
        </select>

        {selectedArticles.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedArticles.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('Publish')}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Publish
            </button>
            <button
              onClick={() => handleBulkAction('Draft')}
              className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
            >
              Draft
            </button>
            <button
              onClick={() => handleBulkAction('Delete')}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedArticles.length === articleList.length && articleList.length > 0}
                    onChange={(e) => setSelectedArticles(e.target.checked ? articleList.map(a => a.id) : [])}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-900 divide-y divide-gray-200 dark:divide-dark-700">
              {articleList.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => toggleSelectArticle(article.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {article.coverImage && (
                        <img
                          src={article.coverImage}
                          alt=""
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {article.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          By {article.author.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={article.status}
                      onChange={(e) => handleStatusChange(article.id, e.target.value)}
                      className={`text-sm border-0 rounded-full px-3 py-1 font-medium ${
                        article.status === 'PUBLISHED'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : article.status === 'STAGING'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                      }`}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="STAGING">Staging</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {article.isPremium ? (
                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded text-xs font-medium">
                          Premium ${article.price}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Free</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <Link
                      to={`/admin/articles/edit/${article.slug}`}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/article/${article.slug}`}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
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
    </div>
  );
}