import React, { useEffect, useState } from 'react';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useAuthStore } from '../context/authStore';
import { useNavigate } from 'react-router-dom';

interface UploadNotice {
  id: number;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [notices, setNotices] = useState<UploadNotice[]>([]);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onUploadStatus = (event: Event) => {
      const customEvent = event as CustomEvent<{ status: 'pending' | 'success' | 'error'; message: string; timestamp: number }>;
      const detail = customEvent.detail;
      if (!detail) return;

      if (detail.status === 'pending') {
        setPendingUploads((count) => count + 1);
      } else {
        setPendingUploads((count) => Math.max(0, count - 1));
      }

      const newNotice: UploadNotice = {
        id: detail.timestamp,
        status: detail.status,
        message: detail.message,
      };

      setNotices((prev) => [...prev.slice(-2), newNotice]);

      setTimeout(() => {
        setNotices((prev) => prev.filter((notice) => notice.id !== newNotice.id));
      }, detail.status === 'pending' ? 6000 : 8000);
    };

    window.addEventListener('rhythia-upload-status', onUploadStatus as EventListener);
    return () => {
      window.removeEventListener('rhythia-upload-status', onUploadStatus as EventListener);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="cursor-pointer text-2xl font-bold gradient-text hover:opacity-80 transition-opacity"
        >
          Rhythia Maps
        </button>

        {/* Desktop Menu */}
        <div className="hidden flex-1 justify-center gap-8 md:flex">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-50 transition-colors"
          >
            Browse
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="text-gray-400 hover:text-gray-50 transition-colors"
          >
            Upload
          </button>
        </div>

        {/* Auth Section */}
        <div className="hidden items-center gap-4 md:flex">
          {pendingUploads > 0 && (
            <div className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-200 text-xs font-semibold">
              Upload in background: {pendingUploads}
            </div>
          )}
          {user ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="text-gray-400 hover:text-gray-50 transition-colors"
              >
                {user.username}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-50 transition-colors"
              >
                <FiLogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-secondary"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-gray-400 hover:text-gray-50"
        >
          {mobileMenuOpen ? (
            <FiX className="h-6 w-6" />
          ) : (
            <FiMenu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-800 bg-gray-900 px-4 py-4 md:hidden">
          <div className="space-y-3">
            <button
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-gray-400 hover:text-gray-50 transition-colors py-2"
            >
              Browse
            </button>
            <button
              onClick={() => {
                navigate('/upload');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-gray-400 hover:text-gray-50 transition-colors py-2"
            >
              Upload
            </button>
            {user ? (
              <>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-400 hover:text-gray-50 transition-colors py-2"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-gray-400 hover:text-gray-50 transition-colors py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-400 hover:text-gray-50 transition-colors py-2"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-400 hover:text-gray-50 transition-colors py-2"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {notices.length > 0 && (
        <div className="fixed right-4 top-20 z-[70] space-y-2 w-[min(92vw,420px)]">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
                notice.status === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100'
                  : notice.status === 'error'
                  ? 'bg-red-500/15 border-red-500/40 text-red-100'
                  : 'bg-violet-500/15 border-violet-500/40 text-violet-100'
              }`}
            >
              {notice.message}
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
