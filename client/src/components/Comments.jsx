import { useState, useEffect } from 'react';
import axios from 'axios';
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
      loadComments();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to post comment');
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
      loadComments();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to post reply');
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
      loadComments();
    } catch (error) {
      alert('Failed to delete comment');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading comments...</div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-4">Comments ({comments.length})</h3>

      {user && (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows="3"
            placeholder="Write a comment..."
            required
          />
          <button
            type="submit"
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Post Comment
          </button>
        </form>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b pb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold">{comment.user?.name || comment.name}</span>
                <span className="text-gray-500 text-sm ml-2">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              {user && (user.id === comment.userId || user.role === 'ADMIN') && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-red-600 text-sm"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-gray-800 mb-2">{comment.content}</p>
            <div className="flex space-x-4 text-sm">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className="text-gray-600 hover:text-blue-600"
              >
                Like ({comment._count.likedBy})
              </button>
              {user && (
                <button
                  onClick={() => setReplyTo(comment.id)}
                  className="text-gray-600 hover:text-blue-600"
                >
                  Reply
                </button>
              )}
            </div>

            {replyTo === comment.id && (
              <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4 ml-8">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                  placeholder="Write a reply..."
                  required
                />
                <div className="mt-2 space-x-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Post Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="bg-gray-200 px-4 py-1 rounded text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-8 mt-4 space-y-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold">{reply.user?.name || reply.name}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {user && (user.id === reply.userId || user.role === 'ADMIN') && (
                        <button
                          onClick={() => handleDeleteComment(reply.id)}
                          className="text-red-600 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-800 mb-2">{reply.content}</p>
                    <button
                      onClick={() => handleLikeComment(reply.id)}
                      className="text-gray-600 hover:text-blue-600 text-sm"
                    >
                      Like ({reply._count?.likedBy || 0})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {!user && (
        <p className="text-center text-gray-500 mt-4">
          Please login to post comments.
        </p>
      )}
    </div>
  );
}