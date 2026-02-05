import React from 'react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Phone, PhoneOff } from 'lucide-react';
import { answerCall, rejectCall } from '../services/webRTCservice';

const IncomingCallModal = () => {
  const incomingCall = useSelector((state) => state.call.incomingCall);
  useEffect(() => {
    if (incomingCall) {
      console.log("[UI] 🔔 IncomingCallModal rendered with data:", incomingCall);
    }
  }, [incomingCall]);

 
  if (!incomingCall) {
    return null; // Don't render anything if no one is calling
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-xl text-center max-w-sm w-full mx-4">
        <h2 className="text-xl font-semibold mb-2 dark:text-white">
          Incoming {incomingCall.isAudioOnly ? "Audio" : "Video"} Call
        </h2>
        <p className="mb-6 dark:text-gray-300">
          {incomingCall.fromName || incomingCall.from} is calling...
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={rejectCall} //  Call service function
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full"
          >
            <PhoneOff size={24} />
          </button>
          <button
            onClick={answerCall} //  Call service function
            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full"
          >
            <Phone size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;