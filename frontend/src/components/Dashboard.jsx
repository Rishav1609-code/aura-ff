import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import SettingsModal from './SettingsModal';
import { useAuraWebRTC } from '../hooks/useAuraWebRTC';

export default function Dashboard() {
  const { currentUser, setToken, setCurrentUser } = useContext(AppContext);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  
  const {
    modeSelectorVisible, activeRoomMode, isMatching, isConnected, partnerProfile, chatMessages,
    isAudioMuted, isVideoMuted, onlineCount, sessionDuration, isPartnerTyping,
    localVideoRef, remoteVideoRef,
    startMatchmaking, leaveChatRoom, skipToNextPeer, toggleMic, toggleCam,
    sendChatMessage, sendTypingStatus, sendStageReaction
  } = useAuraWebRTC();
  
  const handleChatSubmit = (e) => {
    e.preventDefault();
    const input = e.target.elements.chatTextInput;
    sendChatMessage(input.value);
    input.value = '';
  };

  const handleLogout = () => {
    localStorage.removeItem('aura_auth_token');
    localStorage.removeItem('aura_rfc_session');
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <>
    <section id="dashboardSection" className="flex w-full flex-col items-center">

      {/*  User Attested Status Banner & Dashboard Header  */}
      <div
        className="w-full bg-white text-black border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_0px_#000] mb-8 flex flex-wrap items-center justify-between gap-4">

        {/*  User Profile & Verified Status  */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-[260px]">
          <div
            className="w-12 h-12 bg-vividyellow border-4 border-black flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_#000] select-none shrink-0">
            ✓
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-lg font-black uppercase tracking-tight">{currentUser?.fullName || 'Member'}</span>
              <span
                className="bg-hotred text-white border-2 border-black px-2 py-0.5 text-xs font-black uppercase shadow-[1px_1px_0px_0px_#000]"
                id="dashUserRole">Member</span>
              <span
                className="bg-[#FFD93D] text-black border-2 border-black px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded-none shadow-[2px_2px_0px_0px_#000]"
                id="dashUserSocietyId">...</span>
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-gray-700 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 border border-black animate-pulse"></span>
              <span>STATUS: <strong className="text-emerald-700 font-black">VERIFIED SOCIETY MEMBER</strong> // ZERO
                ANONYMITY PROTOCOL ACTIVE</span>
            </div>
          </div>
        </div>

        {/*  Dashboard Header Actions: Online Counter, Chunky Settings Button & Sign Out  */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">

          {/*  Online Users Counter Pill  */}
          <div id="dashOnlineCounterBadge"
            className="bg-vividyellow border-4 border-black px-3 py-1.5 font-black text-xs sm:text-sm shadow-[4px_4px_0px_0px_#000] rounded-none flex items-center gap-2 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black animate-pulse"></span>
            <span className="font-black">{onlineCount}</span>
            <span className="hidden md:inline">ONLINE</span>
          </div>

          {/*  Chunky Square Neo-Brutalist SETTINGS Button  */}
          <button type="button" id="dashboardSettingsBtn" onClick={() => setIsSettingsOpen(true)}
            title="AURA System & Audio Settings"
            className="w-10 h-10 sm:w-11 sm:h-11 bg-[#C4B5FD] hover:bg-[#FFFDF5] text-black border-4 border-black flex items-center justify-center font-black text-lg sm:text-xl shadow-[4px_4px_0px_0px_#000] rounded-none cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none select-none">
            <span>⚙️</span>
          </button>

          {/*  Sign Out Button  */}
          <button type="button" onClick={handleLogout} title="End attested session"
            className="bg-black hover:bg-hotred text-white border-4 border-black px-3.5 sm:px-4 py-1.5 sm:py-2 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer select-none">
            SIGN OUT
          </button>
        </div>

      </div>

      {/*  ===================================================================  */}
      {/*  SOCIETY NOTICEBOARD: ADMIN POSTS & BROADCASTS  */}
      {/*  ===================================================================  */}
      <div className="w-full bg-[#C4B5FD] text-black border-4 border-black p-5 sm:p-6 shadow-[8px_8px_0px_0px_#000] mb-8 rounded-none">

        {/*  Noticeboard Header  */}
        <div className="flex flex-wrap items-center justify-between border-b-4 border-black pb-3 mb-5 gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">📌</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black leading-none">
                SOCIETY NOTICEBOARD
              </h3>
              <p className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-black/80 mt-1">
                LATEST ADMIN BROADCASTS // SYSTEM ANNOUNCEMENTS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="bg-white border-2 border-black px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]">
              🔴 LIVE BROADCASTS
            </span>
          </div>
        </div>

        {/*  Sticker Notification Cards (Horizontal Scrolling Flex)  */}
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-3 pt-2" data-lenis-prevent>

          {/*  STICKER 1: URGENT  */}
          <div
            className="min-w-[280px] sm:min-w-[320px] max-w-[340px] flex-shrink-0 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rotate-1 hover:rotate-0 hover:scale-[1.02] transition-all rounded-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="bg-[#FF6B6B] text-black border-2 border-black px-2 py-0.5 font-black text-[10px] sm:text-xs uppercase tracking-wider">
                  [ URGENT ]
                </span>
                <span className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                  TODAY, 10:00 AM
                </span>
              </div>
              <p className="font-black uppercase text-sm sm:text-base text-black leading-snug tracking-tight mb-3">
                MAINTENANCE AT MIDNIGHT. ALL SERVERS WILL BE REBOOTED.
              </p>
            </div>
            <div
              className="border-t-2 border-black pt-2 flex items-center justify-between text-[11px] font-black uppercase text-black">
              <span>BY: ADMIN VISHU</span>
              <span className="bg-[#FFD93D] border border-black px-1.5 text-[9px]">RFC-HQ</span>
            </div>
          </div>

          {/*  STICKER 2: EVENT  */}
          <div
            className="min-w-[280px] sm:min-w-[320px] max-w-[340px] flex-shrink-0 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] -rotate-2 hover:rotate-0 hover:scale-[1.02] transition-all rounded-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="bg-[#FFD93D] text-black border-2 border-black px-2 py-0.5 font-black text-[10px] sm:text-xs uppercase tracking-wider">
                  [ EVENT ]
                </span>
                <span className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                  TODAY, 08:30 AM
                </span>
              </div>
              <p className="font-black uppercase text-sm sm:text-base text-black leading-snug tracking-tight mb-3">
                CAMPUS HACKATHON REGISTRATIONS OPEN ON MONDAY. 60 SLOTS AVAILABLE.
              </p>
            </div>
            <div
              className="border-t-2 border-black pt-2 flex items-center justify-between text-[11px] font-black uppercase text-black">
              <span>BY: ADMIN RISHAV</span>
              <span className="bg-[#FFD93D] border border-black px-1.5 text-[9px]">VXR DEV</span>
            </div>
          </div>

          {/*  STICKER 3: POLICY / PROTOCOL  */}
          <div
            className="min-w-[280px] sm:min-w-[320px] max-w-[340px] flex-shrink-0 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rotate-2 hover:rotate-0 hover:scale-[1.02] transition-all rounded-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="bg-[#FFD93D] text-black border-2 border-black px-2 py-0.5 font-black text-[10px] sm:text-xs uppercase tracking-wider">
                  [ NOTICE ]
                </span>
                <span className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                  YESTERDAY, 04:15 PM
                </span>
              </div>
              <p className="font-black uppercase text-sm sm:text-base text-black leading-snug tracking-tight mb-3">
                ZERO ANONYMITY POLICY IN FULL EFFECT. MAINTAIN CAMPUS DECORUM AT ALL TIMES.
              </p>
            </div>
            <div
              className="border-t-2 border-black pt-2 flex items-center justify-between text-[11px] font-black uppercase text-black">
              <span>BY: ADMIN VISHU</span>
              <span className="bg-[#FFD93D] border border-black px-1.5 text-[9px]">SECURITY</span>
            </div>
          </div>

          {/*  STICKER 4: SYSTEM BROADCAST  */}
          <div
            className="min-w-[280px] sm:min-w-[320px] max-w-[340px] flex-shrink-0 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] -rotate-1 hover:rotate-0 hover:scale-[1.02] transition-all rounded-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="bg-[#BAE6FD] text-black border-2 border-black px-2 py-0.5 font-black text-[10px] sm:text-xs uppercase tracking-wider">
                  [ INFRA ]
                </span>
                <span className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                  SEP 18, 02:00 PM
                </span>
              </div>
              <p className="font-black uppercase text-sm sm:text-base text-black leading-snug tracking-tight mb-3">
                PEERJS WEBRTC MESH PROTOCOL UPGRADED FOR ZERO-LATENCY CAMPUS STREAMING.
              </p>
            </div>
            <div
              className="border-t-2 border-black pt-2 flex items-center justify-between text-[11px] font-black uppercase text-black">
              <span>BY: ADMIN VISHU</span>
              <span className="bg-[#FFD93D] border border-black px-1.5 text-[9px]">INFRA</span>
            </div>
          </div>

        </div>
      </div>

      {/*  DASHBOARD MODE SELECTOR CARDS (Red, Yellow, Violet)  */}
      <div id="modeSelectorPanel" className={`w-full max-w-5xl ${modeSelectorVisible ? '' : 'hidden'}`}>
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight stroke-headline-accent">
            CHOOSE COMMUNICATION PROTOCOL
          </h2>
          <p className="text-sm font-bold uppercase tracking-wider mt-1">
            Connect 1-on-1 with verified members of RAHUL FOUNDATION SOCIETY
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/*  OPTION 1: VIDEO CHAT (Hot Red #FF6B6B)  */}
          <div onClick={() => startMatchmaking('video')}
            className="bg-hotred border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#000] transition-all cursor-pointer flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-black text-white border-2 border-black px-2 py-0.5 font-black text-xs uppercase">
                  HIGH BANDWIDTH
                </span>
                <span className="text-4xl group-hover:scale-110 transition-transform">📹</span>
              </div>
              <h3 className="text-3xl font-black uppercase text-white tracking-tight mb-2">
                VIDEO CHAT
              </h3>
              <p className="text-sm font-bold text-white leading-relaxed">
                Real-time peer-to-peer HD video &amp; audio via PeerJS WebRTC. Both faces verified and recorded in
                metadata.
              </p>
            </div>
            <div className="mt-6">
              <div
                className="w-full bg-white text-black border-4 border-black py-3 text-center font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] group-hover:bg-vividyellow transition-colors">
                LAUNCH VIDEO &rarr;
              </div>
            </div>
          </div>

          {/*  OPTION 2: VOICE CHAT (Vivid Yellow #FFD93D)  */}
          <div onClick={() => startMatchmaking('voice')}
            className="bg-vividyellow border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#000] transition-all cursor-pointer flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-black text-white border-2 border-black px-2 py-0.5 font-black text-xs uppercase">
                  LOW LATENCY
                </span>
                <span className="text-4xl group-hover:scale-110 transition-transform">🎙️</span>
              </div>
              <h3 className="text-3xl font-black uppercase text-black tracking-tight mb-2">
                VOICE CHAT
              </h3>
              <p className="text-sm font-bold text-black leading-relaxed">
                Clear, audio-only WebRTC stream for campus Wi-Fi. Verified partner profile badge slapped on screen.
              </p>
            </div>
            <div className="mt-6">
              <div
                className="w-full bg-black text-white border-4 border-black py-3 text-center font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#FFF] group-hover:bg-hotred group-hover:border-black group-hover:text-white transition-colors">
                LAUNCH VOICE &rarr;
              </div>
            </div>
          </div>

          {/*  OPTION 3: TEXT CHAT (Soft Violet #C4B5FD)  */}
          <div onClick={() => startMatchmaking('text')}
            className="bg-softviolet border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#000] transition-all cursor-pointer flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-black text-white border-2 border-black px-2 py-0.5 font-black text-xs uppercase">
                  ZERO BANDWIDTH
                </span>
                <span className="text-4xl group-hover:scale-110 transition-transform">💬</span>
              </div>
              <h3 className="text-3xl font-black uppercase text-black tracking-tight mb-2">
                TEXT CHAT
              </h3>
              <p className="text-sm font-bold text-black leading-relaxed">
                Sanitized, end-to-end peer text exchange. Real-time typing, strict XSS protection, and immediate
                logging.
              </p>
            </div>
            <div className="mt-6">
              <div
                className="w-full bg-white text-black border-4 border-black py-3 text-center font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] group-hover:bg-vividyellow transition-colors">
                LAUNCH TEXT &rarr;
              </div>
            </div>
          </div>

        </div>
      </div>

      {/*  ===================================================================  */}
      {/*  ACTIVE CALL / CHAT ROOM (OMEGLE-LIKE BUT VERIFIED)  */}
      {/*  ===================================================================  */}
      <div id="activeRoomPanel" className={`w-full max-w-6xl flex-col ${modeSelectorVisible ? 'hidden' : 'flex'}`}>

        {/*  Control Bar: Mode Badge, Status, Duration Counter, Next, Disconnect, Report  */}
        <div
          className="bg-white border-4 border-black p-3 sm:p-4 shadow-[6px_6px_0px_0px_#000] mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span id="roomModeBadge"
              className="bg-hotred text-white border-2 border-black px-3 py-1 font-black text-xs sm:text-sm uppercase shadow-[2px_2px_0px_0px_#000]">
              VIDEO CHAT ACTIVE
            </span>
            <span id="roomStatusText"
              className="text-xs sm:text-sm font-black uppercase text-black flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              CONNECTED TO VERIFIED MEMBER
            </span>

            {/*  Session Duration Counter Badge  */}
            <div id="sessionDurationBadge" title="Current Peer Session Elapsed Time"
              className="bg-black text-[#FFE600] border-2 border-black px-2.5 py-1 text-xs font-mono font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 rounded-none select-none">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse"></span>
              <span className="text-[10px] font-sans font-bold text-gray-300">DURATION:</span>
              <span id="sessionDurationTimer" className="tracking-widest">00:00</span>
            </div>

            {/*  REAL-TIME CONNECTION QUALITY BAR (NEO-BRUTALIST WEBRTC HEALTH METER)  */}
            <div className="relative">
              <div id="connectionQualityBadge" onClick={() => {}}
                title="WebRTC Real-Time Network Health (Click to view full network telemetry & simulator)"
                className="bg-black text-white border-2 border-black px-2.5 py-1 text-xs font-mono font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex items-center gap-2 rounded-none select-none cursor-pointer hover:bg-zinc-900 transition-colors">
                {/*  4-bar discrete stepped meter  */}
                <div className="flex items-center gap-1.5">
                  <div id="qualityBarsContainer" className="flex items-end gap-[2px] h-3.5 w-5 py-[0.5px]">
                    <span id="qbar-1" className="w-1 h-1.5 bg-[#39FF14] border border-black transition-all"></span>
                    <span id="qbar-2" className="w-1 h-2 bg-[#39FF14] border border-black transition-all"></span>
                    <span id="qbar-3" className="w-1 h-2.5 bg-[#39FF14] border border-black transition-all"></span>
                    <span id="qbar-4" className="w-1 h-3.5 bg-[#39FF14] border border-black transition-all"></span>
                  </div>
                  <span className="text-[10px] font-sans font-bold text-gray-300">NET:</span>
                  <span id="qualityLabel" className="text-[#39FF14] font-black text-[11px] tracking-tight">EXCELLENT</span>
                </div>

                <div className="h-3 w-[1px] bg-zinc-700"></div>

                {/*  Ping / RTT pill  */}
                <div className="flex items-center gap-1">
                  <span id="qualityPingBadge"
                    className="bg-zinc-900 border border-zinc-700 px-1 py-0.2 text-[10px] text-gray-200 font-mono">
                    24ms
                  </span>
                  <span className="text-[9px] text-gray-400 hidden sm:inline font-sans font-bold">ℹ️</span>
                </div>
              </div>

              {/*  WebRTC Detailed Telemetry & Simulator Popover  */}
              <div id="qualityTelemetryPopover"
                className="hidden absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-40 w-72 sm:w-80 bg-white border-4 border-black p-3.5 shadow-[6px_6px_0px_0px_#000] text-black">
                <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14]" id="popoverStatusDot"></span>
                    <span className="text-xs font-black uppercase">WebRTC Health Telemetry</span>
                  </div>
                  <button type="button" onClick={() => {}}
                    className="text-xs font-black bg-hotred text-white border border-black px-1.5 hover:bg-black">✕</button>
                </div>

                <div className="space-y-1.5 text-[11px] font-mono mb-3">
                  <div className="flex justify-between border-b border-gray-200 py-0.5">
                    <span className="text-gray-600 font-sans font-bold">Link Quality:</span>
                    <strong id="popoverQualityGrade" className="font-black text-emerald-600">OPTIMAL (LEVEL 4)</strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 py-0.5">
                    <span className="text-gray-600 font-sans font-bold">Round-Trip Time (RTT):</span>
                    <strong id="popoverRtt" className="font-black text-black">24 ms</strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 py-0.5">
                    <span className="text-gray-600 font-sans font-bold">Jitter Buffer:</span>
                    <strong id="popoverJitter" className="font-black text-black">1.8 ms</strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 py-0.5">
                    <span className="text-gray-600 font-sans font-bold">Packet Loss:</span>
                    <strong id="popoverLoss" className="font-black text-emerald-600">0.0% (0 packets)</strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 py-0.5">
                    <span className="text-gray-600 font-sans font-bold">Transport Layer:</span>
                    <strong id="popoverTransport" className="font-black text-black">Direct P2P (UDP/STUN)</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-gray-600 font-sans font-bold">Estimated Bitrate:</span>
                    <strong id="popoverBitrate" className="font-black text-black">2.4 Mbps (HD 1080p)</strong>
                  </div>
                </div>

                {/*  Simulator Mode Switcher  */}
                <div className="pt-2 border-t-2 border-black">
                  <span className="block text-[9px] font-black uppercase text-gray-700 mb-1 font-sans">
                    🧪 SIMULATE NETWORK CONDITIONS (TEST QUALITY BAR):
                  </span>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-black uppercase text-center">
                    <button type="button" onClick={() => {}}
                      className="bg-[#4ADE80] hover:bg-emerald-500 text-black border border-black py-1 brutal-btn">
                      🟢 OPTIMAL
                    </button>
                    <button type="button" onClick={() => {}}
                      className="bg-[#FFD93D] hover:bg-yellow-400 text-black border border-black py-1 brutal-btn">
                      🟡 FAIR
                    </button>
                    <button type="button" onClick={() => {}}
                      className="bg-[#FF6B6B] hover:bg-red-500 text-white border border-black py-1 brutal-btn">
                      🔴 POOR
                    </button>
                    <button type="button" onClick={() => {}}
                      className="bg-black hover:bg-zinc-800 text-white border border-black py-1 brutal-btn">
                      ⚡ AUTO
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/*  NEXT / SKIP BUTTON  */}
            <button id="btnSkip" onClick={skipToNextPeer}
              className="bg-vividyellow hover:bg-black hover:text-white border-4 border-black px-4 sm:px-6 py-2 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer">
              NEXT &rarr; [ESC]
            </button>

            {/*  STOP / LEAVE BUTTON  */}
            <button onClick={leaveChatRoom}
              className="bg-white hover:bg-hotred hover:text-white border-4 border-black px-4 py-2 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer">
              DISCONNECT
            </button>

            {/*  REPORT VIOLATION BUTTON  */}
            <button onClick={() => {}}
              className="bg-hotred text-white border-4 border-black px-3 sm:px-4 py-2 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer">
              ⚠️ REPORT
            </button>
          </div>
        </div>

        {/*  Stage Layout: Videos + Sticker Card Overlay + Text Chat  */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/*  Video & Partner Sticker Area (7 cols on lg)  */}
          <div className="lg:col-span-7 flex flex-col gap-4 relative">

            {/*  Remote Stream Box / Voice Stage  */}
            <div id="videoStageContainer"
              className="w-full bg-black border-4 border-black shadow-[8px_8px_0px_0px_#000] aspect-video relative overflow-hidden flex items-center justify-center">

              {/*  Remote Video Element  */}
              <video id="remoteVideo" ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"></video>

              {/*  Voice / Text Avatar Graphic (shown when no video stream)  */}
              <div id="voiceStageGraphic" className="hidden flex-col items-center justify-center p-8 text-center">
                <div
                  className="w-24 h-24 bg-vividyellow border-4 border-black rounded-full flex items-center justify-center text-4xl shadow-[4px_4px_0px_0px_#FFF] mb-3 animate-pulse">
                  🎙️
                </div>
                <h4 className="text-white text-xl font-black uppercase" id="voicePartnerName">Partner Connected</h4>
                <p className="text-vividyellow text-xs font-bold uppercase mt-1">P2P Audio Stream Active</p>

                {/*  Sound wave simulation  */}
                <div className="flex items-center gap-1.5 mt-4">
                  <span className="w-2 h-8 bg-hotred animate-bounce"></span>
                  <span className="w-2 h-12 bg-vividyellow animate-bounce" ></span>
                  <span className="w-2 h-6 bg-softviolet animate-bounce" ></span>
                  <span className="w-2 h-10 bg-white animate-bounce" ></span>
                  <span className="w-2 h-5 bg-hotred animate-bounce" ></span>
                </div>
              </div>

              {/*  Searching / Matchmaking Spinner Overlay  */}
              <div id="matchingOverlay"
                className={`${isMatching ? 'absolute' : 'hidden'} inset-0 bg-cream/95 flex flex-col items-center justify-center p-6 text-center z-20`}>
                <div
                  className="w-16 h-16 bg-hotred border-4 border-black flex items-center justify-center text-2xl font-black shadow-[4px_4px_0px_0px_#000] animate-spin mb-4">
                  ⚡
                </div>
                <h3 className="text-2xl font-black uppercase text-black">SEARCHING SOCIETY QUEUE...</h3>
                <p className="text-xs font-bold uppercase text-gray-700 mt-1 max-w-sm">
                  Querying 5,000+ verified members of RAHUL FOUNDATION SOCIETY. Matching in progress...
                </p>
                <button onClick={() => {}}
                  className="mt-4 bg-vividyellow border-2 border-black px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] hover:bg-white">
                  ⚡ FAST MATCH NOW (TEST PEER)
                </button>
              </div>

              {/*  Self Video Preview (Picture in Picture)  */}
              <div id="selfVideoWrapper"
                className="absolute bottom-3 right-3 w-36 sm:w-44 aspect-video bg-gray-900 border-3 border-black shadow-[4px_4px_0px_0px_#000] z-10 overflow-hidden">
                <video id="localVideo" ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                <div
                  className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[9px] font-black uppercase text-center py-0.5">
                  YOU (VERIFIED)
                </div>
              </div>

              {/*  Media Control Pills  */}
              <div className="absolute top-3 left-3 flex gap-2 z-10">
                <button id="toggleMicBtn" onClick={toggleMic}
                  className="bg-white hover:bg-vividyellow border-2 border-black px-2 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000]">
                  🎤 MIC ON
                </button>
                <button id="toggleCamBtn" onClick={toggleCam}
                  className="bg-white hover:bg-vividyellow border-2 border-black px-2 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000]">
                  📹 CAM ON
                </button>
              </div>

              {/*  Floating Live Stage Emoji Reaction Bar  */}
              <div id="stageReactionsBar"
                className="absolute bottom-3 left-3 z-10 bg-white/95 border-2 border-black p-1 shadow-[3px_3px_0px_0px_#000] flex items-center gap-1 backdrop-blur-xs">
                <span className="text-[9px] font-black uppercase text-black px-1 hidden sm:inline">REACT:</span>
                <button type="button" onClick={() => sendStageReaction('👍')} title="React 👍"
                  className="w-7 h-7 flex items-center justify-center text-sm bg-cream hover:bg-vividyellow border border-black transition-transform cursor-pointer select-none active:scale-90">👍</button>
                <button type="button" onClick={() => sendStageReaction('🔥')} title="React 🔥"
                  className="w-7 h-7 flex items-center justify-center text-sm bg-cream hover:bg-vividyellow border border-black transition-transform cursor-pointer select-none active:scale-90">🔥</button>
                <button type="button" onClick={() => sendStageReaction('❤️')} title="React ❤️"
                  className="w-7 h-7 flex items-center justify-center text-sm bg-cream hover:bg-vividyellow border border-black transition-transform cursor-pointer select-none active:scale-90">❤️</button>
                <button type="button" onClick={() => sendStageReaction('⚡')} title="React ⚡"
                  className="w-7 h-7 flex items-center justify-center text-sm bg-cream hover:bg-vividyellow border border-black transition-transform cursor-pointer select-none active:scale-90">⚡</button>
                <button type="button" onClick={() => sendStageReaction('🎓')} title="React 🎓"
                  className="w-7 h-7 flex items-center justify-center text-sm bg-cream hover:bg-vividyellow border border-black transition-transform cursor-pointer select-none active:scale-90">🎓</button>
                <button type="button" onClick={() => sendStageReaction('🎉')} title="React 🎉"
                  className="w-7 h-7 flex items-center justify-center text-sm bg-cream hover:bg-vividyellow border border-black transition-transform cursor-pointer select-none active:scale-90">🎉</button>
              </div>

            </div>

            {/*  ===============================================================  */}
            {/*  CRUCIAL DIFFERENCE FROM OMEGLE:                                   */}
            {/*  THE PHYSICAL "STICKER" OR ID BADGE SLAPPED ONTO THE SCREEN        */}
            {/*  ===============================================================  */}
            <div id="partnerStickerCard"
              className="w-full bg-vividyellow border-4 border-black p-4 sm:p-5 shadow-[8px_8px_0px_0px_#000] -rotate-1 relative transition-all">

              {/*  Red Attestation Stamp  */}
              <div className="absolute top-3 right-3 stamp-verified">
                VERIFIED RFC MEMBER
              </div>

              <div className="flex items-start gap-4">
                {/*  Avatar Badge  */}
                <div id="stickerAvatar"
                  className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center text-2xl font-black shadow-[3px_3px_0px_0px_#000] shrink-0">
                  🎓
                </div>

                <div className="flex-grow">
                  <span
                    className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-wider inline-block mb-1">
                    PARTNER VERIFIED IDENTITY CARD
                  </span>
                  <h3 id="stickerPartnerName" className="text-2xl font-black uppercase tracking-tight text-black">
                    {partnerProfile?.fullName || 'Connecting...'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span id="stickerPartnerRole"
                      className="bg-hotred text-white border-2 border-black px-2 py-0.5 text-xs font-black uppercase">
                      Role: Student
                    </span>
                    <span id="stickerPartnerId"
                      className="bg-white text-black border-2 border-black px-2 py-0.5 text-xs font-black uppercase">
                      ID: RFC-2024-XXXX
                    </span>
                    <span id="stickerPartnerPeerId"
                      className="bg-white text-black border-2 border-black px-2 py-0.5 text-xs font-black uppercase font-mono">
                      PEER: aura-rfc-xxxx
                    </span>
                    <span
                      className="bg-softviolet text-black border-2 border-black px-2 py-0.5 text-xs font-black uppercase">
                      RAHUL FOUNDATION SOCIETY
                    </span>
                  </div>
                </div>
              </div>

              {/*  Barcode, Block Action & Zero-Anonymity Notice  */}
              <div
                className="mt-3 pt-3 border-t-2 border-black flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase">
                <div className="flex items-center gap-2">
                  <span className="tracking-widest hidden sm:inline">||||| | |||| || |||||| | ||</span>
                  <span className="text-gray-900">IDENTITY RECORDED IN PERMANENT METADATA AUDIT</span>
                </div>
                <div className="flex items-center gap-2">
                  <button id="blockPartnerBtn" onClick={() => {}}
                    title="Permanently ignore and block this PeerID for the duration of this session"
                    className="bg-black hover:bg-hotred text-white border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-colors flex items-center gap-1.5 cursor-pointer">
                    <span>⛔ BLOCK USER</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/*  Text Chat Area (5 cols on lg)  */}
          <div
            className="lg:col-span-5 flex flex-col bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] h-[480px] sm:h-[540px]">

            {/*  Chat Header  */}
            <div className="bg-softviolet border-b-4 border-black p-3 flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm uppercase tracking-tight">REAL-TIME SANITIZED CHAT</h4>
                <span className="text-[10px] font-bold text-gray-800">XSS FILTERED // STRICT AUDIT ACTIVE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" id="chatSfxToggleBtn" onClick={() => {}}
                  title="Toggle Tactile Typewriter Key Audio"
                  className="text-[10px] bg-vividyellow text-black border-2 border-black px-2 py-0.5 font-black uppercase hover:brightness-105 flex items-center gap-1 cursor-pointer transition-colors shadow-[1px_1px_0px_0px_#000]">
                  <span id="chatSfxIcon">⌨️</span>
                  <span id="chatSfxText">SFX ON</span>
                </button>
                <button onClick={() => {}}
                  className="text-[10px] bg-white border-2 border-black px-2 py-0.5 font-black uppercase hover:bg-vividyellow shadow-[1px_1px_0px_0px_#000] cursor-pointer">
                  CLEAR
                </button>
              </div>
            </div>

            {/*  Chat Message Feed  */}
            
            <div id="chatMessageFeed" className="flex-grow p-3 sm:p-4 overflow-y-auto space-y-3 bg-cream">
              <div className="bg-vividyellow border-2 border-black p-2.5 text-xs font-bold shadow-[2px_2px_0px_0px_#000]">
                💡 <strong>System:</strong> Welcome to Aura. Your legal identity is visible to your peer. RAHUL FOUNDATION SOCIETY disciplinary guidelines strictly apply.
              </div>
              {chatMessages.map(msg => (
                <div key={msg.messageId} className={msg.isSelf ? "flex flex-col items-end" : "flex flex-col items-start"}>
                  <span className="text-[10px] font-black uppercase text-gray-600 mb-0.5">{msg.sender} ({msg.role})</span>
                  <div className={msg.isSelf ? "px-3 py-2 border-2 border-black font-bold text-sm bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]" : "px-3 py-2 border-2 border-black font-bold text-sm bg-white text-black shadow-[2px_2px_0px_0px_#00F0FF]"}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/*  PARTNER TYPING NOTIFICATION  */}
            <div id="partnerTypingIndicator"
              className={`${isPartnerTyping ? 'flex' : 'hidden'} items-center justify-between px-3 py-1.5 bg-vividyellow border-t-2 border-black text-xs font-black uppercase transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]`}>
              <div className="flex items-center gap-2 text-black">
                <span className="w-2.5 h-2.5 rounded-full bg-hotred animate-ping"></span>
                <span id="partnerTypingText">Partner is typing...</span>
                <div className="flex gap-1 items-center ml-1">
                  <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" ></span>
                  <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" ></span>
                  <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" ></span>
                </div>
              </div>
              <span className="text-[9px] bg-black text-white px-1.5 py-0.5 border border-black tracking-wider">
                TYPING
              </span>
            </div>

            {/*  Quick Topic Buttons  */}
            <div className="p-2 border-t-2 border-black bg-white flex flex-wrap gap-1.5 text-[10px] font-black">
              <span className="py-0.5 text-gray-500">ICEBREAKERS:</span>
              <button onClick={() => sendChatMessage('Hey! What department are you in?')}
                className="bg-cream hover:bg-vividyellow border border-black px-2 py-0.5">
                📚 Dept?
              </button>
              <button onClick={() => sendChatMessage('Heading to the campus canteen later?')}
                className="bg-cream hover:bg-vividyellow border border-black px-2 py-0.5">
                ☕ Canteen?
              </button>
              <button onClick={() => sendChatMessage('Are you working on college society projects?')}
                className="bg-cream hover:bg-vividyellow border border-black px-2 py-0.5">
                💻 Projects?
              </button>
            </div>

            {/*  Chat Input Bar  */}
            <form id="chatForm" onSubmit={handleChatSubmit}
              className="p-2 sm:p-3 border-t-4 border-black bg-white flex gap-2">
              <input type="text" id="chatTextInput" name="chatTextInput"
                onChange={(e) => sendTypingStatus(e.target.value.length > 0)} onBlur={() => sendTypingStatus(false)}
                placeholder="Type a message (XSS protected)..." autocomplete="off"
                className="flex-grow bg-white border-4 border-black p-2.5 font-bold text-xs sm:text-sm text-black placeholder-gray-500 focus:bg-vividyellow focus:outline-none transition-colors" />
              <button type="submit"
                className="bg-hotred hover:bg-vividyellow text-white hover:text-black border-4 border-black px-4 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                SEND
              </button>
            </form>

          </div>

        </div>

      </div>

    </section>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
