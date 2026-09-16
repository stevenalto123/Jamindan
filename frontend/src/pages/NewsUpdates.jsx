import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { Radio, PlusCircle, Trash2, Edit2, X, Upload, AlertTriangle, Megaphone, Newspaper, Layers, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CATEGORIES = ['News', 'Announcements', 'Advisories'];

// Helper for relative time
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Expanded Text Component
const ExpandableText = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 150;
  
  return (
    <div>
      <p style={{ 
        whiteSpace: 'pre-wrap', 
        fontSize: '13px', 
        color: 'var(--text-light)', 
        lineHeight: '1.5',
        margin: '0 0 8px 0',
        display: expanded ? 'block' : '-webkit-box',
        WebkitLineClamp: expanded ? 'unset' : 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {text}
      </p>
      {isLong && (
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {expanded ? <>Read Less <ChevronUp size={12} /></> : <>Read More <ChevronDown size={12} /></>}
        </button>
      )}
    </div>
  );
};

const NewsUpdates = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
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

    // Listen for real-time news updates
    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    
    socket.on('new-news', () => {
      fetchFeed();
    });

    return () => socket.disconnect();
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
      case 'Advisories': return { backgroundColor: '#fdf2f2', color: '#c0392b', icon: AlertTriangle, border: '#c0392b' };
      case 'Announcements': return { backgroundColor: '#ebf5fb', color: '#2980b9', icon: Megaphone, border: 'transparent' };
      case 'News': return { backgroundColor: '#eaf5ee', color: '#2e7d32', icon: Newspaper, border: 'transparent' };
      default: return { backgroundColor: '#f4f5f4', color: '#7f8c8d', icon: Newspaper, border: 'transparent' };
    }
  };

  const getFilterIcon = (cat) => {
    switch (cat) {
      case 'Advisories': return AlertTriangle;
      case 'Announcements': return Megaphone;
      case 'News': return Newspaper;
      default: return Layers;
    }
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="content-body" style={{ maxWidth: '800px' }}>
      
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        
        {/* Category Tabs */}
        <div className="scroll-hide" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['All', 'News', 'Announcements', 'Advisories'].map((cat) => {
            const Icon = getFilterIcon(cat);
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                  padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                  backgroundColor: categoryFilter === cat ? 'var(--primary-color)' : 'var(--card-bg)',
                  color: categoryFilter === cat ? '#fff' : 'var(--text-light)',
                  boxShadow: categoryFilter === cat ? '0 4px 10px rgba(46,204,113,0.3)' : 'var(--shadow-sm)'
                }}
              >
                <Icon size={14} /> {cat}
              </button>
            )
          })}
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal} style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
            <PlusCircle size={16} /> <span className="hide-on-mobile">{t('addAnnouncement') || 'Publish'}</span>
          </button>
        )}
      </div>

      {/* Feed Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('loadingBulletins') || 'Loading feed...'}</div>
      ) : feed.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Newspaper size={48} color="var(--border-color)" />
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px' }}>{t('noAnnouncements') || 'No updates right now'}</h3>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>Check back later for news and advisories.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {feed.map((article, index) => {
            const isHero = index === 0 && categoryFilter === 'All'; // First item is hero card
            const style = getCategoryStyle(article.category);
            const CatIcon = style.icon;

            return (
              <div key={article.id} className="glass-card" style={{ 
                display: 'flex', 
                flexDirection: isHero ? 'column' : (window.innerWidth > 600 ? 'row' : 'column'),
                overflow: 'hidden',
                borderLeft: article.category === 'Advisories' ? `4px solid ${style.color}` : '1px solid var(--border-color)',
                position: 'relative'
              }}>
                
                {/* Image Section */}
                {article.image_path ? (
                  <img 
                    src={article.image_path.startsWith('http') ? article.image_path : `${BACKEND_URL}${article.image_path}`} 
                    alt={article.title} 
                    style={{ 
                      width: isHero ? '100%' : (window.innerWidth > 600 ? '200px' : '100%'), 
                      height: isHero ? '250px' : (window.innerWidth > 600 ? '100%' : '180px'),
                      objectFit: 'cover',
                      flexShrink: 0
                    }} 
                  />
                ) : (
                  <div style={{ 
                    width: isHero ? '100%' : (window.innerWidth > 600 ? '160px' : '100%'), 
                    height: isHero ? '180px' : (window.innerWidth > 600 ? '100%' : '140px'),
                    backgroundColor: '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, borderRight: isHero ? 'none' : '1px solid var(--border-color)', borderBottom: isHero ? '1px solid var(--border-color)' : 'none'
                  }}>
                    <Radio size={isHero ? 48 : 32} style={{ opacity: 0.2, color: 'var(--primary-color)' }} />
                  </div>
                )}

                {/* Content Section */}
                <div style={{ padding: isHero ? '24px' : '20px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  
                  {/* Meta Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        backgroundColor: style.backgroundColor, color: style.color, 
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <CatIcon size={12} /> {article.category}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }} title={new Date(article.created_at).toLocaleString()}>
                        <Clock size={12} /> {getRelativeTime(article.created_at)}
                      </span>
                    </div>

                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleOpenEditModal(article)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(article.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>

                  {/* Title & Body */}
                  <h3 style={{ margin: '0 0 10px 0', fontSize: isHero ? '22px' : '16px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.3' }}>
                    {article.title}
                  </h3>
                  
                  <div style={{ flex: 1 }}>
                    <ExpandableText text={article.content} />
                  </div>

                  {/* Footer */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {t('by') || 'Posted by'} {article.author_name}
                  </div>
                </div>
              </div>
            );
          })}
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
                  <input type="text" id="m-title" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter short, descriptive title" required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m-category">Category</label>
                  <select id="m-category" className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m-content">Content Body</label>
                  <textarea id="m-content" className="form-textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write details of news, advisory, or community bulletin..." required style={{ minHeight: '150px' }} />
                </div>

                <div className="form-group">
                  <label className="form-label">Attach Image (Optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '13px', padding: '8px 16px', height: '36px' }}>
                      <Upload size={14} /> {image ? 'Change Image' : 'Choose Image'}
                      <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    {image && <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{image.name}</span>}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitLoading} style={{ height: '36px' }}>Cancel</button>
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
