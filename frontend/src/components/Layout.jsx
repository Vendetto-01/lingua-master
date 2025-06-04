import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'; // useTheme import edildi

const UserIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
  </svg>
);

const ThemeToggleIcon = ({ theme }) => {
  if (theme === 'dark') {
    return <span title="Gündüz Moduna Geç" role="img" aria-label="sun">☀️</span>; // Sun emoji for switching to light
  }
  return <span title="Gece Moduna Geç" role="img" aria-label="moon">🌙</span>; // Moon emoji for switching to dark
};

const Layout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme(); // theme ve toggleTheme context'ten alındı
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null); // Ref for desktop user menu
  const mobileMenuRef = useRef(null); // Ref for mobile menu button + content (isteğe bağlı, şimdilik sadece userMenu için)


  // Click outside handler for desktop user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/auth')
    }
  }

  const toggleMobileMenu = () => { // toggleMenu -> toggleMobileMenu
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  }

  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-slate-900"> {/* dark:bg-slate-900 eklendi */}
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 dark:bg-slate-800 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center cursor-pointer">
              {/* text-gradient sınıfı için dark mode'da farklı bir gradient gerekebilir, şimdilik aynı bırakıldı */}
              <div className="text-2xl font-bold text-gradient">
                Lingua Master
              </div>
            </Link>

            {/* Desktop User Menu & Theme Toggle */}
            <div className="hidden md:flex items-center space-x-3 relative"> {/* space-x-3 yapıldı */}
              {/* Theme Toggle Button - Desktop */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 focus:outline-none"
                aria-label="Toggle theme"
              >
                <ThemeToggleIcon theme={theme} />
              </button>

              {/* User Menu Button */}
              <div ref={userMenuRef}> {/* Ref buraya taşındı */}
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 focus:outline-none dark:text-gray-300 dark:hover:text-primary-400"
                >
                  <UserIcon />
                  <span>{userName}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              </button>
              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1 dark:bg-slate-700 dark:ring-white dark:ring-opacity-10">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-slate-600 dark:hover:text-white"
                  >
                    Profilim
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setIsUserMenuOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-slate-600 dark:hover:text-white"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700"
              >
                <span className="sr-only">Open menu</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Content */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-gray-200 dark:border-slate-700" ref={mobileMenuRef}>
              <div className="px-2 space-y-1">
                <div className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200">
                  <UserIcon />
                  <span>{userName}</span>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:text-white dark:hover:bg-slate-700"
                >
                  Profilim
                </Link>
                {/* Mobile Theme Toggle Button */}
                <button
                  onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:text-white dark:hover:bg-slate-700"
                  aria-label="Toggle theme"
                >
                  <span>Tema Değiştir</span>
                  <ThemeToggleIcon theme={theme} />
                </button>
                <button
                  onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:text-white dark:hover:bg-slate-700"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      {/* Main content's background will be inherited from the root div's dark:bg-slate-900 */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer (optional) */}
      <footer className="bg-white border-t border-gray-200 mt-auto dark:bg-slate-800 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2024 Lingua Master. Made with ❤️ for English learners.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout