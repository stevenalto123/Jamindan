import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare } from 'lucide-react';

const IncidentChat = ({ incidentId, incidentStatus }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // 1. Fetch Chat History
    const fetchChatHistory = async () => {
      try {
        const res = await axios.get(`/api/incidents/${incidentId}/chat`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      }
    };
    fetchChatHistory();

    // 2. Initialize Socket.io
    const socketUrl = axios.defaults.baseURL || '';
    socketRef.current = io(socketUrl, { transports: ['websocket', 'polling'] });
    
    // Join the specific incident room
    socketRef.current.emit('join-incident-room', incidentId);

    // Listen for new messages
    socketRef.current.on('new-chat-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [incidentId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || incidentStatus === 'Resolved') return;

    setSending(true);
    try {
      await axios.post(`/api/incidents/${incidentId}/chat`, { message: newMessage });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px', padding: 0, overflow: 'hidden' }}>
      {/* Chat Header */}
      <div style={{ padding: '15px 20px', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MessageSquare size={20} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Live Incident Chat</h3>
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
            No messages yet. Send a message to the Command Center or Responders.
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px', marginLeft: '5px', marginRight: '5px' }}>
                  {isMe ? 'You' : `${msg.full_name} (${msg.role})`}
                </span>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: isMe ? 'var(--primary-color)' : 'var(--card-alt)',
                  color: isMe ? 'white' : 'var(--text-main)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {msg.message}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '5px', marginRight: '5px' }}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Box */}
      {incidentStatus !== 'Resolved' ? (
        <div style={{ padding: '15px', backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-color)' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              style={{
                flex: 1,
                padding: '12px 15px',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: newMessage.trim() ? 'var(--primary-color)' : 'var(--border-color)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s'
              }}
            >
              <Send size={18} style={{ marginLeft: '2px' }} />
            </button>
          </form>
        </div>
      ) : (
        <div style={{ padding: '15px', backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          This incident is resolved. Chat is closed.
        </div>
      )}
    </div>
  );
};

export default IncidentChat;
