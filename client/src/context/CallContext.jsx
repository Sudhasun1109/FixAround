import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const CallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function CallProvider({ children }) {
  const { user } = useAuth();
  const [activeCall, setActiveCall] = useState(null); // { sessionId, bookingId, callType, remoteName, isIncoming, status: 'ringing'|'connected'|'ended' }
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const durationTimerRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket listeners
  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    socketRef.current = socket;
    socket.emit('join_user', user.id);

    // Incoming Call Event
    const handleIncoming = (data) => {
      console.log('[Call] Incoming call received:', data);
      setIncomingCall(data);
    };

    // Call Accepted
    const handleAccepted = async (data) => {
      console.log('[Call] Call was accepted by remote peer:', data);
      if (peerConnectionRef.current && data.sdpAnswer) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdpAnswer));
          setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
          startDurationTimer();
        } catch (e) {
          console.error('[Call] Error setting remote description:', e);
        }
      }
    };

    // Call Rejected
    const handleRejected = (data) => {
      console.log('[Call] Call was rejected:', data);
      toast.error(`Call declined: ${data.reason || 'User busy'}`);
      cleanupCall();
    };

    // Call Ended
    const handleEnded = () => {
      console.log('[Call] Call ended by other party');
      toast.success('Call ended');
      cleanupCall();
    };

    // ICE Candidate
    const handleIceCandidate = async (data) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('[Call] Error adding ICE candidate:', e);
        }
      }
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:rejected', handleRejected);
    socket.on('call:ended', handleEnded);
    socket.on('call:ice_candidate', handleIceCandidate);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:rejected', handleRejected);
      socket.off('call:ended', handleEnded);
      socket.off('call:ice_candidate', handleIceCandidate);
    };
  }, [user?.id]);

  const startDurationTimer = () => {
    stopDurationTimer();
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };

  const createPeerConnection = (bookingId, targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('call:ice_candidate', {
          bookingId,
          targetUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[Call] Remote track received:', event.streams[0]);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        // Trigger re-render so video element binds
        setActiveCall((prev) => (prev ? { ...prev, hasRemoteStream: true } : null));
      }
    };

    return pc;
  };

  // 1. INITIATE OUTGOING CALL
  const startCall = async ({ bookingId, recipientId, recipientName, callType = 'voice' }) => {
    if (!user) {
      toast.error('You must be logged in to make a call');
      return;
    }

    try {
      toast.loading(`Starting ${callType} call...`, { id: 'call-toast' });

      // Request media stream
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video'
        });
      } catch (mediaErr) {
        console.warn('[Call] Media permission failed, using audio-only or silent stream:', mediaErr.message);
        // Fallback to audio only
        stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      }

      localStreamRef.current = stream;
      const pc = createPeerConnection(bookingId, recipientId);

      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = getSocket();
      socket.emit('join_booking', bookingId);

      socket.emit(
        'call:initiate',
        {
          bookingId,
          callerId: user.id,
          callerName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.role,
          callType,
          sdpOffer: offer
        },
        (res) => {
          toast.dismiss('call-toast');
          if (res?.success) {
            setActiveCall({
              sessionId: res.sessionId,
              bookingId,
              callType,
              remoteName: recipientName || 'Connecting...',
              remoteId: res.receiverId,
              isIncoming: false,
              status: 'ringing'
            });
          } else {
            toast.error(res?.error || 'Could not place call');
            cleanupCall();
          }
        }
      );
    } catch (err) {
      toast.dismiss('call-toast');
      console.error('[Call] startCall failed:', err);
      toast.error(err.message || 'Unable to access microphone or camera');
      cleanupCall();
    }
  };

  // 2. ACCEPT INCOMING CALL
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const { sessionId, bookingId, callerId, callerName, callType, sdpOffer } = incomingCall;
      toast.loading(`Connecting call...`, { id: 'accept-toast' });

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video'
        });
      } catch (mediaErr) {
        console.warn('[Call] Media failed, falling back:', mediaErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      }

      localStreamRef.current = stream;
      const pc = createPeerConnection(bookingId, callerId);

      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      await pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = getSocket();
      socket.emit('join_booking', bookingId);

      socket.emit(
        'call:accept',
        {
          sessionId,
          bookingId,
          sdpAnswer: answer
        },
        (res) => {
          toast.dismiss('accept-toast');
          if (res?.success) {
            setActiveCall({
              sessionId,
              bookingId,
              callType,
              remoteName: callerName || 'Customer / Pro',
              remoteId: callerId,
              isIncoming: true,
              status: 'connected'
            });
            setIncomingCall(null);
            startDurationTimer();
          } else {
            toast.error('Failed to connect call');
            cleanupCall();
          }
        }
      );
    } catch (err) {
      toast.dismiss('accept-toast');
      console.error('[Call] acceptCall failed:', err);
      toast.error('Error connecting call');
      rejectCall('Hardware media error');
    }
  };

  // 3. REJECT INCOMING CALL
  const rejectCall = (reason = 'declined') => {
    if (!incomingCall) return;
    const socket = getSocket();
    socket.emit('call:reject', {
      sessionId: incomingCall.sessionId,
      bookingId: incomingCall.bookingId,
      reason
    });
    setIncomingCall(null);
  };

  // 4. END ACTIVE CALL
  const endCall = () => {
    if (activeCall && socketRef.current) {
      socketRef.current.emit('call:end', {
        sessionId: activeCall.sessionId,
        bookingId: activeCall.bookingId
      });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    stopDurationTimer();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    remoteStreamRef.current = null;
    setActiveCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
    setCallDuration(0);
  };

  // 5. TOGGLE MUTE
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // 6. TOGGLE VIDEO
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        isMuted,
        isVideoEnabled,
        callDuration: formatDuration(callDuration),
        localStream: localStreamRef.current,
        remoteStream: remoteStreamRef.current,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
