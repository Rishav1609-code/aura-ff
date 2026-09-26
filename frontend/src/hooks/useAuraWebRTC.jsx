import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import { AppContext } from '../context/AppContext';

export function useAuraWebRTC() {
  const { currentUser, token, BACKEND_URL } = useContext(AppContext);

  const [modeSelectorVisible, setModeSelectorVisible] = useState(true);
  const [activeRoomMode, setActiveRoomMode] = useState('video');
  const [isMatching, setIsMatching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState(null);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  
  const [onlineCount, setOnlineCount] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const activeCallRef = useRef(null);
  
  // Initialize Socket and PeerJS
  useEffect(() => {
    if (!currentUser || !token) return;

    // 1. Init Socket
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // 2. Init PeerJS after Socket connects
      const peer = new Peer(undefined, {
        host: '0.peerjs.com',
        port: 443,
        secure: true
      });
      peerRef.current = peer;

      peer.on('open', (id) => {
        socket.emit('authenticate', { token, user: currentUser, peerId: id });
      });

      peer.on('call', (call) => {
        call.answer(localStreamRef.current);
        activeCallRef.current = call;
        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setIsMatching(false);
          setIsConnected(true);
        });
      });
    });

    socket.on('queue_status', (data) => {
      if (data.status === 'waiting') setIsMatching(true);
    });

    socket.on('matched', (data) => {
      setPartnerProfile(data.partner);
      
      if (data.isInitiator && data.partner && data.partner.peerId) {
        // Wait briefly for peer to be ready
        setTimeout(() => {
          const call = peerRef.current.call(data.partner.peerId, localStreamRef.current);
          if (call) {
            activeCallRef.current = call;
            call.on('stream', (remoteStream) => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
              setIsMatching(false);
              setIsConnected(true);
            });
          }
        }, 1000);
      }
    });

    socket.on('partner_left', () => {
      cleanupCall();
    });
    
    socket.on('peer_disconnected', () => {
      cleanupCall();
    });

    socket.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev, { ...msg, isSelf: false }]);
    });

    socket.on('typing', (data) => {
      setIsPartnerTyping(data.isTyping);
    });

    socket.on('online_count', (count) => {
      setOnlineCount(count);
    });

    return () => {
      cleanupCall();
      if (peerRef.current) peerRef.current.destroy();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [currentUser, token, BACKEND_URL]);

  const cleanupCall = useCallback(() => {
    if (activeCallRef.current) {
      activeCallRef.current.close();
      activeCallRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setIsConnected(false);
    setIsMatching(false);
    setPartnerProfile(null);
    setChatMessages([]);
  }, []);

  const getMediaStream = async (mode) => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      const constraints = {
        audio: true,
        video: mode === 'video' ? { facingMode: "user" } : false
      };
      if (mode === 'text') {
        localStreamRef.current = new MediaStream(); // empty
      } else {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
      return true;
    } catch (err) {
      console.error("Media access error:", err);
      return false;
    }
  };

  const startMatchmaking = async (mode) => {
    setActiveRoomMode(mode);
    setModeSelectorVisible(false);
    setIsMatching(true);
    
    const success = await getMediaStream(mode);
    if (!success && mode !== 'text') {
      alert("Microphone/Camera access required.");
      setModeSelectorVisible(true);
      setIsMatching(false);
      return;
    }
    
    socketRef.current.emit('join_queue', { mode });
  };

  const leaveChatRoom = () => {
    socketRef.current.emit('leave_room');
    socketRef.current.emit('leave_queue');
    cleanupCall();
    setModeSelectorVisible(true);
  };

  const skipToNextPeer = () => {
    cleanupCall();
    startMatchmaking(activeRoomMode);
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoMuted(!videoTrack.enabled);
    }
  };

  const sendChatMessage = (text) => {
    if (!text.trim()) return;
    const msg = {
      sender: currentUser.fullName,
      role: currentUser.role,
      text: text.trim(),
      messageId: `msg-${Date.now()}`
    };
    setChatMessages(prev => [...prev, { ...msg, isSelf: true }]);
    socketRef.current.emit('chat_message', { text: text.trim(), messageId: msg.messageId });
  };
  
  const sendTypingStatus = (isTyping) => {
    socketRef.current?.emit('typing', { isTyping });
  };

  const sendStageReaction = (emoji) => {
    socketRef.current?.emit('stage_reaction', { emoji });
    // In a full implementation, you'd trigger a local animation here too
  };

  return {
    modeSelectorVisible, activeRoomMode, isMatching, isConnected, partnerProfile, chatMessages,
    isAudioMuted, isVideoMuted, onlineCount, sessionDuration, isPartnerTyping,
    localVideoRef, remoteVideoRef,
    startMatchmaking, leaveChatRoom, skipToNextPeer, toggleMic, toggleCam,
    sendChatMessage, sendTypingStatus, sendStageReaction
  };
}
