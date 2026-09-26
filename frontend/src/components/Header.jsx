import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function Header() {
  const { globalOnlineCount } = useContext(AppContext);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('aura_theme') || 'dark';
    applyTheme(savedTheme === 'dark');
  }, []);

  const applyTheme = (dark) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('aura_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('aura_theme', 'light');
    }
  };

  const toggleTheme = () => {
    applyTheme(!isDark);
  };

  return (
    <>
  {/*  =======================================================================  */}
  {/*  TOP NAVIGATION HEADER  */}
  {/*  =======================================================================  */}
  <header className="border-b-4 border-black bg-white dark:bg-zinc-900 sticky top-0 z-40 transition-colors">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">

      {/*  Logo & Organization Badge  */}
      <div className="flex items-center gap-3">
        <a href="#" className="flex items-center gap-2 group">
          <div
            className="bg-hotred text-white border-4 border-black px-3 py-1 font-black text-2xl tracking-tighter shadow-[4px_4px_0px_0px_#000] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
            AURA
          </div>
        </a>

        <div
          className="hidden md:inline-flex items-center bg-cream dark:bg-zinc-800 dark:text-white border-2 border-black px-2 py-1 text-[11px] font-black uppercase tracking-wider">
          🏛️ RAHUL FOUNDATION SOCIETY // 5,000+ MEMBERS
        </div>
      </div>

      {/*  Controls: Theme Toggle & Online Counter  */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/*  Neo-Brutalist Theme Switcher (Dark / Light)  */}
        <button type="button" id="themeToggleBtn" onClick={toggleTheme} className={isDark ? "bg-[#FFE600] hover:bg-[#39FF14] text-black border-4 border-[#00F0FF] px-3 sm:px-4 py-1.5 font-black text-xs sm:text-sm shadow-[4px_4px_0px_0px_#00F0FF] rounded-none transition-all cursor-pointer select-none active:translate-x-[1px] active:translate-y-[1px]" : "bg-black hover:bg-[#FFE600] hover:text-black text-[#FFE600] border-4 border-black px-3 sm:px-4 py-1.5 font-black text-xs sm:text-sm shadow-[4px_4px_0px_0px_#FFE600] rounded-none transition-all cursor-pointer select-none active:translate-x-[1px] active:translate-y-[1px]"}
          title="Toggle Neo-Brutalist High-Contrast Dark & Light Mode">
          {isDark ? <span className="flex items-center gap-1.5"><span>☀️</span><span>LIGHT MODE</span></span> : <span className="flex items-center gap-1.5"><span>🌙</span><span>DARK MODE</span></span>}
        </button>

        {/*  Online Users Pill Badge with Hard Shadow  */}
        <div id="onlineCounterBadge"
          className="bg-vividyellow border-4 border-black px-3 sm:px-4 py-1.5 font-black text-xs sm:text-sm shadow-[4px_4px_0px_0px_#000] rounded-full flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-black animate-pulse"></span>
          <span id="onlineCountText">{globalOnlineCount}</span>
          <span className="hidden sm:inline">VERIFIED ONLINE</span>
        </div>
      </div>

    </div>
  </header>

    </>
  );
}
