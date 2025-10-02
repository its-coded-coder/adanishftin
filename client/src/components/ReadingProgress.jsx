import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ReadingProgress({ articleId }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);

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
        saveProgress(scrollPercent);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [articleId, user]);

  const loadProgress = async () => {
    try {
      const { data } = await axios.get(`/api/progress/${articleId}`);
      setProgress(data.progress || 0);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async (progressPercent) => {
    try {
      await axios.put(`/api/progress/${articleId}`, {
        progress: progressPercent
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  if (!user) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 transition-all"
      style={{ width: `${progress}%` }}
    />
  );
}