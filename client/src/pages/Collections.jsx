import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

export function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const { data } = await axios.get('/api/collections');
      setCollections(data.collections);
    } catch (error) {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-900 rounded-xl shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-gray-300 dark:bg-dark-700"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-300 dark:bg-dark-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-dark-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Article Collections</h1>
        <p className="text-gray-600 dark:text-gray-400">Curated series of related articles</p>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No collections available</h3>
          <p className="text-gray-600 dark:text-gray-400">Check back later for curated article series</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.slug}`}
              className="bg-white dark:bg-dark-900 rounded-xl shadow-md overflow-hidden card-hover group"
            >
              {collection.coverImage && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={collection.coverImage}
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white text-sm font-medium">
                      {collection.articles.length} articles
                    </div>
                  </div>
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {collection.title}
                </h2>
                {collection.description && (
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-3">{collection.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}