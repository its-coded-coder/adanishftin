import { useState, useEffect } from 'react';
import axios from 'axios';

export function ReactionButtons({ articleId }) {
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
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLike}
          className={`px-6 py-3 rounded-lg border-2 transition-all font-medium ${
            liked 
              ? 'bg-primary-600 border-primary-600 text-white' 
              : 'bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:border-primary-500'
          }`}
        >
          <span className="mr-2">👍</span>
          Like {likes > 0 && `(${likes})`}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {reactionTypes.map(({ type, emoji, label }) => (
          <button
            key={type}
            onClick={() => handleReact(type)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedReaction === type 
                ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-400' 
                : 'bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-dark-500'
            }`}
          >
            <span className="mr-2">{emoji}</span>
            <span className="text-sm">{label}</span>
            {reactions[type] > 0 && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({reactions[type]})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}