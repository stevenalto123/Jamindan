import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import {
  PlusCircle, Trash2, Edit2, X, Upload, AlertTriangle,
  Megaphone, Newspaper, Layers, ChevronDown, ChevronUp, Clock, Search, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CATEGORIES = ['News', 'Announcements', 'Advisories'];

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

const ExpandableText = ({ text = '' }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 160;

  return (
    <div>
      <p style={{
        whiteSpace: 'pre-wrap',
        fontSize: '13px',
        color: 'var(--text-light)',
        lineHeight: '1.55',
        margin: '0 0 6px 0',
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
          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
  const [searchQuery, setSearchQuery] = useState('');

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
      const localFeed = res.data || [];

      let autoFeed = [];
      if (categoryFilter === 'All' || categoryFilter === 'News') {
        try {
          const rssUrl = 'https://news.google.com/rss/search?q=Capiz+OR+Panay+OR+Jamindan+AND+(typhoon+OR+earthquake+OR+disaster+OR+flood+OR+weather)&hl=en-PH&gl=PH&ceid=PH:en';
          const rssRes = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
          if (rssRes.data && rssRes.data.items) {
            autoFeed = rssRes.data.items.map(item => ({
              id: `auto-${item.guid || item.link}`,
              title: item.title,
              content: (item.description || '').replace(/<[^>]+>/g, ''),
              category: 'News',
              image_path: item.thumbnail || null,
              author_name: item.source || 'Regional News Feed',
              created_at: item.pubDate,
              is_auto: true,
              link: item.link
            }));
          }
        } catch (rssErr) {
          console.error('Failed to fetch automated news', rssErr);
        }
      }

      const combined = [...localFeed, ...autoFeed].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setFeed(combined);
    } catch (err) {
      console.error('Error fetching news feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();

    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.on('new-news', () => fetchFeed());
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
      case 'Advisories': return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', icon: AlertTriangle };
      case 'Announcements': return { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', icon: Megaphone };
      case 'News': return { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', icon: Newspaper };
      default: return { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748b', icon: Newspaper };
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

  const filteredFeed = feed.filter(item =>
    !searchQuery ||
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="content-body" style={{ maxWidth: '1140px', paddingBottom: '48px' }}>

      {/* ─── Unified Top Toolbar: Search + Category Filter + Publish ─── */}
      <div
        className="glass-card"
        style={{
          padding: '14px 16px',
          marginBottom: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: 'none'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search news, advisories, or announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 30px 8px 34px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              backgroundColor: 'var(--card-alt)',
              color: 'var(--text-main)',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          {['All', 'News', 'Announcements', 'Advisories'].map((cat) => {
            const Icon = getFilterIcon(cat);
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: active ? '700' : '600',
                  border: active ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  backgroundColor: active ? 'var(--primary-color)' : 'var(--card-alt)',
                  color: active ? '#fff' : 'var(--text-light)'
                }}
              >
                <Icon size={13} /> {cat}
              </button>
            );
          })}

          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={handleOpenCreateModal}
              style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}
            >
              <PlusCircle size={15} /> {t('addAnnouncement') || 'Publish'}
            </button>
          )}
        </div>
      </div>

      {/* ─── Feed Content ──────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('loadingBulletins') || 'Loading feed...'}</div>
      ) : filteredFeed.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: 'none' }}>
          <Newspaper size={36} color="var(--text-muted)" />
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '16px' }}>{t('noAnnouncements') || 'No updates right now'}</h3>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '13px' }}>Check back later for news and advisories.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredFeed.map((article) => {
            const style = getCategoryStyle(article.category);
            const CatIcon = style.icon;
            const hasImage = Boolean(article.image_path);

            return (
              <div
                key={article.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'none'
                }}
              >
                <div>
                  {/* Image Banner (Only rendered when an actual image exists) */}
                  {hasImage && (
                    <img
                      src={(article.is_auto || article.image_path.startsWith('http')) ? article.image_path : `${BACKEND_URL}${article.image_path}`}
                      alt={article.title}
                      style={{
                        width: '100%',
                        height: '170px',
                        objectFit: 'cover',
                        borderBottom: '1px solid var(--border-color)'
                      }}
                    />
                  )}

                  <div style={{ padding: '16px 18px 12px 18px' }}>
                    {/* Meta Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          backgroundColor: style.bg,
                          color: style.color,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CatIcon size={11} /> {article.category}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={new Date(article.created_at).toLocaleString()}>
                          <Clock size={11} /> {getRelativeTime(article.created_at)}
                        </span>
                      </div>

                      {isAdmin && !article.is_auto && (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button onClick={() => handleOpenEditModal(article)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(article.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '4px' }} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>

                    {/* Title & Body */}
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.35' }}>
                      {article.title}
                    </h3>

                    <ExpandableText text={article.content} />
                  </div>
                </div>

                {/* Footer */}
                <div style={{ margin: '0 18px', padding: '10px 0 14px 0', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {article.is_auto && (
                      <span style={{ backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-color)', color: 'var(--text-light)', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                        RSS
                      </span>
                    )}
                    <span>{t('by') || 'By'} {article.author_name}</span>
                  </div>
                  {article.is_auto && article.link && (
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary-color)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Source <ExternalLink size={12} />
                    </a>
                  )}
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
                  <textarea id="m-content" className="form-textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write details of news, advisory, or community bulletin..." required style={{ minHeight: '140px' }} />
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
