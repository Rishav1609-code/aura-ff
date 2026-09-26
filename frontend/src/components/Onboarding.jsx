import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';

export default function Onboarding() {
  const { token, setToken, setCurrentUser, BACKEND_URL } = useContext(AppContext);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/onboarding`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ full_name: fullName, mobile: mobile, id_card_url: "dummy_url" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Onboarding failed");
      
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
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
    <section id="onboardingSection" className="w-full flex flex-col items-center">
      <div className="text-center my-6 sm:my-8 flex flex-col items-center">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase stroke-headline leading-none">
          COMPLETE PROFILE
        </h1>
        <p className="text-lg sm:text-2xl font-black tracking-wider uppercase mt-3 text-black max-w-2xl mx-auto">
          Final Verification Step
        </p>
      </div>

      <div className="w-full max-w-xl bg-[#4ade80] border-4 border-black p-6 sm:p-8 shadow-[12px_12px_0px_0px_#000] mb-12">
        <form id="onboardingForm" onSubmit={handleSubmit} noValidate className="space-y-4">
          {/*  1. NAME  */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="inputFullName" className="block font-black uppercase text-xs tracking-wider">
                1. FULL NAME *
              </label>
              <span className="text-[10px] font-black bg-white border border-black px-1.5 py-0.5">MAX 50 CHARS</span>
            </div>
            <input type="text" id="inputFullName" value={fullName} onChange={e => setFullName(e.target.value)} name="fullName" required maxLength="50"
              placeholder="Enter your full name"
              className="w-full bg-white border-4 border-black p-3 font-bold text-black placeholder-gray-500 focus:bg-[#FFD93D] focus-visible:bg-[#FFD93D] focus:outline-none transition-colors shadow-[4px_4px_0px_0px_#000]" />
          </div>

          {/*  2. MOBILE NO  */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="inputMobile" className="block font-black uppercase text-xs tracking-wider">
                2. MOBILE NO *
              </label>
              <span className="text-[10px] font-black bg-white border border-black px-1.5 py-0.5">EXACTLY 10 DIGITS</span>
            </div>
            <input type="tel" id="inputMobile" value={mobile} onChange={e => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} name="mobile" required pattern="[0-9]{10}" maxLength="10"
              placeholder="10-digit mobile number"
              className="w-full bg-white border-4 border-black p-3 font-bold text-black placeholder-gray-500 focus:bg-[#FFD93D] focus-visible:bg-[#FFD93D] focus:outline-none transition-colors shadow-[4px_4px_0px_0px_#000]" />
          </div>

          {/*  3. ORIGINAL ID CARD  */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-black uppercase text-xs tracking-wider">
                3. ORIGINAL ID CARD *
              </label>
              <span className="text-[10px] font-black bg-white border border-black px-1.5 py-0.5">REQUIRED</span>
            </div>
            <div id="dropZone" onClick={() => document.getElementById('fileInputId').click()}
              className="border-4 border-dashed border-black bg-white p-4 text-center cursor-pointer hover:bg-cream transition-colors shadow-[4px_4px_0px_0px_#000]">
              <input type="file" id="fileInputId" name="idCard" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  document.getElementById('uploadPrompt').classList.add('hidden');
                  document.getElementById('uploadPreview').classList.remove('hidden');
                  document.getElementById('uploadedFileName').textContent = file.name;
                }
              }} />
              <div id="uploadPrompt">
                <span className="text-3xl block mb-1">📷</span>
                <p className="font-black text-sm uppercase">CLICK TO BROWSE OR DRAG ID CARD HERE</p>
              </div>
              <div id="uploadPreview" className="hidden">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="text-left">
                    <p id="uploadedFileName" className="font-black text-xs uppercase truncate max-w-[200px]">card.png</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button type="submit"
            className="w-full bg-hotred hover:bg-vividyellow text-black border-4 border-black p-4 font-black text-lg uppercase tracking-wider shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer mt-3">
            SUBMIT FOR VERIFICATION &rarr;
          </button>
        </form>
      </div>
    </section>

    </>
  );
}
