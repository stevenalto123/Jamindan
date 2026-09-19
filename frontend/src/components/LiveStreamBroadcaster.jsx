import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Camera, Mic, MicOff, CameraOff, AlertTriangle } from 'lucide-react';

const LiveStreamBroadcaster = ({ incidentId }) => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({}); // Store multiple connections
  const localStreamRef = useRef(null);
  
  const [streamActive, setStreamActive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!incidentId) return;

    // Connect to Socket.IO signaling server
    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Broadcaster connected to signaling server:', socket.id);
      socket.emit('join-incident-room', incidentId);
    });

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    // Helper to create a new P2P connection for a specific viewer
    const createPeerConnection = async (viewerId, stream) => {
      console.log('Creating new RTCPeerConnection for viewer:', viewerId);
      
      const pc = new RTCPeerConnection(configuration);
      peerConnectionsRef.current[viewerId] = pc;

      // Add local tracks to this new connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Send ICE candidates targeted to this viewer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            incidentId,
            targetId: viewerId,
            candidate: event.candidate
          });
        }
      };

      // Create and send Offer to this specific Viewer
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', {
          incidentId,
          targetId: viewerId,
          offer
        });
      } catch (err) {
        console.error("Error creating offer for", viewerId, err);
      }
    };

    // Capture Local Media
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: true
        });

        localStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStreamActive(true);
        
        // Let any viewers already in the room know we are ready
        socket.emit('broadcaster-ready');

        // Listen for new viewers joining
        socket.on('viewer-joined', async (viewerId) => {
          if (!viewerId || viewerId === socket.id) return;
          console.log('New viewer joined, initiating connection:', viewerId);
          await createPeerConnection(viewerId, stream);
        });

      } catch (err) {
        console.error("Failed to access camera/mic:", err);
        setError('Camera or Microphone access denied. Live streaming unavailable.');
      }
    };

    startMedia();

    // Listen for Viewer's Answer
    socket.on('webrtc-answer', async (data) => {
      // Must be addressed to us
      if (data.targetId && data.targetId !== socket.id) return;
      
      const pc = peerConnectionsRef.current[data.senderId];
      if (pc && data.answer) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    });

    // Listen for Viewer's ICE candidates
    socket.on('ice-candidate', async (data) => {
      if (data.targetId && data.targetId !== socket.id) return;

      const pc = peerConnectionsRef.current[data.senderId];
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("Error adding ice candidate:", err);
        }
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      peerConnectionsRef.current = {};
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [incidentId]);

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  return (
    <div style={{ backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', width: '100%', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
      
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
            muted // Mute local playback to avoid echo
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          
          <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(231, 76, 60, 0.9)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%' }}></div>
            LIVE
          </div>

          <div style={{ position: 'absolute', bottom: '20px', display: 'flex', gap: '15px' }}>
            <button 
              onClick={toggleAudio}
              style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: audioEnabled ? 'rgba(255,255,255,0.2)' : '#c0392b', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', cursor: 'pointer' }}
            >
              {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button 
              onClick={toggleVideo}
              style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: videoEnabled ? 'rgba(255,255,255,0.2)' : '#c0392b', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', cursor: 'pointer' }}
            >
              {videoEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveStreamBroadcaster;
