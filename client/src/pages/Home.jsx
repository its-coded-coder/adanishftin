import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articles } from '../utils/api';
import { cacheArticles, getCachedArticles } from '../utils/db';
import { newsletter } from '../utils/api';
import ContinueReading from '../components/ContinueReading';

export default function Home() {
  const [articleList, setArticleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [page, search]);

  const loadArticles = async () => {
    try {
      const cached = await getCachedArticles();
      if (cached.length > 0) {
        setArticleList(cached);
      }

      const { data } = await articles.list({ page, limit: 12, search });
      setArticleList(data.articles);
      setTotalPages(data.pagination.pages);
      await cacheArticles(data.articles);
    } catch (error) {
      console.error('Error loading articles:', error);
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
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to subscribe');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ContinueReading />

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Latest Articles</h1>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {articleList.map((article) => (
          <Link
            key={article.id}
            to={`/article/${article.slug}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
          >
            {article.coverImage && (
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h2>
              <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">By {article.author.name}</span>
                {article.isPremium && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                    ${article.price}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center space-x-2 mb-12">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="bg-gray-800 text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Subscribe to Newsletter</h2>
        {subscribed ? (
          <p className="text-green-400">Successfully subscribed!</p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex space-x-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-2 rounded text-gray-900"
            />
            <button
              type="submit"
              className="bg-white text-gray-800 px-6 py-2 rounded font-semibold hover:bg-gray-100"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}