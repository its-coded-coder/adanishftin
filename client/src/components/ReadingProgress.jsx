import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ReadingProgress({ articleId }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    loadProgress();

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      
      setProgress(Math.min(100, Math.max(0, scrollPercent)));

      if (scrollPercent > 10) {
        debouncedSaveProgress(scrollPercent);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [articleId, user]);

  const loadProgress = async () => {
    try {
      const { data } = await api.get(`/progress/${articleId}`);
      setProgress(data.progress || 0);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const debouncedSaveProgress = useCallback((progressPercent) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.put(`/progress/${articleId}`, {
          progress: progressPercent
        });
      } catch (error) {
        if (error.response?.status !== 429) {
          console.error('Error saving progress:', error);
        }
      }
    }, 2000);
  }, [articleId]);

  if (!user) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 transition-all"
      style={{ width: `${progress}%` }}
    />
  );
}