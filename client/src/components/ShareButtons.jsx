import { useState } from 'react';
import axios from 'axios';

export default function ShareButtons({ articleId, articleTitle, articleUrl }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (platform) => {
    try {
      await axios.post(`/api/reactions/article/${articleId}/share`, { platform });
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const shareUrls = {
    TWITTER: `https://twitter.com/intent/tweet?text=${encodeURIComponent(articleTitle)}&url=${encodeURIComponent(articleUrl)}`,
    FACEBOOK: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
    LINKEDIN: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
    REDDIT: `https://reddit.com/submit?url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(articleTitle)}`,
    WHATSAPP: `https://api.whatsapp.com/send?text=${encodeURIComponent(articleTitle + ' ' + articleUrl)}`
  };

  const handlePlatformClick = (platform) => {
    handleShare(platform);
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    setShowMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      await handleShare('COPY_LINK');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const handleEmail = () => {
    handleShare('EMAIL');
    window.location.href = `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent(articleUrl)}`;
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>Share</span>
      </button>

      {showMenu && (
        <div className="absolute top-12 right-0 bg-white border rounded-lg shadow-lg p-2 z-10 w-48">
          <button
            onClick={() => handlePlatformClick('TWITTER')}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center space-x-2"
          >
            <span>Twitter</span>
          </button>
          <button
            onClick={() => handlePlatformClick('FACEBOOK')}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center space-x-2"
          >
            <span>Facebook</span>
          </button>
          <button
            onClick={() => handlePlatformClick('LINKEDIN')}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center space-x-2"
          >
            <span>LinkedIn</span>
          </button>
          <button
            onClick={() => handlePlatformClick('REDDIT')}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center space-x-2"
          >
            <span>Reddit</span>
          </button>
          <button
            onClick={() => handlePlatformClick('WHATSAPP')}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center space-x-2"
          >
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleEmail}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center space-x-2"
          >
            <span>Email</span>
          </button>
          <div className="border-t my-2"></div>
          <button
            onClick={handleCopyLink}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center space-x-2"
          >
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      )}
    </div>
  );
}