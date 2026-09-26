import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useGoogleLogin } from '@react-oauth/google';


export default function AdminDashboard() {
  const { BACKEND_URL, setIsAdminView } = useContext(AppContext);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('aura_admin_token'));
  const [adminId, setAdminId] = useState('');
  const [passkey, setPasskey] = useState('');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('clearances');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const loginWithGoogleAdmin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeResponse.code })
        });
        const data = await res.json();
        if (res.ok) {
          setAdminToken(data.token);
          localStorage.setItem('aura_admin_token', data.token);
        } else {
          setError(data.detail || 'Admin access denied');
        }
      } catch (err) {
        setError(err.message);
      }
    },
    flow: 'auth-code',
    onError: () => setError('Google Login Failed')
  });


  useEffect(() => {
    if (adminToken) {
      if (activeTab === 'clearances') fetchPendingUsers();
      if (activeTab === 'directory') fetchAllUsers();
    }
  }, [adminToken, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, passkey })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      
      localStorage.setItem('aura_admin_token', data.token);
      setAdminToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/pending`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch');
      setPendingUsers(data.pending_users || []);
    } catch (err) {
      console.error(err);
      if (err.message === 'Forbidden') {
        handleLogout();
      }
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch users');
      setAllUsers(data.users || []);
    } catch (err) {
      console.error(err);
      setError('fetchAllUsers failed: ' + err.message);
    }
  };

  const filteredUsers = allUsers.filter(user => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
                          (user.full_name || '').toLowerCase().includes(query) || 
                          (user.email || '').toLowerCase().includes(query) ||
                          (user.username || '').toLowerCase().includes(query);
    
    if (roleFilter === 'ALL') return matchesSearch;
    if (roleFilter === 'BANNED') return matchesSearch && user.status === 'banned';
    
    return matchesSearch && (user.role || 'Student').toUpperCase() === roleFilter;
  });

  const handleAction = async (userId, action) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/${action}/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        fetchPendingUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aura_admin_token');
    setAdminToken(null);
  };

  if (!adminToken) {
    return (
      <div className="flex-1 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-4 relative">
        
        <div className="w-full max-w-2xl bg-white text-black border-4 border-black p-8 shadow-[16px_16px_0px_0px_#FFD93D] relative mt-10">
          <button onClick={() => setIsAdminView(false)} className="absolute -top-4 -right-4 w-10 h-10 bg-hotred border-4 border-black text-white font-black flex items-center justify-center hover:bg-white hover:text-black transition-colors z-10 text-xl cursor-pointer shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">✕</button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center flex-shrink-0">
               <span className="text-xl leading-none">▲</span>
            </div>
            <div>
              <span className="bg-hotred text-white text-[10px] font-black tracking-widest px-1.5 py-0.5 uppercase block w-max mb-1">
                CONFIDENTIAL // vXr HOLDINGS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none m-0">AURA ADMINISTRATIVE CONTROLLER</h2>
            </div>
          </div>
          
          <hr className="border-t-4 border-black mb-4" />
          
          <p className="text-[10px] sm:text-xs font-black text-gray-700 uppercase mb-8 leading-tight">
            Authorized access only for vXr Holdings Executive Officers (Vishu Raj, CVO; Rishav Raj, CEO) and RAHUL FOUNDATION SOCIETY Disciplinary Committee.
          </p>

          {error && <div className="bg-hotred text-white p-3 mb-6 font-black border-4 border-black uppercase text-xs shadow-[4px_4px_0px_0px_#000]">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-black uppercase text-[10px] tracking-widest mb-2 text-black">ADMINISTRATOR ID</label>
              <input type="text" value={adminId} onChange={e => setAdminId(e.target.value)} required
                className="w-full border-4 border-black p-3 font-bold bg-[#FFD93D] focus:bg-white focus:outline-none transition-colors text-sm" />
            </div>
            <div>
              <label className="block font-black uppercase text-[10px] tracking-widest mb-2 text-black">SECURE PASSKEY</label>
              <input type="password" value={passkey} onChange={e => setPasskey(e.target.value)} required
                className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none transition-colors text-sm" />
            </div>
            <button type="submit" className="w-full bg-[#FFD93D] hover:bg-yellow-300 text-black border-4 border-black p-3.5 font-black text-sm transition-colors cursor-pointer uppercase shadow-[6px_6px_0px_0px_#000] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]">
              UNLOCK CONTROLLER →
            </button>
          </form>

          <div className="mt-6">
            <div className="relative flex items-center mb-6">
              <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
            </div>

            <button type="button" onClick={() => loginWithGoogleAdmin()}
              className="w-full bg-white hover:bg-gray-100 text-black border-4 border-black p-3.5 font-black text-sm transition-colors flex items-center justify-center gap-3 uppercase shadow-[6px_6px_0px_0px_#000] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              AUTHENTICATE VIA GOOGLE
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream text-black min-h-screen flex flex-col selection:bg-hotred selection:text-white">
      {/* TOP SYSTEM BANNER */}
      <header className="bg-black text-white border-b-4 border-black px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsAdminView(false)}>
            <div className="w-8 h-8 bg-vividyellow text-black border-2 border-white flex items-center justify-center font-black text-lg group-hover:bg-hotred group-hover:text-white transition-colors">
              ▲
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-vividyellow block leading-none">AURA // vXr HOLDINGS</span>
              <span className="text-base font-black tracking-tight block leading-none">COMMAND CENTER</span>
            </div>
          </div>
          <span className="hidden md:inline-block bg-hotred text-white text-[10px] font-black uppercase px-2 py-0.5 border border-white">
            ROOT CLEARANCE LEVEL 0
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 px-2.5 py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-neongreen animate-pulse"></span>
            <span>CAMPUS MESH: <strong className="text-neongreen">ONLINE</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 px-2.5 py-1">
            <span>ACTIVE PEERS: <strong className="text-vividyellow">Loading...</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 px-2.5 py-1">
            <span>14:09:27 UTC</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-black text-vividyellow">AURA-SYS-VISHU</div>
            <div className="text-[10px] font-bold text-gray-400">CHIEF VISIONARY OFFICER</div>
          </div>
          <button onClick={() => setIsAdminView(false)} className="bg-vividyellow hover:bg-hotred hover:text-white text-black border-2 border-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center gap-1">
            <span>RETURN TO PORTAL &rarr;</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {error && (
          <div className="absolute top-0 left-0 w-full z-50 bg-hotred text-white p-2 text-center font-bold border-b-4 border-black uppercase text-xs">
            ERROR: {error}
          </div>
        )}
        
        {/* FIXED LEFT SIDEBAR */}
        <aside className="w-full md:w-64 lg:w-72 bg-cream border-b-4 md:border-b-0 md:border-r-4 border-black p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            
            <div className="bg-white border-4 border-black p-3.5 shadow-[6px_6px_0px_0px_#000]">
              <div className="flex items-center gap-2.5 mb-2 pb-2 border-b-2 border-black">
                <div className="w-9 h-9 bg-hotred text-white border-2 border-black flex items-center justify-center font-black text-base">
                  ⚡
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-black uppercase bg-vividyellow px-1.5 py-0.5 border border-black inline-block mb-0.5">ADMINISTRATOR</span>
                  <p className="font-black text-sm truncate">AURA-SYS-VISHU</p>
                </div>
              </div>
              <p className="text-[11px] font-bold text-gray-700 leading-tight">
                Rahul Foundation Society Disciplinary & Infrastructure Command Node.
              </p>
            </div>

            <nav className="space-y-2.5">
              <button 
                onClick={() => setActiveTab('clearances')}
                className={`w-full text-left border-4 border-black p-3 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] flex items-center justify-between transition-colors ${activeTab === 'clearances' ? 'bg-vividyellow text-black' : 'bg-white text-black hover:bg-cream'}`}
              >
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  <span>PENDING CLEARANCES</span>
                </div>
                <span className="bg-hotred text-white border-2 border-black text-[10px] font-black px-1.5 py-0.5">{pendingUsers.length}</span>
              </button>

              <button 
                onClick={() => setActiveTab('directory')}
                className={`w-full text-left border-4 border-black p-3 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] flex items-center justify-between transition-colors ${activeTab === 'directory' ? 'bg-vividyellow text-black' : 'bg-white text-black hover:bg-cream'}`}
              >
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span>USER & ADMIN DIRECTORY</span>
                </div>
                <span className="text-xs">&rarr;</span>
              </button>

              <button 
                onClick={() => setActiveTab('noticeboard')}
                className={`w-full text-left border-4 border-black p-3 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] flex items-center justify-between transition-colors ${activeTab === 'noticeboard' ? 'bg-vividyellow text-black' : 'bg-white text-black hover:bg-cream'}`}
              >
                <div className="flex items-center gap-2">
                  <span>📢</span>
                  <span>SOCIETY NOTICEBOARD</span>
                </div>
                <span className="text-xs">&rarr;</span>
              </button>

              <button 
                onClick={() => setActiveTab('moderation')}
                className={`w-full text-left border-4 border-black p-3 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] flex items-center justify-between transition-colors ${activeTab === 'moderation' ? 'bg-vividyellow text-black' : 'bg-white text-black hover:bg-cream'}`}
              >
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span>REPORTS & BLOCK LOGS</span>
                </div>
                <span className="bg-hotred text-white border-2 border-black text-[10px] font-black px-1.5 py-0.5">0</span>
              </button>
            </nav>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-black space-y-2">
            <div className="bg-black text-white p-2 text-center text-[10px] font-black uppercase tracking-widest">
              ENCRYPTION: AES-256 P2P
            </div>
            <button onClick={handleLogout} className="w-full bg-cream hover:bg-hotred hover:text-white text-black border-2 border-black py-1.5 text-[10px] font-black uppercase transition-colors">
              LOGOUT SECURE SESSION
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
          {activeTab === 'clearances' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-black pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-vividyellow border-2 border-black px-2 py-0.5 text-xs font-black uppercase">QUEUE CONTROLLER</span>
                    <span className="text-xs font-bold text-gray-700 uppercase">IDENTITY VERIFICATION DESK</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">
                    PENDING CLEARANCES ({pendingUsers.length})
                  </h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="bg-neongreen hover:bg-emerald-400 text-black border-4 border-black px-4 py-2 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                    ✓ BATCH APPROVE ALL
                  </button>
                </div>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="bg-white border-4 border-black p-12 text-center shadow-[8px_8px_0px_0px_#000]">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-xl font-black uppercase">CLEARANCE QUEUE IS EMPTY</h3>
                  <p className="text-xs font-bold text-gray-600 mt-1">All applicant student IDs have been processed and enrolled into the Aura network.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingUsers.map(user => (
                    <div key={user.id} className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
                          <span className="bg-vividyellow border border-black px-2 py-0.5 text-[10px] font-black uppercase truncate max-w-[120px]">
                            {user.role}
                          </span>
                          <span className="text-[10px] font-bold text-gray-600 font-mono">
                            {new Date(user.created_at * 1000).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="font-black text-lg uppercase tracking-tight text-black">{user.full_name}</h4>
                          <p className="text-xs font-bold text-gray-800">Email: {user.email}</p>
                          <p className="text-[11px] font-bold text-gray-600">Mobile: {user.mobile}</p>
                          <p className="text-[11px] font-bold text-gray-600 font-mono">🆔 DB ID: {user.id.substring(0, 8)}...</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t-2 border-black">
                        <button className="w-full bg-cream hover:bg-yellow-100 text-black border-2 border-black py-2 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-colors">
                          <span>🔍 VIEW UPLOADED ID</span>
                        </button>

                        <div className="flex gap-2">
                          <button onClick={() => handleAction(user.id, 'approve')} className="flex-1 bg-neongreen hover:bg-emerald-400 text-black border-4 border-black py-2.5 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                            ✓ APPROVE & GENERATE ID
                          </button>
                          <button onClick={() => handleAction(user.id, 'reject')} className="bg-hotred hover:bg-red-600 text-white border-4 border-black px-3 py-2.5 font-black text-xs uppercase shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                            REJECT
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'directory' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-black pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-softviolet border-2 border-black px-2 py-0.5 text-xs font-black uppercase">DATABASE AUDIT</span>
                    <span className="text-xs font-bold text-gray-700 uppercase">CAMPUS REGISTRY</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">
                    USER & ADMIN DIRECTORY
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => window.alert('Direct creation of users is locked. All new members must go through the standard Google/GitHub authentication and onboarding flow.')}
                    className="bg-vividyellow hover:bg-yellow-300 text-black border-4 border-black px-4 py-2 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    + ADD NEW USER
                  </button>
                  <button 
                    onClick={() => window.alert('Direct creation of admins is locked. Only ROOT can elevate permissions via the database console.')}
                    className="bg-hotred hover:bg-red-600 text-white border-4 border-black px-4 py-2 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    ⚡ ADD NEW ADMIN
                  </button>
                </div>
              </div>

              <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_#000] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <span className="font-black text-xs uppercase">SEARCH:</span>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by Aura ID, Name, Email..." className="w-full bg-cream border-2 border-black p-2 font-bold text-xs focus:bg-vividyellow focus:outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs uppercase">FILTER:</span>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-cream border-2 border-black p-2 font-bold text-xs focus:bg-vividyellow focus:outline-none">
                    <option value="ALL">ALL ROLES</option>
                    <option value="STUDENT">STUDENTS</option>
                    <option value="FACULTY">FACULTY</option>
                    <option value="ADMIN">ADMINISTRATORS</option>
                    <option value="BANNED">BANNED ENTITIES</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-black text-white text-xs font-black uppercase tracking-wider">
                      <th className="border-2 border-black p-3">AURA ID (DB: {allUsers.length})</th>
                      <th className="border-2 border-black p-3">NAME</th>
                      <th className="border-2 border-black p-3">ROLE</th>
                      <th className="border-2 border-black p-3">COLLEGE / DEPT</th>
                      <th className="border-2 border-black p-3 text-center">STATUS</th>
                      <th className="border-2 border-black p-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold divide-y-2 divide-black">
                    {/* HARDCODED ADMINS */}
                    {(roleFilter === 'ALL' || roleFilter === 'ADMIN') && (
                      <tr className="hover:bg-cream transition-colors">
                        <td className="border-2 border-black p-3 font-mono text-hotred">AURA-SYS-VISHU</td>
                        <td className="border-2 border-black p-3">Vishu Raj</td>
                        <td className="border-2 border-black p-3"><span className="bg-hotred text-white border border-black px-1.5 py-0.5 text-[10px] uppercase font-black">ADMIN</span></td>
                        <td className="border-2 border-black p-3">vXr Holdings / Society CVO</td>
                        <td className="border-2 border-black p-3 text-center"><span className="bg-neongreen text-black border border-black px-1.5 py-0.5 text-[10px] uppercase font-black">ACTIVE</span></td>
                        <td className="border-2 border-black p-3 text-right text-gray-400 font-black text-[10px]">ROOT PROTECTED</td>
                      </tr>
                    )}
                    
                    {/* REAL USERS FROM DB */}
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={`transition-colors ${user.status === 'banned' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-cream'}`}>
                        <td className="border-2 border-black p-3 font-mono text-black">{user.username || user.email.split('@')[0]}</td>
                        <td className={`border-2 border-black p-3 ${user.status === 'banned' ? 'text-hotred' : ''}`}>{user.full_name || 'No Name'}</td>
                        <td className="border-2 border-black p-3">
                          <span className="bg-vividyellow text-black border border-black px-1.5 py-0.5 text-[10px] uppercase font-black">
                            {user.role || 'STUDENT'}
                          </span>
                        </td>
                        <td className="border-2 border-black p-3">{user.society_id ? `Society ID: ${user.society_id}` : 'Pending Assignment'}</td>
                        <td className="border-2 border-black p-3 text-center">
                          {user.status === 'verified' ? (
                            <span className="bg-neongreen text-black border border-black px-1.5 py-0.5 text-[10px] uppercase font-black">ACTIVE</span>
                          ) : user.status === 'banned' ? (
                            <span className="bg-black text-white border border-black px-1.5 py-0.5 text-[10px] uppercase font-black">BANNED</span>
                          ) : user.status === 'pending' ? (
                            <span className="bg-vividyellow text-black border border-black px-1.5 py-0.5 text-[10px] uppercase font-black">PENDING</span>
                          ) : (
                            <span className="bg-gray-300 text-black border border-black px-1.5 py-0.5 text-[10px] uppercase font-black">{user.status}</span>
                          )}
                        </td>
                        <td className="border-2 border-black p-3 text-right">
                          {user.status === 'banned' ? (
                            <button className="bg-neongreen text-black border border-black px-2 py-1 text-[10px] font-black uppercase hover:bg-white transition-colors">UNBAN USER</button>
                          ) : (
                            <button className="bg-hotred text-white border border-black px-2 py-1 text-[10px] font-black uppercase hover:bg-black transition-colors">BAN USER</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    
                    {/* EMPTY STATE */}
                    {filteredUsers.length === 0 && (roleFilter !== 'ALL' && roleFilter !== 'ADMIN') && (
                      <tr className="bg-white">
                        <td colSpan="6" className="border-2 border-black p-8 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                          NO USERS FOUND MATCHING YOUR SEARCH/FILTER CRITERIA.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'noticeboard' && (
            <section className="space-y-6">
              <div className="border-b-4 border-black pb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-vividyellow border-2 border-black px-2 py-0.5 text-xs font-black uppercase">LIVE MESH DISPATCH</span>
                  <span className="text-xs font-bold text-gray-700 uppercase">OFFICIAL NOTIFICATION ENGINE</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">
                  SOCIETY NOTICEBOARD CONTROLLER
                </h2>
              </div>

              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] space-y-5">
                <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2 flex flex-wrap items-center justify-between gap-2">
                  <span>📢 DRAFT LIVE NETWORK BROADCAST</span>
                  <span className="text-xs bg-black text-white px-2 py-0.5 font-bold uppercase">TARGET: 5,000+ USERS</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-black text-xs uppercase mb-1">POST CATEGORY</label>
                    <select className="w-full bg-cream border-4 border-black p-3 font-black text-xs uppercase focus:bg-vividyellow focus:outline-none">
                      <option value="INFO">ℹ️ OFFICIAL SOCIETY INFO</option>
                      <option value="URGENT">🚨 URGENT EMERGENCY DISPATCH</option>
                      <option value="EVENT">🎪 CAMPUS EVENT / HACKATHON</option>
                      <option value="DISCIPLINARY">⚠️ DISCIPLINARY ADVISORY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-black text-xs uppercase mb-1">AUDIENCE SCOPE</label>
                    <select className="w-full bg-cream border-4 border-black p-3 font-bold text-xs uppercase focus:bg-vividyellow focus:outline-none">
                      <option value="ALL">ALL RAHUL FOUNDATION MEMBERS</option>
                      <option value="ENGINEERING">ENGINEERING CAMPUS ONLY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-black text-xs uppercase mb-1">AUTHOR SIGNATURE</label>
                    <input type="text" defaultValue="ADMIN VISHU RAJ // CVO, vXr HOLDINGS" className="w-full bg-cream border-4 border-black p-3 font-bold text-xs uppercase focus:bg-vividyellow focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-black text-xs uppercase mb-1">BROADCAST HEADLINE / TITLE</label>
                  <input type="text" placeholder="e.g. ANNUAL TECH SYMPOSIUM 2026 REGISTRATIONS OPEN" className="w-full bg-cream border-4 border-black p-3 font-black text-sm uppercase focus:bg-vividyellow focus:outline-none" />
                </div>

                <div>
                  <label className="block font-black text-xs uppercase mb-1">BROADCAST BODY (SUPPORTS PROTOCOL FORMATTING)</label>
                  <textarea rows="4" placeholder="Enter exact announcement text to be broadcasted to all active society member nodes..." className="w-full bg-cream border-4 border-black p-3 font-bold text-xs focus:bg-vividyellow focus:outline-none resize-y"></textarea>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-black text-xs uppercase select-none">
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-hotred border-2 border-black" />
                    <span>PIN TO TOP WITH PULSING NEO-BORDER BANNER</span>
                  </label>
                  <button className="bg-vividyellow hover:bg-hotred hover:text-white text-black border-4 border-black px-6 py-3 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center gap-2">
                    <span>⚡ PUBLISH BROADCAST TO NETWORK &rarr;</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-6">
                <h3 className="text-base font-black uppercase">PAST PUBLISHED BROADCASTS</h3>
                <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex justify-between items-center">
                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      <span className="bg-black text-white text-[10px] px-1 font-bold">INFO</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Target: ALL RAHUL FOUNDATION MEMBERS | 2026-09-21 10:00 UTC</span>
                    </div>
                    <h4 className="font-black text-sm uppercase">AURA P2P V4 ENGINE LIVE DEPLOYMENT</h4>
                    <p className="text-xs font-bold text-gray-700 mt-1">Zero-anonymity encrypted campus mesh communications activated for all verified members.</p>
                  </div>
                  <button className="bg-hotred text-white border-2 border-black px-3 py-1 font-black text-[10px] uppercase hover:bg-black transition-colors">RETRACT BROADCAST</button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'moderation' && (
            <section className="space-y-8">
              <div className="border-b-4 border-black pb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-hotred text-white border-2 border-black px-2 py-0.5 text-xs font-black uppercase">ZERO-TOLERANCE SECURITY</span>
                  <span className="text-xs font-bold text-gray-700 uppercase">AUDIT TRAIL</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">
                  MODERATION: REPORTS & BLOCK AUDIT LOGS
                </h2>
              </div>

              <div className="space-y-4">
                <div className="bg-hotred text-white border-4 border-black p-3.5 shadow-[6px_6px_0px_0px_#000] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <h3 className="font-black text-base uppercase tracking-tight">SECTION A: INCOMING USER COMPLAINTS & REPORTS</h3>
                  </div>
                  <span className="text-xs font-black uppercase bg-black text-white px-2 py-0.5 border border-white">IMMEDIATE DISCIPLINARY REVIEW</span>
                </div>

                <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-black text-white text-xs font-black uppercase">
                        <th className="border-2 border-black p-3">REPORTER ID</th>
                        <th className="border-2 border-black p-3">REPORTED ENTITY</th>
                        <th className="border-2 border-black p-3">OFFENSE CATEGORY</th>
                        <th className="border-2 border-black p-3">REPORT REASON & AUDIT DETAILS</th>
                        <th className="border-2 border-black p-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold divide-y-2 divide-black">
                      <tr className="hover:bg-cream">
                        <td className="border-2 border-black p-3 font-mono">aura0045</td>
                        <td className="border-2 border-black p-3 font-mono text-hotred">aura0144</td>
                        <td className="border-2 border-black p-3"><span className="bg-black text-white px-1 py-0.5">HARASSMENT / MISCONDUCT</span></td>
                        <td className="border-2 border-black p-3 text-gray-800">User repeatedly sent unwanted text messages and refused to maintain respectful campus conduct in private video room.</td>
                        <td className="border-2 border-black p-3 text-right"><button className="bg-hotred text-white border-2 border-black px-2 py-1 uppercase text-[10px] font-black shadow-[2px_2px_0px_0px_#000] hover:bg-black transition-colors">BAN OFFENDER</button></td>
                      </tr>
                      <tr className="hover:bg-cream">
                        <td className="border-2 border-black p-3 font-mono">aura0001</td>
                        <td className="border-2 border-black p-3 font-mono text-hotred">aura0102</td>
                        <td className="border-2 border-black p-3"><span className="bg-black text-white px-1 py-0.5">UNSOLICITED PROMOTIONS</span></td>
                        <td className="border-2 border-black p-3 text-gray-800">Spamming external discord links and paid assignment solicitations during class discussion.</td>
                        <td className="border-2 border-black p-3 text-right"><button className="bg-hotred text-white border-2 border-black px-2 py-1 uppercase text-[10px] font-black shadow-[2px_2px_0px_0px_#000] hover:bg-black transition-colors">BAN OFFENDER</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <div className="bg-vividyellow text-black border-4 border-black p-3.5 shadow-[6px_6px_0px_0px_#000] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔒</span>
                    <h3 className="font-black text-base uppercase tracking-tight">SECTION B: PEER-TO-PEER BLOCK AUDIT LOGS (WITH USER REASONS)</h3>
                  </div>
                  <span className="text-xs font-black uppercase bg-black text-white px-2 py-0.5">REAL-TIME TELEMETRY</span>
                </div>
                <p className="text-xs font-bold text-gray-700">* Crucial Requirement: Displaying exact messages and reasons provided by the blocking user during peer video/chat termination.</p>

                <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-black text-white text-xs font-black uppercase">
                        <th className="border-2 border-black p-3">TIMESTAMP</th>
                        <th className="border-2 border-black p-3">BLOCKER ID</th>
                        <th className="border-2 border-black p-3">TARGET BLOCKED ID</th>
                        <th className="border-2 border-black p-3">EXACT REASON / MESSAGE PROVIDED</th>
                        <th className="border-2 border-black p-3 text-right">SYSTEM ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold divide-y-2 divide-black">
                      <tr className="hover:bg-cream">
                        <td className="border-2 border-black p-3 text-gray-600 font-mono">2026-09-21 12:44:10</td>
                        <td className="border-2 border-black p-3 font-mono font-black">aura0045</td>
                        <td className="border-2 border-black p-3 font-mono text-hotred font-black">aura0102</td>
                        <td className="border-2 border-black p-3 text-gray-800 italic">"Inappropriate language and unsolicited spam links."</td>
                        <td className="border-2 border-black p-3 text-right"><span className="font-black text-[10px] uppercase bg-black text-white px-2 py-1">PEER ISOLATED</span></td>
                      </tr>
                      <tr className="hover:bg-cream">
                        <td className="border-2 border-black p-3 text-gray-600 font-mono">2026-09-21 13:02:18</td>
                        <td className="border-2 border-black p-3 font-mono font-black">aura0001</td>
                        <td className="border-2 border-black p-3 font-mono text-hotred font-black">aura0144</td>
                        <td className="border-2 border-black p-3 text-gray-800 italic">"Refused to turn on verified student camera feed during group peer session."</td>
                        <td className="border-2 border-black p-3 text-right"><span className="font-black text-[10px] uppercase bg-black text-white px-2 py-1">PEER ISOLATED</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'snippet' && (
            <section className="space-y-6">
              <div className="border-b-4 border-black pb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-softviolet border-2 border-black px-2 py-0.5 text-xs font-black uppercase">INTEGRATION ASSET</span>
                  <span className="text-xs font-bold text-gray-700 uppercase">USER CLIENT COMPONENT</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">
                  USER DASHBOARD "BLOCK USER" MODAL SNIPPET
                </h2>
              </div>

              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] space-y-4">
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <h3 className="font-black text-sm uppercase">INTERACTIVE LIVE MODAL PREVIEW</h3>
                  <button className="bg-hotred text-white border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:bg-black transition-colors">
                    TRIGGER PREVIEW MODAL
                  </button>
                </div>
                <p className="text-xs font-bold text-gray-700">
                  This is the exact Neo-Brutalist modal integrated into the user-facing chatroom. It collects structured reason data so admins can inspect peer conflicts in Section B.
                </p>
              </div>

              <div className="bg-zinc-950 text-emerald-400 border-4 border-black p-4 shadow-[8px_8px_0px_0px_#000] relative font-mono text-xs overflow-x-auto mt-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider">BLOCK_MODAL_COMPONENT.HTML</span>
                  <button className="bg-vividyellow hover:bg-white text-black border-2 border-black px-3 py-1 font-sans text-xs font-black uppercase transition-colors">
                    COPY SNIPPET
                  </button>
                </div>
                <pre className="text-xs whitespace-pre-wrap leading-relaxed text-zinc-300">
{`<!-- ============================================================== -->
<!-- AURA STANDARD USER DASHBOARD // BLOCK USER MODAL (NEO-BRUTALIST) -->
<!-- ============================================================== -->
<div id="blockUserModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 hidden">
  <div class="bg-white border-4 border-black p-6 sm:p-8 max-w-lg w-full shadow-[10px_10px_0px_0px_#FF6B6B] relative">
    
    <!-- Close Button -->
    <button onclick="closeBlockModal()" class="absolute top-4 right-4 bg-hotred text-white border-2 border-black w-8 h-8 font-black text-sm hover:bg-black shadow-[2px_2px_0px_0px_#000]">
      ✕
    </button>

    <!-- Modal Header -->
    <div class="flex items-center gap-3 border-b-4 border-black pb-3 mb-4">
      <div class="w-10 h-10 bg-hotred text-white border-2 border-black flex items-center justify-center font-black text-lg">
        ⛔
      </div>
      <div>
        <span class="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5">
          ZERO-TOLERANCE SAFETY
        </span>
        <h3 class="text-xl font-black uppercase tracking-tight">
          BLOCK & TERMINATE SESSION
        </h3>
      </div>
    </div>

    <!-- Body -->
    <p class="text-xs font-bold text-gray-800 mb-3">
      You are about to block <strong class="text-black bg-vividyellow px-1" id="blockTargetName">aura0102</strong>. 
      They will be immediately disconnected and prevented from matching with you again.
    </p>

    <!-- Form -->
    <form onsubmit="handleBlockSubmit(event)" class="space-y-4">
      <div>
        <label class="block font-black text-xs uppercase mb-1 tracking-wider">
          REASON FOR BLOCKING (Optional but Recommended)
        </label>
        <textarea 
          id="blockReasonInput" 
          rows="3" 
          placeholder="e.g. Inappropriate language, spamming links, harassment..."
          class="w-full bg-[#FFFDF5] border-4 border-black rounded-none p-3 font-bold text-xs text-black placeholder:text-gray-500 focus:bg-[#FFD93D] focus:outline-none shadow-[4px_4px_0px_0px_#000]"
        ></textarea>
        <span class="text-[10px] font-bold text-gray-600 block mt-1">
          * This reason is confidentially logged to the Disciplinary Command Center for audit.
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 pt-2">
        <button type="submit" class="flex-1 bg-hotred hover:bg-black text-white border-4 border-black p-3 font-black text-xs uppercase shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all">
          CONFIRM PERMANENT BLOCK ⛔
        </button>
        <button type="button" class="bg-cream hover:bg-gray-200 text-black border-4 border-black px-4 py-3 font-black text-xs uppercase shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all">
          CANCEL
        </button>
      </div>
    </form>
  </div>
</div>`}
                </pre>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
