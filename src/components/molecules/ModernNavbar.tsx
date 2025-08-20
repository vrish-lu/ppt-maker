import React, { useState, useRef, useEffect } from 'react';
import lisaLogoSvg from '../../assets/images/lisa_-_final_-_logo_-_black (2).svg';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';
import ProfileModal from './ProfileModal';

interface ModernNavbarProps {
  selectedThemeKey: string;
  onThemeChange: (themeKey: string) => void;
  themes: Array<{
    key: string;
    label: string;
    style: any;
  }>;
  onPresent?: () => void;
  onExport?: () => void;
  onPresentationSelect?: (presentation: any) => void;
  className?: string;
}

const ModernNavbar: React.FC<ModernNavbarProps> = ({
  selectedThemeKey,
  onThemeChange,
  themes,
  onPresent,
  onExport,
  onPresentationSelect,
  className = ''
}) => {
  const { user, isAuthenticated, logout, token } = useAuth();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
      }
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target as Node)) {
        setMenuDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { login, updateUser } = useAuth();

  const handleAuthSuccess = (userData: any, authToken: string) => {
    login(userData, authToken);
    setAuthModalOpen(false);
  };

  const handleProfileUpdate = (updatedUser: any) => {
    updateUser(updatedUser);
    setProfileModalOpen(false);
  };

  return (
    <>
      <nav className={`bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-3 flex items-center justify-between ${className}`}>
        {/* Left Section */}
        <div className="flex items-center space-x-6">
          {/* Lisa Logo */}
          <div className="flex items-center">
            <img 
              src={lisaLogoSvg} 
              alt="Lisa Logo" 
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Theme Selector */}
          <div className="relative" ref={themeDropdownRef}>
            <button 
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white"></div>
              </div>
              <span>Theme</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${themeDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {themeDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Choose Theme</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {themes.map((theme) => (
                    <button
                      key={theme.key}
                      onClick={() => {
                        onThemeChange(theme.key);
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                        selectedThemeKey === theme.key ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-gray-200"
                        style={{ 
                          background: theme.style.background || theme.style.backgroundColor,
                          borderColor: theme.style.borderColor || theme.style.background
                        }}
                      ></div>
                      <span className={`text-sm font-medium ${
                        selectedThemeKey === theme.key ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {theme.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Present Button */}
          <button 
            onClick={onPresent}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <polygon points="5,3 19,10 5,17 5,3" />
            </svg>
            <span>Present</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Authentication Section */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              {/* User Avatar */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.display_name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">
                  {user?.display_name || user?.name || 'User'}
                </span>
              </div>

              {/* User Menu */}
              <div className="relative" ref={menuDropdownRef}>
                <button 
                  onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}
                  className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                
                {menuDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileModalOpen(true);
                          setMenuDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          onExport?.();
                          setMenuDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export</span>
                      </button>
                      <button
                        onClick={() => setMenuDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Settings</span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          logout();
                          setMenuDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                      <button
                        onClick={() => {
                          // Add delete account confirmation here
                          if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                            // Call delete account function
                            console.log('Delete account requested');
                          }
                          setMenuDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        token={token || ''}
        onProfileUpdate={handleProfileUpdate}
        onPresentationSelect={onPresentationSelect}
        onLogout={logout}
        onDeleteAccount={() => {
          if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            // Call backend to delete account
            const token = localStorage.getItem('authToken');
            if (token) {
              console.log('🔐 Token found, calling delete API...');
              const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/auth/delete-all-data`;
              console.log('🌐 API URL:', apiUrl);
              
              fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              .then(async response => {
                console.log('📡 Delete account response status:', response.status);
                
                if (response.ok) {
                  const responseData = await response.json();
                  console.log('✅ Account deleted successfully:', responseData);
                  logout(); // This will clear all state
                  alert('Your account has been deleted successfully.');
                } else {
                  const errorText = await response.text();
                  console.error('❌ Failed to delete account:', response.status, errorText);
                  
                  try {
                    const errorData = JSON.parse(errorText);
                    alert(`Failed to delete account: ${errorData.message || 'Unknown error'}`);
                  } catch {
                    alert(`Failed to delete account: ${response.status} ${errorText}`);
                  }
                }
              })
              .catch(error => {
                console.error('❌ Network error deleting account:', error);
                alert(`Network error deleting account: ${error.message}`);
              });
            } else {
              console.error('❌ No auth token found');
              alert('No authentication token found. Please log in again.');
            }
          }
        }}
      />
    </>
  );
};

export default ModernNavbar;