import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profile } from '../utils/api';
import { cacheBookmarks, getCachedBookmarks } from '../utils/db';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const cached = await getCachedBookmarks();
      if (cached.length > 0) {
        setBookmarks(cached);
      }

      const { data } = await profile.getBookmarks();
      setBookmarks(data.bookmarks);
      await cacheBookmarks(data.bookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookmarks</h1>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No bookmarks yet. Start bookmarking articles you like!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((article) => (
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
      )}
    </div>
  );
}