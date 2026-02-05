// src/components/CallView.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { hangUp, getLocalStream, getRemoteStream } from '../services/webRTCservice';

const CallView = () => {
  const { isAudioCall, otherUser } = useSelector((state) => state.call);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  useEffect(() => {
    const localStream = getLocalStream();
    const remoteStream = getRemoteStream();

    console.log("[UI] 🎥 CallView Mounted");
    console.log("   - Local Stream available:", !!localStream);
    console.log("   - Remote Stream available:", !!remoteStream);

    // 1. Attach Streams to Video Elements
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    // 2. Set IDs for the Service Layer (Fallback mechanism)
    // This allows webRTCservice.js to find these elements if React refs aren't ready
    if (remoteVideoRef.current) remoteVideoRef.current.id = 'remote-video';
    if (localVideoRef.current) localVideoRef.current.id = 'local-video';

    // 3. Cleanup function
    return () => {
      console.log("[UI] 🧹 CallView Unmounting");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        remoteVideoRef.current.id = '';
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        localVideoRef.current.id = '';
      }
    };
  }, []); // Run once on mount

  // Toggle Microphone
  const toggleMic = () => {
    const localStream = getLocalStream();
    if (!localStream) return;

    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsMicOn(track.enabled);
    });
  };

  // Toggle Camera
  const toggleCam = () => {
    const localStream = getLocalStream();
    if (!localStream) return;

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsCamOn(track.enabled);
    });
  };

  return (
    <div className="fixed top-4 right-4 w-96 h-[32rem] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:w-96 md:h-[32rem] bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl shadow-2xl z-[90] overflow-hidden border border-zinc-700">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
              <span className="text-lg text-white font-semibold">
                {otherUser?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="text-white font-semibold">{otherUser || 'Unknown'}</h3>
              <p className="text-zinc-300 text-xs">
                {isAudioCall ? 'Audio Call' : 'Video Call'}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>

      {/* Remote Video (Main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${isAudioCall ? 'hidden' : ''}`}
      />

      {/* Audio Call UI */}
      {isAudioCall && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-xl mx-auto">
              <span className="text-5xl text-white font-bold">
                {otherUser?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">{otherUser || 'Unknown'}</h2>
            <p className="text-zinc-400 text-sm">Audio Call in Progress</p>
          </div>
        </div>
      )}

      {/* Local Video (PiP) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted // Muted to avoid feedback loop
        className={`absolute top-20 right-4 w-24 h-32 bg-zinc-900 rounded-lg shadow-xl border border-zinc-700 object-cover ${isAudioCall ? 'hidden' : ''}`}
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6">
        <div className="flex justify-center gap-3">
          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-105 ${
              isMicOn ? 'bg-zinc-700/80 hover:bg-zinc-600 text-white' : 'bg-red-600 text-white'
            }`}
            title="Toggle Microphone"
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Video Toggle */}
          {!isAudioCall && (
            <button
              onClick={toggleCam}
              className={`p-3 rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-105 ${
                isCamOn ? 'bg-zinc-700/80 hover:bg-zinc-600 text-white' : 'bg-red-600 text-white'
              }`}
              title="Toggle Video"
            >
              {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={hangUp}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105"
            title="End Call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallView;