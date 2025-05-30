import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import LoginScreen from './components/LoginScreen';
import AccountScreen from './components/AccountScreen';
import PhotoUploadScreen from './components/PhotoUploadScreen';
import AgeGuessingScreen from './components/AgeGuessingScreen';
import StatisticsScreen from './components/StatisticsScreen';
import PrivacyPolicyScreen from './components/PrivacyPolicyScreen';
import LoadingSpinner from './components/LoadingSpinner';
import { UserIcon, GageLogoIcon, ArrowRightStartOnRectangleIcon } from './components/icons';

const AppContent: React.FC = () => {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthLoading || (currentUser && isProfileLoading)) return;

    if (currentUser) {
      if (!profile) return;
      if (!profile.hasProvidedDob && location.pathname !== '/account') {
        navigate('/account', { replace: true, state: { from: location, reason: 'dob_missing' } });
      } else if (!profile.photoBase64 && location.pathname !== '/upload-photo') {
        navigate('/upload-photo', { replace: true, state: { from: location, reason: 'photo_missing' } });
      } else if (['/', '/login', '/account', '/upload-photo'].includes(location.pathname)) {
        navigate('/game', { replace: true });
      }
    } else if (location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [currentUser, profile, isAuthLoading, isProfileLoading, location.pathname, navigate]);

  if (isAuthLoading || (currentUser && isProfileLoading)) {
    if (location.pathname !== '/login' || currentUser) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <LoadingSpinner size="lg" />
          <p className="ml-3 text-slate-700">{isAuthLoading ? 'Authenticating...' : 'Loading profile...'}</p>
        </div>
      );
    }
  }

  const profileIsComplete = currentUser && profile && profile.hasProvidedDob && profile.photoBase64;

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <LoginScreen /> : <Navigate to={profileIsComplete ? "/game" : (!profile?.hasProvidedDob ? "/account" : "/upload-photo")} replace />} />
      <Route path="/account" element={currentUser ? <AccountScreen /> : <Navigate to="/login" replace />} />
      <Route path="/upload-photo" element={currentUser && profile?.hasProvidedDob ? <PhotoUploadScreen /> : <Navigate to={currentUser ? (!profile?.hasProvidedDob ? "/account" : "/game") : "/login"} replace />} />
      <Route path="/game" element={profileIsComplete ? <AgeGuessingScreen /> : <Navigate to={currentUser ? (!profile?.hasProvidedDob ? "/account" : (!profile?.photoBase64 ? "/upload-photo" : "/login")) : "/login"} replace />} />
      <Route path="/statistics" element={profileIsComplete ? <StatisticsScreen /> : <Navigate to={currentUser ? (!profile?.hasProvidedDob ? "/account" : (!profile?.photoBase64 ? "/upload-photo" : "/login")) : "/login"} replace />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyScreen />} />
      <Route path="*" element={<Navigate to={profileIsComplete ? "/game" : (currentUser ? (!profile?.hasProvidedDob ? "/account" : (!profile?.photoBase64 ? "/upload-photo" : "/login")) : "/login")} replace />} />
    </Routes>
  );
};

const MainAppLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const profileIsComplete = currentUser && profile && profile.hasProvidedDob && profile.photoBase64;
  const canNavigateFreely = profileIsComplete;

  return (
    <div className="min-h-screen bg-[#F0E1D1] text-slate-800 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
            <div className="w-1/3 flex justify-start">
              {currentUser && (
                <button onClick={() => {
                  if (canNavigateFreely) navigate('/statistics');
                  else if (!profile?.hasProvidedDob) navigate('/account');
                  else if (!profile?.photoBase64) navigate('/upload-photo');
                }}
                  className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-[#ff1818] transition-all"
                  aria-label={canNavigateFreely ? "View your statistics" : "Complete profile setup"}
                  disabled={isProfileLoading && !profile}>
                  {isProfileLoading && !profile && currentUser ? (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <LoadingSpinner size="sm" color="text-gray-400" />
                    </div>
                  ) : profile?.photoBase64 ? (
                    <img src={profile.photoBase64} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 hover:border-[#ff1818] transition-colors" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-gray-500 hover:text-[#ff1818] transition-colors" />
                  )}
                </button>
              )}
            </div>

            <div className="w-1/3 flex justify-center">
              <button onClick={() => navigate(canNavigateFreely ? '/game' : (currentUser ? (!profile?.hasProvidedDob ? '/account' : (!profile?.photoBase64 ? '/upload-photo' : '/login')) : '/login'))}
                className="focus:outline-none group text-[#ff1818]"
                aria-label="Go to Gage guessing game">
                <GageLogoIcon className="h-10 sm:h-12 w-auto group-hover:opacity-80 transition-opacity" />
              </button>
            </div>

            <div className="w-1/3 flex justify-end">
              {currentUser && (
                <button onClick={handleLogout}
                  className="p-2 rounded-md text-gray-500 hover:text-[#ff1818] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#ff1818]"
                  aria-label="Logout">
                  <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AppContent />
      </main>

      <footer className="bg-white/50 py-6 text-center">
        <p className="text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Gage. For entertainment purposes only.{' '}
          <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline transition-colors">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProfileProvider>
        <HashRouter>
          <MainAppLayout />
        </HashRouter>
      </ProfileProvider>
    </AuthProvider>
  );
};

export default App;
