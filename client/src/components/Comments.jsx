import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Comments({ articleId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async () => {
    try {
      const { data } = await axios.get(`/api/comments/article/${articleId}`);
      setComments(data.comments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await axios.post(`/api/comments/article/${articleId}`, {
        content: newComment
      });
      setNewComment('');
      toast.success('Comment posted');
      loadComments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to post comment');
    }
  };

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await axios.post(`/api/comments/article/${articleId}`, {
        content: replyContent,
        parentId
      });
      setReplyContent('');
      setReplyTo(null);
      toast.success('Reply posted');
      loadComments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to post reply');
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await axios.post(`/api/comments/${commentId}/like`);
      loadComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await axios.delete(`/api/comments/${commentId}`);
      toast.success('Comment deleted');
      loadComments();
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-gray-200 dark:border-dark-700 pt-8">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Comments ({comments.length})
      </h3>

      {user && (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="input-field min-h-[100px]"
            rows="4"
            placeholder="Write a comment..."
            required
          />
          <button
            type="submit"
            className="mt-3 btn-primary"
          >
            Post Comment
          </button>
        </form>
      )}

      {!user && (
        <div className="text-center py-8 bg-gray-50 dark:bg-dark-800 rounded-lg mb-8">
          <p className="text-gray-600 dark:text-gray-400">
            Please login to post comments
          </p>
        </div>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white dark:bg-dark-900 rounded-lg p-6 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {(comment.user?.name || comment.name)[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {comment.user?.name || comment.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {user && (user.id === comment.userId || user.role === 'ADMIN') && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-gray-800 dark:text-gray-200 mb-3">{comment.content}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span>Like ({comment._count.likedBy})</span>
                  </button>
                  {user && (
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      Reply
                    </button>
                  )}
                </div>

                {replyTo === comment.id && (
                  <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="input-field"
                      rows="2"
                      placeholder="Write a reply..."
                      required
                    />
                    <div className="mt-2 flex space-x-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                      >
                        Post Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyTo(null)}
                        className="px-4 py-2 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-dark-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 mt-4 space-y-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start space-x-3 border-l-2 border-gray-200 dark:border-dark-700 pl-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(reply.user?.name || reply.name)[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                {reply.user?.name || reply.name}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                                {new Date(reply.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {user && (user.id === reply.userId || user.role === 'ADMIN') && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 text-sm mb-2">{reply.content}</p>
                          <button
                            onClick={() => handleLikeComment(reply.id)}
                            className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-xs"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span>Like ({reply._count?.likedBy || 0})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}