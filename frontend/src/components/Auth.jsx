import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useGoogleLogin } from '@react-oauth/google';

export default function Auth() {
  const { setToken, setCurrentUser, BACKEND_URL } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(false);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('aura_auth_token', data.token);
    const userObj = {
      id: data.user.id,
      fullName: data.user.full_name || data.user.email,
      username: data.user.username || data.user.email,
      role: data.user.role || "Student",
      societyId: data.user.society_id || "",
      status: data.user.status,
      verified: data.user.status === 'verified',
      email: data.user.email
    };
    localStorage.setItem('aura_rfc_session', JSON.stringify(userObj));
    setToken(data.token);
    setCurrentUser(userObj);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeResponse.code })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Google auth failed");
        handleAuthSuccess(data);
      } catch (err) {
        setError(err.message);
      }
    },
    onError: () => setError("Google login failed")
  });

  const handleGithubMock = async () => {
    try {
      const mockCode = Math.random().toString(36).substring(7);
      const res = await fetch(`${BACKEND_URL}/api/auth/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mockCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Github auth failed");
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
    <section id="authSection" className="w-full flex flex-col items-center">

      {/*  Massive Bold Retro-Modern Headline  */}
      <div className="text-center my-6 sm:my-8 flex flex-col items-center">
        <div
          className="inline-block bg-vividyellow border-4 border-black px-4 py-1.5 font-black text-xs sm:text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] mb-4 -rotate-1">
          ZERO ANONYMITY // 100% IDENTITY-ATTESTED P2P NETWORK
        </div>
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter uppercase stroke-headline leading-none">
          A U R A
        </h1>
        <p
          className="text-lg sm:text-2xl font-black tracking-wider uppercase mt-3 text-black dark:text-white max-w-2xl mx-auto">
          Randomized 1-on-1 Video, Voice &amp; Text Communication
        </p>

        {/*  High-Contrast Clean Attribution Badge (Prevents background dots bleeding through)  */}
        <div
          className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 bg-[#a7a7e6] border-2 sm:border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_#000] max-w-2xl mx-auto">
          <span className="text-xs sm:text-sm font-black tracking-wider text-black uppercase">
            ENGINEERED EXCLUSIVELY FOR <strong className="text-black underline decoration-2 decoration-black">RAHUL
              FOUNDATION SOCIETY</strong> BY
          </span>
          <span
            className="bg-vividyellow text-black border-2 border-black px-2.5 py-0.5 font-black text-xs sm:text-sm uppercase shadow-[2px_2px_0px_0px_#000] tracking-wider">
            vXr HOLDINGS
          </span>
        </div>
      </div>

      {/*  Prominent ZERO TOLERANCE POLICY Disclaimer Box  */}
      <div
        className="w-full max-w-4xl bg-hotred border-4 border-black p-6 sm:p-8 shadow-[10px_10px_0px_0px_#000] mb-10 rotate-1">
        <div className="flex items-start gap-4">
          <div className="bg-black text-white border-4 border-white p-3 font-black text-3xl shrink-0 hidden sm:block">
            ⚠️
          </div>
          <div>
            <div
              className="inline-block bg-black text-white px-3 py-1 font-black text-xs sm:text-sm uppercase tracking-widest mb-2">
              CRITICAL DIRECTIVE // DISCIPLINARY NOTICE
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-tight">
              ZERO TOLERANCE POLICY: PERMANENT EXPULSION
            </h2>
            <p className="text-white font-bold text-sm sm:text-base mt-2 leading-relaxed">
              Aura is strictly <strong className="underline decoration-2">NON-ANONYMOUS</strong>. Every participant's Real
              Name, Society Role, and Original ID Card are cryptographically bound to every session. Obscenity, sexual
              misconduct, harassment, hate speech, recording without consent, or ragging will result in:
            </p>

            {/*  Extreme Emphasis Banner  */}
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4">
              <span
                className="bg-white text-black border-4 border-black px-3 py-1 font-black text-sm uppercase shadow-[3px_3px_0px_0px_#000]">
                NOT AT ALL
              </span>
              <span className="text-2xl font-black text-black">—</span>
              <span
                className="bg-vividyellow text-black border-4 border-black px-3 py-1 font-black text-sm uppercase shadow-[3px_3px_0px_0px_#000]">
                NEVER
              </span>
              <span className="text-2xl font-black text-black">—</span>
              <span
                className="bg-black text-white border-4 border-black px-3 py-1 font-black text-sm uppercase shadow-[3px_3px_0px_0px_#FFF]">
                EVER
              </span>
              <span
                className="text-xs font-black uppercase tracking-wider text-black bg-cream border-2 border-black px-2 py-1 ml-auto">
                Violations immediately escalated to College Administration &amp; Police
              </span>
            </div>
          </div>
        </div>
      </div>

      {/*  =====================================================================  */}
      {/*  MASSIVE NEO-BRUTALIST SECTION: AURA MANIFESTO & RULES OF ENGAGEMENT  */}
      {/*  =====================================================================  */}
      <div
        className="w-full bg-[#FFFDF5] border-y-8 border-black py-10 sm:py-14 px-4 sm:px-8 mb-12 shadow-[12px_12px_0px_0px_#000]">
        <div className="max-w-5xl mx-auto">

          {/*  Manifesto Header  */}
          <div className="text-center mb-10 sm:mb-12">
            <div
              className="inline-block bg-[#ff6b6b] border-4 border-black px-4 py-1 font-black text-xs sm:text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] mb-3 rotate-1">
              CAMPUS PROTOCOL // CORE DIRECTIVES
            </div>

            {/*  Massive stroked headline overlapping solid black subtitle  */}
            <div className="relative flex flex-col items-center">
              <h2
                className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase stroke-manifesto leading-none select-none">
                THE AURA MANIFESTO
              </h2>
              <div
                className="inline-block bg-black text-white border-4 border-black px-4 sm:px-6 py-1.5 sm:py-2 font-black text-sm sm:text-lg md:text-xl uppercase tracking-widest mt-2 sm:-mt-3 shadow-[6px_6px_0px_0px_#FFD93D] -rotate-1 z-10">
                UPGRADING THE COLLECTIVE MINDSET.
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-800 mt-4 max-w-xl mx-auto">
              Strict Rules of Engagement for all verified members of Rahul Foundation Society.
            </p>
          </div>

          {/*  2x2 Grid Layout for the 4 Core Directives (Sticker Cards)  */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

            {/*  CARD 1 (The Mission)  */}
            <div
              className="bg-[#a7a7e6] border-4 border-black p-6 sm:p-7 shadow-[8px_8px_0px_0px_#000] -rotate-1 hover:rotate-0 transition-transform duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="bg-[#FFD93D] text-black border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
                    [ 01 / VISION ]
                  </span>
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mb-3">
                  RADICAL FRIENDLINESS
                </h3>
                <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                  Our mission is to dismantle outdated social barriers and upgrade the collective mindset. AURA is a
                  secure space to connect with anyone—students, professors, and staff—with mutual respect and a casual,
                  professional mindset.
                </p>
              </div>
              <div
                className="mt-5 pt-3 border-t-2 border-black flex items-center justify-between text-[10px] font-black uppercase text-gray-700">
                <span>RAHUL FOUNDATION SOCIETY</span>
                <span className="bg-black text-white px-1.5 py-0.5">DIRECTIVE 01</span>
              </div>
            </div>

            {/*  CARD 2 (The Growth)  */}
            <div
              className="bg-[#a7a7e6] border-4 border-black p-6 sm:p-7 shadow-[8px_8px_0px_0px_#000] rotate-1 hover:rotate-0 transition-transform duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="bg-[#4ADE80] text-black border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
                    [ 02 / GROWTH ]
                  </span>
                  <span className="text-2xl">🎙️</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mb-3">
                  MASTER COMMUNICATION
                </h3>
                <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                  Drop in. Speak up. Whether you are practicing English, Hindi, Bengali, or Bhojpuri, AURA is your
                  training ground to build ultimate confidence and master the art of conversation with strangers.
                </p>
              </div>
              <div
                className="mt-5 pt-3 border-t-2 border-black flex items-center justify-between text-[10px] font-black uppercase text-gray-700">
                <span>MULTILINGUAL FLUENCY</span>
                <span className="bg-black text-white px-1.5 py-0.5">DIRECTIVE 02</span>
              </div>
            </div>

            {/*  CARD 3 (The Boundary)  */}
            <div
              className="bg-[#a7a7e6] border-4 border-black p-6 sm:p-7 shadow-[8px_8px_0px_0px_#000] -rotate-1 hover:rotate-0 transition-transform duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="bg-[#FF6B6B] text-white border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
                    [ 03 / BOUNDARY ]
                  </span>
                  <span className="text-2xl">🚫</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mb-3">
                  STRICTLY NOT A DATING APP
                </h3>
                <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                  AURA exists for networking and skill-building. Do not treat this platform as a dating service. Any
                  attempts to use this network for unsolicited romantic pursuits will result in immediate termination.
                </p>
              </div>
              <div
                className="mt-5 pt-3 border-t-2 border-black flex items-center justify-between text-[10px] font-black uppercase text-gray-700">
                <span>PROFESSIONAL INTEGRITY</span>
                <span className="bg-hotred text-white px-1.5 py-0.5">ZERO ROMANCE</span>
              </div>
            </div>

            {/*  CARD 4 (The Law)  */}
            <div
              className="bg-[#a7a7e6] border-4 border-black p-6 sm:p-7 shadow-[8px_8px_0px_0px_#000] rotate-1 hover:rotate-0 transition-transform duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="bg-[#FF6B6B] text-white border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
                    [ 04 / CONSENT &amp; LAW ]
                  </span>
                  <span className="text-2xl">⚖️</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mb-3">
                  DIGITAL CONSENT &amp; ACCOUNTABILITY
                </h3>
                <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                  You are not anonymous here. Your actions have absolute consequences. Furthermore, capturing
                  screenshots or recording without the explicit verbal consent of the connected user is a severe privacy
                  violation and grounds for an instant, permanent ban.
                </p>
              </div>
              <div
                className="mt-5 pt-3 border-t-2 border-black flex items-center justify-between text-[10px] font-black uppercase text-gray-700">
                <span>FULL METADATA AUDIT</span>
                <span className="bg-black text-white px-1.5 py-0.5">PERMANENT BAN</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/*  Authentication Panel: Heavily styled, off-axis card with Soft Violet background  */}
      <div
        className="w-full max-w-xl bg-[#4ade80] border-4 border-black p-6 sm:p-8 shadow-[12px_12px_0px_0px_#000] -rotate-1 hover:rotate-0 transition-transform duration-200 mb-12">

        {/*  Chunky Neo-Brutalist Toggle Tabs  */}
        <div className="flex items-center gap-2 mb-6">
          <button type="button" id="tabVerifyBtn" onClick={() => setIsLogin(false)}
            className={`flex-1 ${!isLogin ? 'bg-vividyellow' : 'bg-cream'} text-black border-4 border-black p-3 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] ${!isLogin ? 'translate-x-[2px] translate-y-[2px]' : 'hover:bg-white'} cursor-pointer rounded-none transition-all select-none`}>
            [ GET VERIFIED ]
          </button>
          <button type="button" id="tabLoginBtn" onClick={() => setIsLogin(true)}
            className={`flex-1 ${isLogin ? 'bg-vividyellow' : 'bg-cream'} text-black border-4 border-black p-3 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] ${isLogin ? 'translate-x-[2px] translate-y-[2px]' : 'hover:bg-white'} cursor-pointer rounded-none transition-all select-none`}>
            [ ENTER AURA ]
          </button>
        </div>

        <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-6">
          <div>
            <span id="authCardSubtitle"
              className="bg-vividyellow border-2 border-black px-2 py-0.5 font-black text-[10px] uppercase">
              RFC SECURE ENTRY // ZERO ANONYMITY
            </span>
            <h3 id="authCardTitle" className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">
              GET VERIFIED
            </h3>
          </div>
          <div id="authCardIcon"
            className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_#000]">
            🪪
          </div>
        </div>

        {/*  Neo-Brutalist Validation Error Alert Box  */}
        <div id="authErrorAlert"
          className="hidden bg-hotred text-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_#000] mb-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <div
                className="font-black text-[10px] uppercase tracking-widest text-black bg-white inline-block px-1.5 py-0.5 mb-1">
                SECURITY &amp; VALIDATION ERROR
              </div>
              <p id="authErrorText" className="font-black text-xs sm:text-sm uppercase text-white leading-tight">
                VALIDATION ERROR OCCURRED
              </p>
            </div>
          </div>
        </div>

        
        {/*  TAB 1: "GET VERIFIED" FORM  */}
        <form id="authForm" onSubmit={handleRegisterSubmit} noValidate className={!isLogin ? "space-y-4" : "hidden space-y-4"}>
          {/*  EMAIL  */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="inputEmail" className="block font-black uppercase text-xs tracking-wider">
                EMAIL *
              </label>
              <span className="text-[10px] font-black bg-white border border-black px-1.5 py-0.5">REQUIRED</span>
            </div>
            <input type="email" id="inputEmail" value={email} onChange={e => setEmail(e.target.value)} name="email" required
              placeholder="Enter your email"
              className="w-full bg-white border-4 border-black p-3 font-bold text-black placeholder-gray-500 focus:bg-[#FFD93D] focus-visible:bg-[#FFD93D] focus:outline-none transition-colors shadow-[4px_4px_0px_0px_#000]" />
          </div>

          {/*  CREATE PASSWORD  */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="inputPassword" className="block font-black uppercase text-xs tracking-wider">
                PASSWORD *
              </label>
              <span className="text-[10px] font-black bg-white border border-black px-1.5 py-0.5">MIN 6 CHARS</span>
            </div>
            <input type="password" id="inputPassword" value={password} onChange={e => setPassword(e.target.value)} name="password" required minlength="6"
              placeholder="Min 6 characters"
              className="w-full bg-white border-4 border-black p-3 font-bold text-black placeholder-gray-500 focus:bg-[#FFD93D] focus-visible:bg-[#FFD93D] focus:outline-none transition-colors shadow-[4px_4px_0px_0px_#000]" />
          </div>

          {/*  Submit Button  */}
          <button type="submit"
            className="w-full bg-hotred hover:bg-vividyellow text-black border-4 border-black p-4 font-black text-lg uppercase tracking-wider shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer mt-3">
            REGISTER &rarr;
          </button>

          {/*  OAuth Buttons UI  */}
          <div className="mt-4 flex flex-col items-center gap-3">
            <span className="text-xs font-black uppercase text-gray-800">— OR —</span>
            
            <button type="button" onClick={() => loginWithGoogle()}
              className="w-full max-w-[220px] bg-white hover:bg-gray-100 text-black border-2 border-black p-2 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Google
            </button>

            {/*  Github Button  */}
            <button type="button" onClick={handleGithubMock}
              className="w-full max-w-[220px] bg-black hover:bg-gray-800 text-white border-2 border-black p-2 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2">
              <svg height="16" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
              Sign up with GitHub
            </button>
          </div>
        </form>


        
        {/*  TAB 2: "ENTER AURA" LOGIN FORM  */}
        <form id="loginForm" onSubmit={handleLoginSubmit} noValidate className={isLogin ? "space-y-4" : "hidden space-y-4"}>
          {/*  EMAIL  */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="loginEmail" className="block font-black uppercase text-xs tracking-wider">
                EMAIL *
              </label>
            </div>
            <input type="email" id="loginEmail" value={email} onChange={e => setEmail(e.target.value)} name="loginEmail" required
              placeholder="Enter your email"
              className="w-full bg-white border-4 border-black p-3 font-bold text-black placeholder-gray-500 focus:bg-[#FFD93D] focus-visible:bg-[#FFD93D] focus:outline-none transition-colors shadow-[4px_4px_0px_0px_#000] rounded-none" />
          </div>

          {/*  PASSWORD  */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="loginPassword" className="block font-black uppercase text-xs tracking-wider">
                PASSWORD *
              </label>
            </div>
            <input type="password" id="loginPassword" value={password} onChange={e => setPassword(e.target.value)} name="loginPassword" required
              placeholder="Enter your account password"
              className="w-full bg-white border-4 border-black p-3 font-bold text-black placeholder-gray-500 focus:bg-[#FFD93D] focus-visible:bg-[#FFD93D] focus:outline-none transition-colors shadow-[4px_4px_0px_0px_#000] rounded-none" />
          </div>

          {/*  Massive Hot Red Submit Button  */}
          <button type="submit"
            className="w-full bg-hotred hover:bg-vividyellow text-black border-4 border-black p-4 font-black text-lg uppercase tracking-wider shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer mt-4">
            ENTER THE NETWORK &rarr;
          </button>

          {/*  OAuth Buttons UI  */}
          <div className="mt-4 flex flex-col items-center gap-3">
            <span className="text-xs font-black uppercase text-gray-800">— OR —</span>
            
            <button type="button" onClick={() => loginWithGoogle()}
              className="w-full max-w-[220px] bg-white hover:bg-gray-100 text-black border-2 border-black p-2 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Sign in with Google
            </button>

            {/*  Github Button  */}
            <button type="button" onClick={handleGithubMock}
              className="w-full max-w-[220px] bg-black hover:bg-gray-800 text-white border-2 border-black p-2 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2">
              <svg height="16" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
              Sign in with GitHub
            </button>
          </div>
        </form>

      </div>

    </section>

    </>
  );
}
