// App.jsx — updated with lazy loading, Suspense, and memoised handlers
// TC1  — useCallback for handlers passed to Header (stable references)
// TC6  — AdminDashboard loaded only when admin navigates to it
// TC14 — Suspense fallback spinner shown while lazy module loads
// TC15 — admin chunk excluded from initial bundle via React.lazy

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider }    from './context/AuthContext';
import { useAuth }         from './hooks/useAuth';
import Header              from './components/common/Header';
import HomePage            from './pages/HomePage';
import FlightsPage         from './pages/FlightsPage';
import LoginModal          from './components/auth/LoginModal';
import RegisterModal       from './components/auth/RegisterModal';
import { ErrorBoundary }   from './components/common/ErrorBoundary';

// TC6/TC15 — AdminDashboard is a separate lazy chunk;
// not downloaded until an admin user lands on that view
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// TC14 — spinner shown while lazy admin module is being fetched
const LoadingSpinner = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-500">
    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-sm">Loading...</p>
  </div>
);

const AppContent = () => {
  const [currentPage,        setCurrentPage]        = useState('home');
  const [showLoginModal,     setShowLoginModal]      = useState(false);
  const [showRegisterModal,  setShowRegisterModal]   = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'admin' && currentPage === 'home') {
      setCurrentPage('admin');
    }
  }, [user, currentPage]);

  // TC1/TC2 — stable handler references via useCallback so Header
  // and modal components do not re-render on unrelated state changes
  const handleLoginClick    = useCallback(() => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
  }, []);

  const handleRegisterClick = useCallback(() => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
  }, []);

  const handleSearchClick   = useCallback(() => setCurrentPage('flights'), []);
  const handleHomeClick     = useCallback(() => setCurrentPage('home'),    []);
  const handleCloseLogin    = useCallback(() => setShowLoginModal(false),   []);
  const handleCloseRegister = useCallback(() => setShowRegisterModal(false),[]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* TC1 — Header is memoised; stable callbacks prevent unnecessary re-renders */}
      <Header
        onLoginClick={handleLoginClick}
        onHomeClick={handleHomeClick}
      />

      {/* TC7 — root ErrorBoundary catches any catastrophic page-level failure */}
      <ErrorBoundary name="Application">

        {/* TC14 — Suspense wraps everything so lazy admin loads show spinner */}
        <Suspense fallback={<LoadingSpinner />}>

          {/* Home page — logged-out or passenger */}
          {currentPage === 'home' && !user && (
            <HomePage
              onSearchClick={handleSearchClick}
              onSignInClick={handleLoginClick}
            />
          )}

          {user && user.role === 'passenger' && currentPage === 'home' && (
            <HomePage
              onSearchClick={handleSearchClick}
              onSignInClick={handleLoginClick}
            />
          )}

          {/* Flights page */}
          {currentPage === 'flights' && (
            <FlightsPage onLoginClick={handleLoginClick} />
          )}

          {/* TC6/TC15 — AdminDashboard chunk downloads only when this renders */}
          {user && user.role === 'admin' && (
            <AdminDashboard />
          )}

        </Suspense>
      </ErrorBoundary>

      <LoginModal
        isOpen={showLoginModal}
        onClose={handleCloseLogin}
        onSwitchToRegister={handleRegisterClick}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={handleCloseRegister}
        onSwitchToLogin={handleLoginClick}
      />

    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
