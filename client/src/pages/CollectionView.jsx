import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function CollectionView() {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollection();
  }, [slug]);

  const loadCollection = async () => {
    try {
      const { data } = await axios.get(`/api/collections/${slug}`);
      setCollection(data);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!collection) {
    return <div className="text-center py-12">Collection not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        {collection.coverImage && (
          <img
            src={collection.coverImage}
            alt={collection.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{collection.title}</h1>
        {collection.description && (
          <p className="text-lg text-gray-600">{collection.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {collection.articles.sort((a, b) => a.order - b.order).map((item, idx) => (
          <Link
            key={item.article.id}
            to={`/article/${item.article.slug}`}
            className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
          >
            <div className="flex">
              <div className="flex-shrink-0 bg-blue-600 text-white w-16 flex items-center justify-center text-2xl font-bold">
                {idx + 1}
              </div>
              {item.article.coverImage && (
                <img
                  src={item.article.coverImage}
                  alt={item.article.title}
                  className="w-48 h-32 object-cover"
                />
              )}
              <div className="flex-1 p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {item.article.title}
                </h2>
                {item.article.excerpt && (
                  <p className="text-gray-600 mb-4">{item.article.excerpt}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>By {item.article.author.name}</span>
                  {item.article.readingTime && (
                    <span>{item.article.readingTime} min read</span>
                  )}
                  {item.article.isPremium && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      ${item.article.price}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}