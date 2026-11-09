import React, { useState } from 'react';
import {
  Bell,
  Search,
  ChevronDown,
  User,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Users2,
  Sparkles,
} from 'lucide-react';
import { useAuth, DEFAULT_USERS } from '../../context/AuthContext';

export default function Header({ onSearch, onNavigateTab }) {
  const { currentUser, switchUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E4EAE3] px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto">
        {/* Left: Search Bar */}
        <div className="flex-1 max-w-lg">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-[#758278] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, datasets, analyses..."
              className="w-full pl-10 pr-4 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-xs text-[#35463B] placeholder-[#96A499] focus:outline-none focus:ring-1 focus:ring-[#779985] focus:border-[#779985] transition-all"
            />
          </form>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-[#758278] hover:bg-[#F0F5EF] hover:text-[#35463B] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#779985]"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E4EAE3] shadow-clinova-dropdown p-4 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0F5EF]">
                  <span className="font-semibold text-[#35463B]">Clinical Notifications</span>
                  <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2 py-0.5 rounded-full font-medium">
                    2 New
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
                    <p className="font-medium text-[#35463B]">AN-0043 Decision Tree Completed</p>
                    <p className="text-[11px] text-[#758278] mt-0.5">
                      ROC-AUC 0.84 achieved with patient-level grouped split.
                    </p>
                    <span className="text-[10px] text-[#96A499] mt-1 block">10 mins ago</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
                    <p className="font-medium text-[#35463B]">UCI Diabetes Dataset Ready</p>
                    <p className="text-[11px] text-[#758278] mt-0.5">
                      101,766 hospital encounters available for exploratory KDD.
                    </p>
                    <span className="text-[10px] text-[#96A499] mt-1 block">1 hour ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[#F0F5EF] transition-colors"
            >
              {/* Circular Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#DFEAE0] text-[#456B56] border border-[#CDDED0] flex items-center justify-center font-bold text-xs">
                <User className="w-5 h-5 text-[#456B56]" />
              </div>

              {/* Name & Role */}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-[#35463B] leading-tight">
                  {currentUser.full_name}
                </div>
                <div className="text-[11px] text-[#758278] leading-tight font-medium">
                  {currentUser.role}
                </div>
              </div>

              <ChevronDown className="w-4 h-4 text-[#758278]" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#E4EAE3] shadow-clinova-dropdown p-2 z-50 text-xs">
                <div className="p-2.5 border-b border-[#F0F5EF] mb-1.5">
                  <p className="font-bold text-[#35463B]">{currentUser.full_name}</p>
                  <p className="text-[11px] text-[#758278]">{currentUser.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#DFEAE0] text-[#456B56] border border-[#CDDED0]">
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-[#96A499]">{currentUser.department}</span>
                  </div>
                </div>

                <div className="px-2 py-1 text-[10px] font-semibold text-[#96A499] uppercase tracking-wider">
                  Switch Active Role (Demo)
                </div>
                {DEFAULT_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors ${
                      u.id === currentUser.id
                        ? 'bg-[#DFEAE0] text-[#456B56] font-semibold'
                        : 'text-[#35463B] hover:bg-[#F0F5EF]'
                    }`}
                  >
                    <div>
                      <div className="text-xs">{u.full_name}</div>
                      <div className="text-[10px] text-[#758278]">{u.role}</div>
                    </div>
                    {u.id === currentUser.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#456B56]" />}
                  </button>
                ))}

                <div className="border-t border-[#F0F5EF] my-1.5"></div>
                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-[#35463B] hover:bg-[#F0F5EF] flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-[#456B56]" />
                  <span>Researcher Profile</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-[#8C533D] hover:bg-[#F3E5DC]/30 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
