import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    tags: [],
    isPremium: '',
    sortBy: 'relevance',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    if (filters.query) {
      performSearch();
    }
  }, [filters, searchParams.get('page')]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = {
        query: filters.query,
        page: searchParams.get('page') || 1,
        limit: 20,
        sortBy: filters.sortBy
      };

      if (filters.tags.length > 0) params.tags = filters.tags;
      if (filters.isPremium !== '') params.isPremium = filters.isPremium;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const { data } = await axios.get('/api/search', { params });
      setResults(data.articles);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setSearchParams({ q: filters.query, page: 1 });
  };

  const handlePageChange = (page) => {
    setSearchParams({ q: filters.query, page });
    window.scrollTo(0, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search Results</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && performSearch()}
            placeholder="Search articles..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded"
          />
          <button
            onClick={performSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-4">Filters</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="popularity">Popularity</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Article Type</label>
                <select
                  value={filters.isPremium}
                  onChange={(e) => handleFilterChange('isPremium', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">All Articles</option>
                  <option value="false">Free Only</option>
                  <option value="true">Premium Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-1/2 px-3 py-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-1/2 px-3 py-2 border rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No results found for "{filters.query}"
            </div>
          ) : (
            <>
              <div className="mb-4 text-gray-600">
                Found {pagination.total} results
              </div>

              <div className="space-y-6">
                {results.map((article) => (
                  <Link
                    key={article.id}
                    to={`/article/${article.slug}`}
                    className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="flex">
                      {article.coverImage && (
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="w-48 h-32 object-cover"
                        />
                      )}
                      <div className="flex-1 p-4">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                          {article.title}
                        </h2>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4 text-gray-500">
                            <span>{article.author.name}</span>
                            <span>{article._count.comments} comments</span>
                            <span>{article._count.articleLikes} likes</span>
                          </div>
                          {article.isPremium && (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded">
                              ${article.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}