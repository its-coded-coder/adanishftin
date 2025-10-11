
export function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    targetTags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subsRes, campaignsRes] = await Promise.all([
        newsletter.getSubscribers(),
        newsletter.getCampaigns()
      ]);
      setSubscribers(subsRes.data.subscribers);
      setCampaigns(campaignsRes.data.campaigns);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await newsletter.createCampaign(formData);
      toast.success('Campaign sent successfully!');
      setShowForm(false);
      setFormData({ subject: '', content: '', targetTags: [] });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.targetTags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        targetTags: [...formData.targetTags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      targetTags: formData.targetTags.filter(t => t !== tag)
    });
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Newsletter Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : 'Send Campaign'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Campaign</h2>
          <form onSubmit={handleSendCampaign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content
              </label>
              <ReactQuill
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                className="bg-white dark:bg-dark-800 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Tags (leave empty to send to all)
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-1 input-field"
                  placeholder="Add tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.targetTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="btn-primary disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Campaign'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Subscribers ({subscribers.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {subscribers.map((sub) => (
              <div key={sub.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-dark-700 last:border-0">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{sub.email}</div>
                  {sub.tags && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">Tags: {sub.tags}</div>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  sub.isActive 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-300'
                }`}>
                  {sub.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Campaigns</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border-b border-gray-200 dark:border-dark-700 pb-4 last:border-0">
                <h3 className="font-semibold text-gray-900 dark:text-white">{campaign.subject}</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Sent: {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : 'Not sent'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Recipients: {campaign.sentCount} | Opens: {campaign.openCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}