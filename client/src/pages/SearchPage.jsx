import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
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

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const handlePageChange = (page) => {
    setSearchParams({ q: filters.query, page });
    window.scrollTo(0, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Search Articles</h1>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="Search articles..."
            className="flex-1 input-field"
          />
          <button
            type="submit"
            className="btn-primary px-6 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
          </button>
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mt-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {showFilters && (
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6 space-y-6 sticky top-24">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Sort By</h3>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full input-field"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="popularity">Popularity</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Article Type</h3>
                <select
                  value={filters.isPremium}
                  onChange={(e) => handleFilterChange('isPremium', e.target.value)}
                  className="w-full input-field"
                >
                  <option value="">All Articles</option>
                  <option value="false">Free Only</option>
                  <option value="true">Premium Only</option>
                </select>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Price Range</h3>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-1/2 input-field"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-1/2 input-field"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-900 rounded-xl shadow-md overflow-hidden animate-pulse">
                  <div className="flex">
                    <div className="w-48 h-32 bg-gray-300 dark:bg-dark-700"></div>
                    <div className="flex-1 p-6 space-y-3">
                      <div className="h-4 bg-gray-300 dark:bg-dark-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-dark-700 rounded"></div>
                      <div className="h-3 bg-gray-300 dark:bg-dark-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-gray-600 dark:text-gray-400">
                Found {pagination?.total || 0} results
              </div>

              <div className="space-y-6">
                {results.map((article) => (
                  <Link
                    key={article.id}
                    to={`/article/${article.slug}`}
                    className="block bg-white dark:bg-dark-900 rounded-xl shadow-md overflow-hidden card-hover"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {article.coverImage && (
                        <div className="sm:w-48 h-48 sm:h-auto">
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {article.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                            <span>{article.author.name}</span>
                            {article._count && (
                              <>
                                <span>{article._count.comments} comments</span>
                                <span>{article._count.articleLikes} likes</span>
                              </>
                            )}
                          </div>
                          {article.isPremium && (
                            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-3 py-1 rounded-full font-medium">
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
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-700"
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