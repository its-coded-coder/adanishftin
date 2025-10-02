import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ReactionButtons({ articleId }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [reactions, setReactions] = useState({});
  const [selectedReaction, setSelectedReaction] = useState(null);

  useEffect(() => {
    loadReactions();
  }, [articleId]);

  const loadReactions = async () => {
    try {
      const { data } = await axios.get(`/api/reactions/article/${articleId}/reactions`);
      setReactions(data);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const handleLike = async () => {
    try {
      const { data } = await axios.post(`/api/reactions/article/${articleId}/like`);
      setLiked(data.liked);
      setLikes(data.likes);
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  const handleReact = async (type) => {
    try {
      const { data } = await axios.post(`/api/reactions/article/${articleId}/react`, { type });
      if (data.reacted) {
        setSelectedReaction(type);
      } else {
        setSelectedReaction(null);
      }
      loadReactions();
    } catch (error) {
      console.error('Error reacting to article:', error);
    }
  };

  const reactionTypes = [
    { type: 'LIKE', emoji: '👍', label: 'Like' },
    { type: 'LOVE', emoji: '❤️', label: 'Love' },
    { type: 'INSIGHTFUL', emoji: '💡', label: 'Insightful' },
    { type: 'INTERESTING', emoji: '🤔', label: 'Interesting' },
    { type: 'HELPFUL', emoji: '🙌', label: 'Helpful' }
  ];

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLike}
          className={`px-4 py-2 rounded border ${
            liked ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'
          }`}
        >
          👍 Like {likes > 0 && `(${likes})`}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {reactionTypes.map(({ type, emoji, label }) => (
          <button
            key={type}
            onClick={() => handleReact(type)}
            className={`px-3 py-2 rounded border flex items-center space-x-2 ${
              selectedReaction === type ? 'bg-blue-100 border-blue-500' : 'bg-white'
            }`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
            {reactions[type] > 0 && (
              <span className="text-sm text-gray-600">({reactions[type]})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}