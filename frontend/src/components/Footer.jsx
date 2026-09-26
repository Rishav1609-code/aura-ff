import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function Footer() {
  const { setIsAdminView } = useContext(AppContext);

  return (
    <footer className="border-t-4 border-black bg-white mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
        <div>
          <span className="bg-vividyellow border-2 border-black px-2 py-0.5 font-black uppercase text-black">AURA v1.0</span>
          <span className="ml-2">BUILT BY <strong>vXr HOLDINGS</strong> (Vishu Raj - CVO, Rishav Raj - CEO)</span>
        </div>
        <div className="text-gray-700">
          EXCLUSIVELY FOR 5000+ MEMBERS OF <strong>RAHUL FOUNDATION SOCIETY</strong>
        </div>
        <div>
          <button type="button" onClick={() => setIsAdminView(true)} className="text-[11px] underline font-black hover:text-hotred">
            ADMINISTRATOR PORTAL
          </button>
        </div>
      </div>
    </footer>
  );
}
