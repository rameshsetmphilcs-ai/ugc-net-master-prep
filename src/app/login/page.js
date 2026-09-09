'use client';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { registerSession } from '../lib/deviceAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deviceConflict, setDeviceConflict] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setDeviceConflict(false);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErrorMsg(error.message);
      else alert('Account registered! Please sign in.');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // Single Device சரிபார்ப்பு
      const check = await enforceSingleDevice(data.user.id);
      if (!check.allowed) {
        setCurrentUser(data.user);
        setDeviceConflict(true);
      } else {
        window.location.href = '/';
      }
    }
  };

  const handleForceSwitchDevice = async () => {
    if (currentUser) {
      await claimCurrentDevice(currentUser.id);
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md max-w-sm w-full space-y-5">
        <div>
          <h1 className="text-xl font-black text-slate-900 leading-tight">MasterNET Access</h1>
          <p className="text-xs text-slate-500 mt-1">Single-device secured preparation account</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            {errorMsg}
          </div>
        )}

        {deviceConflict ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
            <h3 className="font-bold text-xs text-amber-900">Active on Another Device</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Your account is currently running on a different phone or laptop. Do you want to terminate that session and activate here?
            </p>
            <button
              onClick={handleForceSwitchDevice}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition">
              Use on This Device
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-indigo-600"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-indigo-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow transition">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-xs text-indigo-600 font-semibold hover:underline block pt-1">
              {isSignUp ? 'Already have an account? Sign In' : 'New student? Register account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}