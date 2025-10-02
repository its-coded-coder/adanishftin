import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [filter]);

  const loadComments = async () => {
    try {
      const approved = filter === 'approved' ? 'true' : filter === 'pending' ? 'false' : undefined;
      const { data } = await axios.get('/api/comments/all', {
        params: { approved, limit: 50 }
      });
      setComments(data.comments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`/api/comments/${id}/approve`);
      loadComments();
    } catch (error) {
      alert('Failed to approve comment');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await axios.delete(`/api/comments/${id}`);
      loadComments();
    } catch (error) {
      alert('Failed to delete comment');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Comment Moderation</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="all">All Comments</option>
        </select>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No comments to display
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-semibold">{comment.user?.name || comment.name}</span>
                  {comment.email && (
                    <span className="text-gray-500 text-sm ml-2">({comment.email})</span>
                  )}
                  <span className="text-gray-400 text-sm ml-3">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                  comment.approved 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {comment.approved ? 'Approved' : 'Pending'}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">
                  On article: <span className="font-medium">{comment.article?.title}</span>
                </p>
                <p className="text-gray-800">{comment.content}</p>
              </div>

              <div className="flex space-x-3">
                {!comment.approved && (
                  <button
                    onClick={() => handleApprove(comment.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
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