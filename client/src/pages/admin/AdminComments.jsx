import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { newsletter } from '../../utils/api';

export function AdminComments() {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [filter]);

  const loadComments = async () => {
    try {
      const approved = filter === 'approved' ? 'true' : filter === 'pending' ? 'false' : undefined;
      const { data } = await api.get('/comments/all', {
        params: { approved, limit: 50 }
      });
      setComments(data.comments);
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/comments/${id}/approve`);
      toast.success('Comment approved');
      loadComments();
    } catch (error) {
      toast.error('Failed to approve comment');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${id}`);
      toast.success('Comment deleted');
      loadComments();
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Comment Moderation</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
        >
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="all">All Comments</option>
        </select>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No comments to display
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {(comment.user?.name || comment.name)[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {comment.user?.name || comment.name}
                    </div>
                    {comment.email && (
                      <div className="text-gray-500 dark:text-gray-400 text-sm">{comment.email}</div>
                    )}
                    <div className="text-gray-400 dark:text-gray-500 text-xs">
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  comment.approved 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                }`}>
                  {comment.approved ? 'Approved' : 'Pending'}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  On article: <span className="font-medium text-gray-900 dark:text-white">{comment.article?.title}</span>
                </p>
                <p className="text-gray-800 dark:text-gray-200">{comment.content}</p>
              </div>

              <div className="flex space-x-3">
                {!comment.approved && (
                  <button
                    onClick={() => handleApprove(comment.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}