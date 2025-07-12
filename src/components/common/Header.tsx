import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, UserCircle, MessageSquare, Home, Star, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (currentUser) {
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        setIsAdmin(adminDoc.exists());
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <header className={`bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SkillSwap</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="px-2 py-1 rounded border border-gray-300 text-sm bg-white dark:bg-gray-800 dark:text-white"
              aria-label="Select language"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ta">தமிழ்</option>
            </select>
            {currentUser && (
              <Link
                to="/"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">{t('home')}</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Admin Panel
              </Link>
            )}
            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('profile')}</span>
                </Link>
                <Link
                  to="/requests"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('requests')}</span>
                </Link>
                <Link
                  to="/saved"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-yellow-700 hover:text-yellow-900 hover:bg-yellow-50 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('saved')}</span>
                </Link>
                <Link
                  to="/leaderboard"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-yellow-700 hover:text-yellow-900 hover:bg-yellow-50 transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('leaderboard')}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('logout')}</span>
                </button>
              </>
            ) : (
              location.pathname !== '/admin' && (
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('login')}
                </Link>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;