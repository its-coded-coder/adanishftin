import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Collections() {
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
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Article Collections</h1>

      {collections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No collections available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.slug}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              {collection.coverImage && (
                <img
                  src={collection.coverImage}
                  alt={collection.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {collection.title}
                </h2>
                {collection.description && (
                  <p className="text-gray-600 mb-4">{collection.description}</p>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <span>{collection.articles.length} articles</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}