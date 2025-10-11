
export function CollectionView() {
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
      toast.error('Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-300 dark:bg-dark-800 rounded-xl mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-dark-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Collection not found</h2>
        <Link to="/collections" className="text-primary-600 dark:text-primary-400 hover:underline">
          Browse all collections
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        {collection.coverImage && (
          <div className="relative h-64 rounded-xl overflow-hidden mb-6">
            <img
              src={collection.coverImage}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-4xl font-bold text-white mb-2">{collection.title}</h1>
              <div className="text-white/90 text-lg">{collection.articles.length} articles in this collection</div>
            </div>
          </div>
        )}
        {!collection.coverImage && (
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{collection.title}</h1>
        )}
        {collection.description && (
          <p className="text-lg text-gray-600 dark:text-gray-400">{collection.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {collection.articles.sort((a, b) => a.order - b.order).map((item, idx) => (
          <Link
            key={item.article.id}
            to={`/article/${item.article.slug}`}
            className="block bg-white dark:bg-dark-900 rounded-xl shadow-md overflow-hidden card-hover"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="flex-shrink-0 bg-gradient-to-br from-primary-500 to-purple-600 text-white w-full sm:w-20 h-20 sm:h-auto flex items-center justify-center text-3xl font-bold">
                {idx + 1}
              </div>
              {item.article.coverImage && (
                <div className="w-full sm:w-64 h-48 sm:h-auto">
                  <img
                    src={item.article.coverImage}
                    alt={item.article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {item.article.title}
                </h2>
                {item.article.excerpt && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{item.article.excerpt}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>By {item.article.author.name}</span>
                  {item.article.readingTime && (
                    <span>{item.article.readingTime} min read</span>
                  )}
                  {item.article.isPremium && (
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-3 py-1 rounded-full font-medium">
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