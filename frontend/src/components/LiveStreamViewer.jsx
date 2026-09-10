import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { CameraOff, AlertTriangle } from 'lucide-react';

const LiveStreamViewer = ({ incidentId }) => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!incidentId) return;

    // Connect to Socket.IO signaling server
    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Viewer connected to signaling server');
      socket.emit('join-incident-room', incidentId);
    });

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    // Send ICE candidates to the Broadcaster
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          incidentId,
          candidate: event.candidate
        });
      }
    };

    // When remote stream arrives, attach it to the video element
    peerConnection.ontrack = (event) => {
      if (videoRef.current && event.streams && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
        setStreamActive(true);
      }
    };

    // Listen for Broadcaster's Offer
    socket.on('webrtc-offer', async (data) => {
      if (data.offer) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit('webrtc-answer', {
            incidentId,
            answer
          });
        } catch (err) {
          console.error("Error handling offer:", err);
        }
      }
    });

    // Listen for Broadcaster's ICE candidates
    socket.on('ice-candidate', async (data) => {
      if (data.candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("Error adding ice candidate:", err);
        }
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [incidentId]);

  return (
    <div style={{ backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', width: '100%', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {error ? (
        <div style={{ color: '#fff', padding: '20px', textAlign: 'center' }}>
          <AlertTriangle size={32} color="var(--danger-color)" style={{ marginBottom: '10px' }} />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: streamActive ? 'block' : 'none' }}
          />
          
          {!streamActive && (
            <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', opacity: 0.6 }}>
              <CameraOff size={40} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Waiting for resident's camera feed...</p>
            </div>
          )}

          {streamActive && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(231, 76, 60, 0.9)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
              LIVE
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LiveStreamViewer;
