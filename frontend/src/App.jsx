import React, { useContext } from 'react';
import { AppContext } from './context/AppContext';
import Header from './components/Header';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const { currentUser, token, isAdminView } = useContext(AppContext);

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col justify-start">
        {!token ? (
          <Auth />
        ) : currentUser?.status === 'incomplete' ? (
          <Onboarding />
        ) : currentUser?.status === 'verified' ? (
          <Dashboard />
        ) : (
          <div className="flex flex-col w-full h-full items-center justify-center p-10 mt-10">
            <h2 className="text-3xl font-black mb-4 uppercase">APPLICATION PENDING</h2>
            <p className="text-xl font-bold bg-[#FFD93D] border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
              Your account verification is currently under review by the administrators.
            </p>
          </div>
        )}
      </main>
      <Footer />

      {/* Render Admin Dashboard conditionally as an overlay/full screen on top */}
      {isAdminView && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <AdminDashboard />
        </div>
      )}
    </>
  );
}
