import React from 'react';

export default function SettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-cream text-black border-4 border-black shadow-[12px_12px_0px_0px_#000] flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-black text-white p-4 flex justify-between items-center border-b-4 border-black">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <span>⚙️</span> SYSTEM SETTINGS
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-hotred border-2 border-white hover:bg-white hover:text-black hover:border-black font-black text-xl flex items-center justify-center transition-colors shadow-[4px_4px_0px_0px_#fff] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* AUDIO & VIDEO */}
          <section className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h3 className="bg-vividyellow inline-block px-3 py-1 font-black uppercase text-sm border-2 border-black mb-4 shadow-[2px_2px_0px_0px_#000]">
              Media Hardware
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block font-black text-xs uppercase mb-1">Microphone Input</label>
                <select className="w-full border-4 border-black p-3 font-bold bg-cream text-black focus:bg-white focus:outline-none focus:border-hotred appearance-none cursor-pointer">
                  <option>Default - System Microphone</option>
                  <option>External USB Mic (if connected)</option>
                </select>
              </div>
              <div>
                <label className="block font-black text-xs uppercase mb-1">Camera Source</label>
                <select className="w-full border-4 border-black p-3 font-bold bg-cream text-black focus:bg-white focus:outline-none focus:border-hotred appearance-none cursor-pointer">
                  <option>Default - HD Web Camera</option>
                  <option>Virtual Camera Output</option>
                </select>
              </div>
            </div>
          </section>

          {/* PRIVACY & PROTOCOL */}
          <section className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h3 className="bg-emerald-400 inline-block px-3 py-1 font-black uppercase text-sm border-2 border-black mb-4 shadow-[2px_2px_0px_0px_#000]">
              Privacy & Connectivity
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="sr-only" defaultChecked />
                  <div className="w-12 h-6 border-2 border-black bg-emerald-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-black after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </div>
                <span className="font-bold text-sm uppercase group-hover:text-hotred transition-colors">Enable Zero-Anonymity Protocol</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="sr-only" defaultChecked />
                  <div className="w-12 h-6 border-2 border-black bg-emerald-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-black after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </div>
                <span className="font-bold text-sm uppercase group-hover:text-hotred transition-colors">Background Noise Suppression</span>
              </label>
            </div>
          </section>
          
        </div>

        {/* FOOTER */}
        <div className="bg-gray-100 p-4 border-t-4 border-black flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 bg-white border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_#000] hover:bg-gray-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
            Cancel
          </button>
          <button onClick={() => {
            alert("Settings applied and saved locally.");
            onClose();
          }} className="px-6 py-2 bg-emerald-400 border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_#000] hover:bg-emerald-500 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
