import { socket } from '../socket';
import store from '../redux/store';
import {
    setIncomingCall,
    clearIncomingCall,
    startCall,
    endCall,
    setCallStatus
} from '../redux/callSlice';

// stun server configuration
const iceServers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

// variables for non seriazable objects
let peerConnection = null;
let localStream = null;
let remoteStream = null;

// helper to get callSlice state
const getCallState = () => store.getState().call;

// --- 1. INITIALIZE LISTENERS ---
export const initializeWebRTC = () => {
    if (!socket) return;
    console.log("[WebRTC] 🛠️ Initializing Listeners...");

    // Incoming Call
    socket.on('incoming-call', (data) => {
        console.log("[WebRTC] 📨 Received 'incoming-call':", data);
        if (getCallState().inCall) {
            console.warn("[WebRTC] ⚠️ Already in call. Rejecting new call.");
            socket.emit("call-rejected", { to: data.from, reason: "busy" });
            return;
        }
        store.dispatch(setIncomingCall(data));
    });

    // Call Accepted
    socket.on("call-accepted", async (data) => {
        console.log("[WebRTC] 🟢 Call accepted by peer:", data.from);
        if (peerConnection) {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                console.log("[WebRTC] ✅ Remote description set (Answer)");
                store.dispatch(setCallStatus('active'));
            } catch (err) {
                console.error("[WebRTC] ❌ Error setting remote description:", err);
            }
        } else {
            console.warn("[WebRTC] ⚠️ PeerConnection missing on call-accepted!");
        }
    });

    // Call Rejected
    socket.on('call-rejected', (data) => {
        console.log("[WebRTC] 🔴 Call rejected:", data.reason || 'user rejected');
        cleanUpCall();
    });

    // ICE Candidate Received
    socket.on("ice-candidate", (data) => {
        // console.log("[WebRTC] ❄️ Received Network Candidate"); // Uncomment if too noisy
        if (peerConnection && data.candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
                .catch(e => console.error("[WebRTC] ❌ Error adding ICE candidate:", e));
        }
    });

    // Hangup
    socket.on("hang-up", () => {
        console.log("[WebRTC] 📞 Peer hung up");
        cleanUpCall();
    });
}

// --- 2. PUBLIC FUNCTIONS ---

export const initiateCall = async (otherUserId, isAudioOnly, fromName) => {
    console.log(`[WebRTC] 🎬 Initiating call to ${otherUserId}`);
    try {
        const stream = await getMedia(isAudioOnly);
        localStream = stream;
        
        console.log("[WebRTC] 🎥 Local stream acquired");

        peerConnection = createPeerConnection(otherUserId);

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log("[WebRTC] 📝 Offer created and set as local description");

        // Update Redux
        store.dispatch(startCall({
            otherUser: otherUserId,
            isAudioOnly: isAudioOnly,
            status: 'connecting'
        }));

        // Emit
        socket.emit("call-user", {
            to: otherUserId,
            offer: offer,
            isAudioOnly: isAudioOnly,
            fromName: fromName
        });
    } catch (error) {
        console.error("[WebRTC] ❌ Error starting call:", error);
        cleanUpCall();
    }
}

export const answerCall = async () => {
    const { incomingCall } = getCallState();
    if (!incomingCall) return;

    console.log("[WebRTC] 📞 Answering call from:", incomingCall.from);

    try {
        const isAudioOnly = incomingCall.isAudioOnly;
        const stream = await getMedia(isAudioOnly);
        localStream = stream;
        console.log("[WebRTC] 🎥 Local stream acquired");

        peerConnection = createPeerConnection(incomingCall.from);
        
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        console.log("[WebRTC] 📝 Setting remote description (Offer)");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log("[WebRTC] 📝 Answer created and set as local description");

        store.dispatch(startCall({
            otherUser: incomingCall.from,
            isAudioOnly: isAudioOnly,
            status: 'active'
        }));

        socket.emit("call-accepted", {
            to: incomingCall.from,
            answer: answer,
        });
    } catch (error) {
        console.error("[WebRTC] ❌ Error answering call:", error);
        cleanUpCall();
    }
}

export const rejectCall = () => {
    const { incomingCall } = getCallState();
    if (incomingCall) {
        console.log("[WebRTC] 🚫 Rejecting call");
        socket.emit("call-rejected", { to: incomingCall.from, reason: 'rejected' });
        store.dispatch(clearIncomingCall());
    }
};

export const hangUp = () => {
    const { otherUser } = getCallState();
    console.log("[WebRTC] ⏹️ Hanging up");
    if (otherUser) {
        socket.emit("hang-up", { to: otherUser });
    }
    cleanUpCall();
};

// --- 3. HELPER FUNCTIONS ---

const getMedia = async (isAudioOnly) => {
    try {
        return await navigator.mediaDevices.getUserMedia({
            video: !isAudioOnly,
            audio: true,
        });
    } catch (err) {
        console.error("[WebRTC] ❌ Failed to get user media:", err);
        throw err;
    }
}

const createPeerConnection = (otherUserId) => {
    console.log("[WebRTC] 🕸️ Creating RTCPeerConnection");
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            // console.log("[WebRTC] ❄️ Generated Local ICE Candidate"); // Uncomment if debugging network
            socket.emit("ice-candidate", {
                to: otherUserId,
                candidate: event.candidate,
            });
        }
    };

    pc.ontrack = (event) => {
        console.log("[WebRTC] 📺 Received Remote Track");
        remoteStream = event.streams[0];

        // Try direct DOM manipulation first (Fallback)
        const remoteVideoEl = document.getElementById('remote-video');
        if (remoteVideoEl) {
            console.log("[WebRTC] 🔗 Attaching stream to DOM directly");
            remoteVideoEl.srcObject = remoteStream;
        } else {
            console.log("[WebRTC] ⏳ DOM element not found yet. React useEffect should handle this.");
        }
    };

    pc.onconnectionstatechange = () => {
        console.log("[WebRTC] 📶 Connection State Changed:", pc.connectionState);
    };

    return pc;
}

const cleanUpCall = () => {
    console.log("[WebRTC] 🧹 Cleaning up call resources");
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    remoteStream = null;

    const localVideoEl = document.getElementById('local-video');
    const remoteVideoEl = document.getElementById('remote-video');
    if (localVideoEl) localVideoEl.srcObject = null;
    if (remoteVideoEl) remoteVideoEl.srcObject = null;

    store.dispatch(endCall());
};

export const getLocalStream = () => localStream;
export const getRemoteStream = () => remoteStream;