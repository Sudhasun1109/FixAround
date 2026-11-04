import React, { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
  User,
  ShieldCheck
} from 'lucide-react';

export default function CallModal() {
  const {
    activeCall,
    incomingCall,
    isMuted,
    isVideoEnabled,
    callDuration,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Bind local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall]);

  // Bind remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall?.hasRemoteStream]);

  // 1. INCOMING CALL BANNER / DIALOG
  if (incomingCall && !activeCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center transform transition-all scale-100">
          <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-fixblue-500/20 animate-ping" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-fixblue-600 to-fixblue-800 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {incomingCall.callType === 'video' ? (
                <Video className="w-8 h-8 text-white" />
              ) : (
                <Phone className="w-8 h-8 text-white" />
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-1">
            {incomingCall.callerName || 'FixAround Call'}
          </h3>
          <p className="text-sm font-medium text-slate-500 mb-6">
            Incoming {incomingCall.callType === 'video' ? 'Video Call' : 'Voice Call'} for Booking #{incomingCall.bookingId}
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => rejectCall('declined')}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <PhoneOff className="w-4 h-4" />
              Decline
            </button>
            <button
              type="button"
              onClick={acceptCall}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <Phone className="w-4 h-4" />
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE CALL MODAL
  if (!activeCall) return null;

  const isVideo = activeCall.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col h-[85vh] max-h-[720px]">
        {/* Top Header Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                {activeCall.remoteName || 'Connected Service Call'}
                <span className="text-xs font-normal text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                  Booking #{activeCall.bookingId}
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                {activeCall.status === 'ringing' ? 'Ringing...' : `Active Call • ${callDuration}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>

        {/* Media Display Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video Stream PIP */}
              <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
                />
                {!isVideoEnabled && (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 text-xs font-medium">
                    Camera Off
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Voice Call Graphic Display */
            <div className="flex flex-col items-center justify-center text-center p-8">
              <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-fixblue-500/10 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-fixblue-500/20 animate-pulse" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-fixblue-700 to-fixblue-900 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  <User className="w-12 h-12 text-slate-200" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {activeCall.remoteName || 'Assigned Specialist'}
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {activeCall.status === 'ringing' ? 'Connecting to peer...' : 'Voice Call in Progress'}
              </p>
              <div className="text-2xl font-mono text-emerald-400 font-bold bg-slate-900/60 border border-slate-800 px-4 py-1.5 rounded-full">
                {callDuration}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 sm:gap-6 z-10">
          {/* Mute/Unmute */}
          <button
            type="button"
            onClick={toggleMute}
            className={`p-3.5 sm:p-4 rounded-full text-white transition ${
              isMuted
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle (If video call) */}
          {isVideo && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-3.5 sm:p-4 rounded-full text-white transition ${
                !isVideoEnabled
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
            >
              {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* End Call */}
          <button
            type="button"
            onClick={endCall}
            className="px-6 sm:px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition transform hover:scale-105 active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
