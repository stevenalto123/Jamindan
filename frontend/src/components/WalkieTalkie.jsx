import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, Radio, Volume2 } from 'lucide-react';

const WalkieTalkie = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [incomingTransmissions, setIncomingTransmissions] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSender, setCurrentSender] = useState(null);
  
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(new Audio());
  const queueRef = useRef([]);

  // Only render for Staff (Admin/Responder)
  const isStaff = user?.role === 'Admin' || user?.role === 'Responder';

  useEffect(() => {
    if (!isStaff) return;

    // Connect to Socket
    const socketUrl = import.meta.env.VITE_API_URL || '';
    socketRef.current = io(socketUrl, { transports: ['websocket', 'polling'] });
    
    socketRef.current.emit('join-global-radio');

    // Listen for incoming transmissions
    socketRef.current.on('radio-transmission', async (data) => {
      console.log('Incoming transmission from:', data.senderName);
      queueRef.current.push(data);
      processQueue();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isStaff]);

  const processQueue = async () => {
    if (isPlaying || queueRef.current.length === 0) return;
    
    setIsPlaying(true);
    const transmission = queueRef.current.shift();
    setCurrentSender(`${transmission.senderName} (${transmission.senderRole})`);
    
    try {
      // Convert ArrayBuffer to Blob and play
      const blob = new Blob([transmission.audioBlob], { type: 'audio/webm;codecs=opus' });
      const audioUrl = URL.createObjectURL(blob);
      
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setCurrentSender(null);
        setIsPlaying(false);
        // Process next in queue
        processQueue();
      };
      
      await audioPlayerRef.current.play();
    } catch (err) {
      console.error('Error playing radio transmission:', err);
      setCurrentSender(null);
      setIsPlaying(false);
      processQueue();
    }
  };

  const startRecording = async () => {
    if (!isStaff || isPlaying) return; // Prevent talking over someone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        // Send to server
        if (socketRef.current) {
          socketRef.current.emit('radio-transmission', {
            audioBlob,
            senderName: user.full_name,
            senderRole: user.role,
            timestamp: new Date().toISOString()
          });
        }
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access is required for the Walkie-Talkie feature.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (!isStaff) return null;

  return (
    <div 
      className="no-print"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
      }}
    >
      {/* Status Indicator */}
      {(isPlaying && currentSender) && (
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: '#2ecc71',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          animation: 'pulse 1.5s infinite'
        }}>
          <Volume2 size={16} />
          Receiving: {currentSender}
        </div>
      )}

      {/* PTT Button */}
      <div 
        style={{
          position: 'relative'
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isHovering && !isRecording && !isPlaying && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            right: '0',
            marginBottom: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}>
            Hold to Talk (Global Channel)
          </div>
        )}

        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording} // Stop if dragged out
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={isPlaying}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: isRecording ? '#e74c3c' : (isPlaying ? '#95a5a6' : '#2c3e50'),
            color: 'white',
            border: '3px solid white',
            boxShadow: isRecording ? '0 0 15px #e74c3c' : '0 4px 10px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {isRecording ? <Mic size={28} /> : (isPlaying ? <Volume2 size={28} /> : <Radio size={28} />)}
        </button>
      </div>
    </div>
  );
};

export default WalkieTalkie;
