import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createAuthSocket } from '../utils/socket';
import { 
  CameraOff, 
  AlertTriangle, 
  Square, 
  Download, 
  UploadCloud, 
  Trash2, 
  CheckCircle, 
  Video 
} from 'lucide-react';

const LiveStreamViewer = ({ incidentId }) => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const broadcasterIdRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const remoteStreamRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [error, setError] = useState('');

  // Semi-Automatic Recording States (Option 1)
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [savingToIncident, setSavingToIncident] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Timer for active recording
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const getBestMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a',
      'video/mp4'
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  const startAutoRecording = (stream) => {
    if (typeof MediaRecorder === 'undefined' || !stream) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') return;

    try {
      const mimeType = getBestMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (recordedChunksRef.current.length > 0) {
          const type = mimeType || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type });
          setRecordedBlob(blob);
          const url = URL.createObjectURL(blob);
          setRecordedUrl(url);
          setSaveSuccess(false);
          setSaveError('');
        }
        setIsRecording(false);
      };

      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      console.log('Semi-automatic live stream recording started.');
    } catch (err) {
      console.warn('Failed to start automatic MediaRecorder:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recorder:', e);
      }
    }
    setIsRecording(false);
  };

  const handleSaveToIncident = async () => {
    if (!recordedBlob || !incidentId) return;

    setSavingToIncident(true);
    setSaveError('');
    try {
      const ext = recordedBlob.type?.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([recordedBlob], `incident_${incidentId}_stream_${Date.now()}.${ext}`, {
        type: recordedBlob.type || 'video/webm'
      });

      const formData = new FormData();
      formData.append('video', file);

      await axios.post(`/api/incidents/${incidentId}/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSaveSuccess(true);
    } catch (err) {
      console.error('Save to incident error:', err);
      setSaveError(err.response?.data?.message || 'Failed to upload video to incident report.');
    } finally {
      setSavingToIncident(false);
    }
  };

  const handleDownloadCopy = () => {
    if (!recordedUrl) return;
    const ext = recordedBlob?.type?.includes('mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `Jamindan_Incident_${incidentId}_Recording_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDiscard = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setSaveSuccess(false);
    setSaveError('');
  };

  useEffect(() => {
    if (!incidentId) return;

    if (typeof window === 'undefined' || !('RTCPeerConnection' in window)) {
      setError('Live video playback is not supported on this browser.');
      return;
    }

    const socket = createAuthSocket({ transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Viewer connected to signaling server:', socket.id);
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

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && broadcasterIdRef.current) {
        socket.emit('ice-candidate', {
          incidentId,
          targetId: broadcasterIdRef.current,
          candidate: event.candidate
        });
      }
    };

    peerConnection.ontrack = (event) => {
      if (videoRef.current && event.streams && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
        remoteStreamRef.current = event.streams[0];
        setStreamActive(true);

        // Auto-start recording incoming feed (Semi-Automatic Mode)
        startAutoRecording(event.streams[0]);
      }
    };

    socket.on('broadcaster-ready', () => {
      socket.emit('join-incident-room', incidentId);
    });

    socket.on('webrtc-offer', async (data) => {
      if (data.targetId && data.targetId !== socket.id) return;
      
      if (data.offer) {
        try {
          broadcasterIdRef.current = data.senderId;
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          socket.emit('webrtc-answer', {
            incidentId,
            targetId: data.senderId,
            answer
          });
        } catch (err) {
          console.error("Error handling offer:", err);
        }
      }
    });

    socket.on('ice-candidate', async (data) => {
      if (data.targetId && data.targetId !== socket.id) return;

      if (data.candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("Error adding ice candidate:", err);
        }
      }
    });

    return () => {
      // Stop recording if active on unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (socketRef.current) socketRef.current.disconnect();
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [incidentId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {/* Video Viewport */}
      <div style={{ 
        backgroundColor: '#000', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        position: 'relative', 
        width: '100%', 
        height: '320px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
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

            {/* LIVE Badge */}
            {streamActive && (
              <div style={{ 
                position: 'absolute', 
                top: '12px', 
                right: '12px', 
                backgroundColor: 'rgba(231, 76, 60, 0.9)', 
                color: '#fff', 
                padding: '4px 10px', 
                borderRadius: '20px', 
                fontSize: '11px', 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                LIVE
              </div>
            )}

            {/* Recording Indicator & Manual Stop Button */}
            {isRecording && (
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 10
              }}>
                <div style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.9)',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backdropFilter: 'blur(4px)'
                }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                  REC {formatTime(recordSeconds)}
                </div>

                <button
                  type="button"
                  onClick={stopRecording}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)'
                  }}
                  title="Stop recording and review options"
                >
                  <Square size={12} fill="#ef4444" color="#ef4444" />
                  Stop Recording
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post-Recording Action Panel (Semi-Automatic Confirmation) */}
      {recordedBlob && (
        <div style={{
          backgroundColor: '#0f172a',
          border: '1.5px solid #38bdf8',
          borderRadius: '12px',
          padding: '12px 14px',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Video size={15} /> Live Video Recording Captured ({Math.round(recordedBlob.size / 1024)} KB)
            </span>
            {saveSuccess && (
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={13} /> Saved to Official Incident Evidence!
              </span>
            )}
          </div>

          {saveError && (
            <div style={{ fontSize: '11px', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
              ⚠️ {saveError}
            </div>
          )}

          {/* 3 Confirmation Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={savingToIncident || saveSuccess}
              onClick={handleSaveToIncident}
              style={{
                flex: '1 1 140px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: saveSuccess ? '#059669' : '#0284c7',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: (savingToIncident || saveSuccess) ? 'default' : 'pointer',
                opacity: savingToIncident ? 0.7 : 1
              }}
            >
              <UploadCloud size={14} />
              {savingToIncident ? 'Uploading...' : saveSuccess ? 'Saved to Report' : 'Save to Incident Report'}
            </button>

            <button
              type="button"
              onClick={handleDownloadCopy}
              style={{
                flex: '1 1 120px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              Download Copy
            </button>

            <button
              type="button"
              onClick={handleDiscard}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Discard this recording"
            >
              <Trash2 size={14} />
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamViewer;