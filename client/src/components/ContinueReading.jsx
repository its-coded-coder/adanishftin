import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';


export function ContinueReading() {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgress();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      const { data } = await api.get('/progress', { params: { limit: 5 } });
      setProgress(data.progress.filter(p => p.progress < 95));
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading || progress.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-dark-900 dark:to-dark-800 rounded-xl p-6 mb-8 border border-primary-100 dark:border-dark-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Continue Reading
      </h2>
      <div className="space-y-4">
        {progress.map((item) => (
          <Link
            key={item.id}
            to={`/article/${item.article.slug}`}
            className="block bg-white dark:bg-dark-900 rounded-lg shadow hover:shadow-md transition p-4"
          >
            <div className="flex items-center space-x-4">
              {item.article.coverImage && (
                <img
                  src={item.article.coverImage}
                  alt={item.article.title}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">{item.article.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">{item.article.excerpt}</p>
                <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(item.progress)}% complete</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}