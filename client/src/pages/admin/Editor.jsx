import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import { articles } from '../../utils/api';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
  ]
};

export default function AdminEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    abstract: '',
    keywords: '',
    coverImage: '',
    price: 0,
    isPremium: false,
    tags: [],
    doi: '',
    readingTime: 0,
    language: 'en',
    featured: false
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      const { data } = await articles.get(id);
      setArticle(data);
      setFormData({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || '',
        abstract: data.abstract || '',
        keywords: data.keywords || '',
        coverImage: data.coverImage || '',
        price: data.price,
        isPremium: data.isPremium,
        tags: data.tags.map(t => t.name),
        doi: data.doi || '',
        readingTime: data.readingTime || 0,
        language: data.language || 'en',
        featured: data.featured || false
      });
    } catch (error) {
      alert('Failed to load article');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await articles.update(article.id, formData);
      } else {
        await articles.create(formData);
      }
      navigate('/admin/articles');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save article');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!article) {
      alert('Please save the article first before uploading media');
      return;
    }

    setUploading(true);
    try {
      const { data } = await articles.uploadMedia(article.id, file);
      const mediaUrl = data.url;
      
      if (file.type.startsWith('image/')) {
        setFormData({ ...formData, coverImage: mediaUrl });
      }
    } catch (error) {
      alert('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {id ? 'Edit Article' : 'Create New Article'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Excerpt
          </label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows="2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Abstract
          </label>
          <textarea
            value={formData.abstract}
            onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows="4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <ReactQuill
            theme="snow"
            value={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            modules={modules}
            className="bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Image URL"
            />
            <label className="bg-gray-200 px-4 py-2 rounded cursor-pointer hover:bg-gray-300">
              {uploading ? 'Uploading...' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                onChange={handleMediaUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DOI
            </label>
            <input
              type="text"
              value={formData.doi}
              onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="10.1234/example"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reading Time (minutes)
            </label>
            <input
              type="number"
              value={formData.readingTime}
              onChange={(e) => setFormData({ ...formData, readingTime: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Featured Article</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPremium}
                onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Premium Article</span>
            </label>
          </div>

          {formData.isPremium && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Add tag"
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Article' : 'Create Article'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="bg-gray-200 px-6 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}