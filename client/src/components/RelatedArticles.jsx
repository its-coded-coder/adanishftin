import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export function RelatedArticles({ articleId }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelatedArticles();
  }, [articleId]);

  const loadRelatedArticles = async () => {
    try {
      const { data } = await api.get(`/related/article/${articleId}`);
      setArticles(data.articles);
    } catch (error) {
      console.error('Error loading related articles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || articles.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 border-t border-gray-200 dark:border-dark-700 pt-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">You May Also Like</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/article/${article.slug}`}
            className="bg-white dark:bg-dark-900 rounded-lg shadow-md overflow-hidden card-hover"
          >
            {article.coverImage && (
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{article.excerpt}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{article.author.name}</span>
                {article.isPremium && (
                  <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded text-xs font-medium">
                    ${article.price}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}