import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ContinueReading() {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      const { data } = await axios.get('/api/progress', { params: { limit: 5 } });
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
    <div className="bg-blue-50 rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Continue Reading</h2>
      <div className="space-y-4">
        {progress.map((item) => (
          <Link
            key={item.id}
            to={`/article/${item.article.slug}`}
            className="block bg-white rounded-lg shadow hover:shadow-md transition p-4"
          >
            <div className="flex items-center space-x-4">
              {item.article.coverImage && (
                <img
                  src={item.article.coverImage}
                  alt={item.article.title}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{item.article.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">{item.article.excerpt}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{Math.round(item.progress)}% complete</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}