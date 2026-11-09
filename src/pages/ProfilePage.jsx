import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Building,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (newPass !== confirmPass) {
      setError('New passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('clinova_token') || ''}`,
        },
        body: JSON.stringify({
          current_password: currPass,
          new_password: newPass,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Password updated successfully.');
        setCurrPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      setError('Connection error while updating password.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#DFEAE0] text-[#456B56] border border-[#CDDED0] flex items-center justify-center font-bold text-xl">
          <User className="w-8 h-8 text-[#456B56]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#35463B]">{currentUser.full_name}</h2>
          <p className="text-xs text-[#758278]">{currentUser.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#DFEAE0] text-[#456B56] border border-[#CDDED0]">
              {currentUser.role}
            </span>
            <span className="text-xs text-[#758278]">{currentUser.department}</span>
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <h3 className="font-bold text-sm text-[#35463B] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#456B56]" />
          <span>Security & Password Management</span>
        </h3>

        {msg && (
          <div className="p-3 rounded-xl bg-[#DFEAE0] text-[#456B56] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{msg}</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-[#F3E5DC] text-[#8C533D] text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-semibold text-[#35463B] mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currPass}
              onChange={(e) => setCurrPass(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:ring-1 focus:ring-[#779985]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#35463B] mb-1">New Password (Min 8 chars)</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:ring-1 focus:ring-[#779985]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#35463B] mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:ring-1 focus:ring-[#779985]"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

