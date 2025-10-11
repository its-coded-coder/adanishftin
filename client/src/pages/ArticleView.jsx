import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { articles, profile as profileAPI, payments } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Comments from '../components/Comments';
import { ReactionButtons } from '../components/ReactionButtons';
import { ShareButtons } from '../components/ShareButtons';
import { RelatedArticles } from '../components/RelatedArticles';
import { ReadingProgress } from '../components/ReadingProgress';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

function PaymentForm({ article, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const { data } = await payments.createIntent(article.id);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)
          }
        }
      );

      if (stripeError) {
        toast.error(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        await payments.confirm(paymentIntent.id);
        toast.success('Payment successful!');
        onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: 'var(--text-primary)',
              '::placeholder': {
                color: '#9ca3af',
              },
            },
          },
        }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {processing ? 'Processing...' : `Pay $${article.price}`}
      </button>
    </form>
  );
}

export default function ArticleView() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      const { data } = await articles.get(slug);
      setArticle(data);

      if (user) {
        const { data: bookmarks } = await profileAPI.getBookmarks();
        setBookmarked(bookmarks.bookmarks.some(b => b.id === data.id));
      }
    } catch (error) {
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      if (bookmarked) {
        await profileAPI.removeBookmark(article.id);
        setBookmarked(false);
        toast.success('Removed from bookmarks');
      } else {
        await profileAPI.addBookmark(article.id);
        setBookmarked(true);
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      if (error.response?.data?.error === 'Article already bookmarked') {
        setBookmarked(true);
      } else if (error.response?.data?.error === 'Bookmark not found') {
        setBookmarked(false);
      } else {
        toast.error('Failed to update bookmark');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-300 dark:bg-dark-800 rounded-lg mb-8"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-300 dark:bg-dark-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-dark-800 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-dark-800 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article not found</h2>
        <p className="text-gray-600 dark:text-gray-400">The article you're looking for doesn't exist</p>
      </div>
    );
  }

  const articleUrl = window.location.href;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ReadingProgress articleId={article.id} />
      
      <article className="bg-white dark:bg-dark-900 rounded-xl shadow-lg overflow-hidden">
        {article.coverImage && (
          <div className="relative h-96 overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-4xl font-bold text-white mb-4">{article.title}</h1>
            </div>
          </div>
        )}

        <div className="p-8">
          {!article.coverImage && (
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">{article.title}</h1>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {article.author.name[0]}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{article.author.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(article.publishedAt).toLocaleDateString()} • {article.readingTime} min read
                </div>
              </div>
            </div>
            {user && (
              <div className="flex space-x-2">
                <button
                  onClick={toggleBookmark}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    bookmarked
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-gray-300 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <ShareButtons 
                  articleId={article.id}
                  articleTitle={article.title}
                  articleUrl={articleUrl}
                />
              </div>
            )}
          </div>

          {article.abstract && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-6 rounded-r-lg mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Abstract</h3>
              <p className="text-gray-700 dark:text-gray-300">{article.abstract}</p>
            </div>
          )}

          {article.keywords && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {article.keywords.split(',').map((keyword, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {article.locked ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Premium Content</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Unlock this article for ${article.price} to access the full content.
              </p>
              {user ? (
                <div className="max-w-md mx-auto">
                  {showPayment ? (
                    <Elements stripe={stripePromise}>
                      <PaymentForm article={article} onSuccess={loadArticle} />
                    </Elements>
                  ) : (
                    <button
                      onClick={() => setShowPayment(true)}
                      className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Purchase Article
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">Please login to purchase this article.</p>
              )}
            </div>
          ) : (
            <>
              <div
                className="prose prose-lg dark:prose-invert max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              <div className="border-t border-gray-200 dark:border-dark-700 pt-6 mb-8">
                <ReactionButtons articleId={article.id} />
              </div>

              {article.citations && article.citations.length > 0 && (
                <div className="border-t border-gray-200 dark:border-dark-700 pt-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">References</h3>
                  <ol className="space-y-2 text-sm">
                    {article.citations.map((citation, idx) => (
                      <li key={citation.id} className="text-gray-700 dark:text-gray-300">
                        {idx + 1}. {citation.authors}. {citation.title}. 
                        {citation.journal && ` ${citation.journal}.`}
                        {citation.year && ` ${citation.year}.`}
                        {citation.doi && (
                          <a 
                            href={`https://doi.org/${citation.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 ml-2 hover:underline"
                          >
                            DOI: {citation.doi}
                          </a>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <Comments articleId={article.id} />

              <RelatedArticles articleId={article.id} />
            </>
          )}
        </div>
      </article>
    </div>
  );
}