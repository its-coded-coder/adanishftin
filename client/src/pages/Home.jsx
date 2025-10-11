import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { articles } from '../utils/api';
import { cacheArticles, getCachedArticles } from '../utils/db';
import { newsletter } from '../utils/api';
import { ContinueReading } from '../components/ContinueReading';

export default function Home() {
  const [articleList, setArticleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadArticles();
  }, [page, search, activeFilter]);

  const loadArticles = async () => {
    try {
      const cached = await getCachedArticles();
      if (cached.length > 0 && !search) {
        setArticleList(cached);
      }

      const params = { page, limit: 12, search };
      if (activeFilter === 'premium') params.isPremium = true;
      if (activeFilter === 'free') params.isPremium = false;

      const { data } = await articles.list(params);
      setArticleList(data.articles);
      setTotalPages(data.pagination.pages);
      if (!search) await cacheArticles(data.articles);
    } catch (error) {
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    try {
      await newsletter.subscribe({ email });
      setSubscribed(true);
      setEmail('');
      toast.success('Successfully subscribed to newsletter!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to subscribe');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-900 rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-gray-300 dark:bg-dark-700"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-300 dark:bg-dark-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-dark-700 rounded"></div>
                <div className="h-3 bg-gray-300 dark:bg-dark-700 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ContinueReading />

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Discover Articles
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore our collection of insightful articles
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          {['all', 'free', 'premium'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {articleList.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No articles found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {articleList.map((article) => (
            <Link
              key={article.id}
              to={`/article/${article.slug}`}
              className="bg-white dark:bg-dark-900 rounded-lg shadow-md overflow-hidden card-hover"
            >
              {article.coverImage && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  {article.isPremium && (
                    <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                      ${article.price}
                    </div>
                  )}
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    By {article.author.name}
                  </span>
                  <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                    {article.readingTime && (
                      <span>{article.readingTime} min</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mb-12">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Stay Updated</h2>
        <p className="mb-6 text-primary-100">Subscribe to get the latest articles delivered to your inbox</p>
        {subscribed ? (
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-300 font-medium">Successfully subscribed!</p>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button
              type="submit"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}