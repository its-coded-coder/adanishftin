import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { articles, profile as profileAPI, payments } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Comments from '../components/Comments';
import ReactionButtons from '../components/ReactionButtons';
import ShareButtons from '../components/ShareButtons';
import RelatedArticles from '../components/RelatedArticles';
import ReadingProgress from '../components/ReadingProgress';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

function PaymentForm({ article, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

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
        setError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        await payments.confirm(paymentIntent.id);
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-white rounded border">
        <CardElement />
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
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
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      if (bookmarked) {
        await profileAPI.removeBookmark(article.id);
        setBookmarked(false);
      } else {
        await profileAPI.addBookmark(article.id);
        setBookmarked(true);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update bookmark');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!article) {
    return <div className="text-center py-12">Article not found</div>;
  }

  const articleUrl = window.location.href;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ReadingProgress articleId={article.id} />
      <article className="bg-white rounded-lg shadow-lg p-8">
        {article.coverImage && (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-96 object-cover rounded-lg mb-8"
          />
        )}

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>

        <div className="flex items-center justify-between mb-6 pb-6 border-b">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">By {article.author.name}</span>
            <span className="text-gray-400">
              {new Date(article.publishedAt).toLocaleDateString()}
            </span>
            {article.readingTime && (
              <span className="text-gray-400">{article.readingTime} min read</span>
            )}
          </div>
          {user && (
            <div className="flex space-x-2">
              <button
                onClick={toggleBookmark}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                {bookmarked ? 'Unbookmark' : 'Bookmark'}
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
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Abstract</h3>
            <p className="text-gray-700">{article.abstract}</p>
          </div>
        )}

        {article.keywords && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {article.keywords.split(',').map((keyword, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {keyword.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {article.locked ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Premium Content</h2>
            <p className="text-gray-600 mb-6">
              Purchase this article for ${article.price} to read the full content.
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
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Purchase Article
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Please login to purchase this article.</p>
            )}
          </div>
        ) : (
          <>
            <div
              className="prose max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <div className="border-t pt-6 mb-8">
              <ReactionButtons articleId={article.id} />
            </div>

            {article.citations && article.citations.length > 0 && (
              <div className="border-t pt-6 mb-8">
                <h3 className="text-xl font-bold mb-4">References</h3>
                <ol className="space-y-2">
                  {article.citations.map((citation, idx) => (
                    <li key={citation.id} className="text-sm text-gray-700">
                      {idx + 1}. {citation.authors}. {citation.title}. 
                      {citation.journal && ` ${citation.journal}.`}
                      {citation.year && ` ${citation.year}.`}
                      {citation.doi && (
                        <a 
                          href={`https://doi.org/${citation.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 ml-2"
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
      </article>
    </div>
  );
}