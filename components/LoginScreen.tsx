import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { GageLogoIcon, SparklesIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithGoogle, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate

  const auth = getAuth();

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("User registered successfully!");
        // Optionally, navigate after successful registration
        navigate('/game'); // Or any other desired route
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in successfully!");
        // Optionally, navigate after successful login
        navigate('/game'); // Or any other desired route
      }
    } catch (err: any) { // Use 'any' for the error type
      console.error("Email/Password Auth error:", err);
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      // Navigation will be handled by App.tsx based on profile completion state after successful sign-in
    } catch (err: any) { // Use 'any' for the error type
      setError('Failed to sign in with Google. Please try again.');
      console.error("Google Sign-In error in LoginScreen:", err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <GageLogoIcon className="h-16 w-auto text-[#ff1818] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff4545] to-[#ff1818]">
            Welcome to GAGE
          </h2>
        </div>
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-xl shadow-2xl transform hover:scale-[1.01] transition-transform duration-300">
          {error && <p className="text-sm text-red-600 text-center mb-4" role="alert">{error}</p>}

          <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff1818]"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff1818]"
              />
            </div>
            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-[#ff1818] hover:bg-[#e00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-[#ff1818] transition-all duration-150 ease-in-out transform hover:scale-105 disabled:opacity-70"
            >
              {isAuthLoading ? (isRegistering ? 'Registering...' : 'Logging In...') : (isRegistering ? 'Register' : 'Login')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[#ff1818] hover:underline focus:outline-none"
            >
              {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAuthLoading}
              className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-[#ff1818] transition-all duration-150 ease-in-out transform hover:scale-105 disabled:opacity-70"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {isAuthLoading ? 'Signing In with Google...' : 'Sign In with Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
