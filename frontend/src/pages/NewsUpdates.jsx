import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Radio, PlusCircle, Trash2, Edit2, X, Upload } from 'lucide-react';

const CATEGORIES = ['News', 'Announcements', 'Advisories'];

const NewsUpdates = () => {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal states for CRUD
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('News');
  const [image, setImage] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/news', {
        params: { category: categoryFilter }
      });
      setFeed(res.data);
    } catch (err) {
      console.error('Error fetching news feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [categoryFilter]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('News');
    setImage(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (article) => {
    setEditingId(article.id);
    setTitle(article.title);
    setContent(article.content);
    setCategory(article.category);
    setImage(null);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !category) return;

    setSubmitLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    if (image) {
      formData.append('image', image);
    }

    try {
      if (editingId) {
        await axios.put(`/api/news/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/news', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      fetchFeed();
    } catch (err) {
      console.error(err);
      alert('Failed to publish announcement.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await axios.delete(`/api/news/${id}`);
      fetchFeed();
    } catch (err) {
      console.error(err);
      alert('Failed to delete announcement.');
    }
  };

  const getCategoryStyle = (cat) => {
    switch (cat) {
      case 'Advisories': return { backgroundColor: '#fdf2f2', color: '#c0392b' };
      case 'Announcements': return { backgroundColor: '#ebf5fb', color: '#2980b9' };
      case 'News': return { backgroundColor: '#eaf5ee', color: '#2e7d32' };
      default: return {};
    }
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="content-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>News & Updates</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Stay informed with the latest updates</p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal} style={{ height: '40px' }}>
            <PlusCircle size={18} />
            Add Announcement
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="filter-tabs">
        {['All', 'News', 'Announcements', 'Advisories'].map((cat) => (
          <button
            key={cat}
            className={`filter-tab ${categoryFilter === cat ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="notif-empty">Loading bulletins...</div>
      ) : feed.length === 0 ? (
        <div className="notif-empty">No announcements posted in this category.</div>
      ) : (
        <div className="news-feed-list">
          {feed.map((article) => (
            <div key={article.id} className="news-list-card">
              {article.image_path ? (
                <img 
                  src={`http://localhost:5000${article.image_path}`} 
                  alt={article.title} 
                  className="news-list-thumb" 
                />
              ) : (
                <div className="news-list-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f0eb', color: '#3d7a50' }}>
                  <Radio size={36} style={{ opacity: 0.6 }} />
                </div>
              )}

              <div className="news-list-content">
                <div className="news-list-meta">
                  <span className="news-list-cat-badge" style={getCategoryStyle(article.category)}>
                    {article.category}
                  </span>
                  <span className="news-list-date">
                    {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="news-list-title">{article.title}</h3>
                <p className="news-list-excerpt">{article.content}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f4f5f4', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>By {article.author_name}</span>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="notif-btn" 
                        onClick={() => handleOpenEditModal(article)} 
                        title="Edit"
                        style={{ padding: '2px', color: 'var(--text-light)' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="notif-btn" 
                        onClick={() => handleDelete(article.id)} 
                        title="Delete"
                        style={{ padding: '2px', color: 'var(--danger-color)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Edit Announcement' : 'Publish New Announcement'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="m-title">Title</label>
                  <input
                    type="text"
                    id="m-title"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter short, descriptive title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m-category">Category</label>
                  <select
                    id="m-category"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m-content">Content Body</label>
                  <textarea
                    id="m-content"
                    className="form-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write details of news, advisory, or community bulletin..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Attach Image (Optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '13px', padding: '8px 16px', height: '36px' }}>
                      <Upload size={14} />
                      {image ? 'Change Image' : 'Choose Image'}
                      <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    {image && <span style={{ fontSize: '12px', fontWeight: '500' }}>{image.name}</span>}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitLoading} style={{ height: '36px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading} style={{ height: '36px' }}>
                  {submitLoading ? 'Saving...' : editingId ? 'Update Bulletin' : 'Publish Bulletin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsUpdates;
