import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext'; // Updated import
import { getAvailableProfilesForGuessing } from '../hooks/useProfile'; // Import new function
import type { OtherUser } from '../types'; 
import LoadingSpinner from './LoadingSpinner';
import { GageLogoIcon } from './icons'; // Removed unused ArrowPathIcon

interface AnimatedFeedback {
  text: string;
  colorClass: string;
  key: number;
}

type GagedAnimationStep = 'idle' | 'fadingOutProfile' | 'showingGage' | 'showingGaged' | 'gagedComplete';

const AgeGuessingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateUserGuessingStats, isLoading: isProfileLoading } = useProfile(); // Consumes from ProfileContext
  
  const [currentUserToGuess, setCurrentUserToGuess] = useState<OtherUser | null>(null);
  const [currentGuessValue, setCurrentGuessValue] = useState<number>(30);
  const [shuffledProfiles, setShuffledProfiles] = useState<OtherUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [animatedFeedback, setAnimatedFeedback] = useState<AnimatedFeedback | null>(null);
  const [gagedAnimationStep, setGagedAnimationStep] = useState<GagedAnimationStep>('idle');
  const [noProfilesMessage, setNoProfilesMessage] = useState<string | null>(null);

  const submissionLockRef = useRef(false);

  useEffect(() => {
    if (!isProfileLoading && !profile) {
      navigate('/login', { replace: true }); 
    }
  }, [isProfileLoading, profile, navigate]);

  useEffect(() => {
    if (profile && profile.id) { 
        const availableProfiles = getAvailableProfilesForGuessing(profile.id);
        if (availableProfiles.length === 0) {
            setNoProfilesMessage("Come back soon to gauge more ages"); // Updated text
            setShuffledProfiles([]);
        } else {
            setNoProfilesMessage(null);
            setShuffledProfiles([...availableProfiles].sort(() => Math.random() - 0.5));
        }
        setCurrentIndex(0); 
        setGagedAnimationStep('idle'); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isProfileLoading]); // Depend on profile.id and loading state

  useEffect(() => {
    if (gagedAnimationStep === 'idle' && shuffledProfiles.length > 0 && profile) {
      if (currentIndex >= shuffledProfiles.length) { // Loop back if needed
        setCurrentIndex(0);
        const newIdx = 0 % shuffledProfiles.length;
        setCurrentUserToGuess(shuffledProfiles[newIdx]);

      } else {
        const newIndex = currentIndex % shuffledProfiles.length;
        setCurrentUserToGuess(shuffledProfiles[newIndex]);
      }
      setCurrentGuessValue(30); 
    } else if (gagedAnimationStep === 'idle' && shuffledProfiles.length === 0 && profile && !isProfileLoading) {
        // This case is handled by noProfilesMessage state
        setCurrentUserToGuess(null);
    }
  }, [shuffledProfiles, currentIndex, profile, gagedAnimationStep, isProfileLoading]);

  useEffect(() => {
    let timer: number;
    if (gagedAnimationStep === 'fadingOutProfile') {
      timer = window.setTimeout(() => setGagedAnimationStep('showingGage'), 300); 
    } else if (gagedAnimationStep === 'showingGage') {
      timer = window.setTimeout(() => setGagedAnimationStep('showingGaged'), 700); 
    } else if (gagedAnimationStep === 'showingGaged') {
      timer = window.setTimeout(() => setGagedAnimationStep('gagedComplete'), 1500); 
    } else if (gagedAnimationStep === 'gagedComplete') {
      setGagedAnimationStep('idle');
      setCurrentIndex(prev => prev + 1);
      submissionLockRef.current = false;
    }
    return () => window.clearTimeout(timer);
  }, [gagedAnimationStep]);


  const submitGuessAndLoadNext = useCallback(async () => {
    if (submissionLockRef.current || !currentUserToGuess || !profile || gagedAnimationStep !== 'idle') return;

    submissionLockRef.current = true;
    
    const guess = currentGuessValue;
    const actualAge = currentUserToGuess.actualAge;
    const diff = Math.abs(guess - actualAge);
    let pointsEarned = 0;

    if (diff === 0) { 
        pointsEarned = 10;
        updateUserGuessingStats(pointsEarned, currentUserToGuess, guess); 
        setGagedAnimationStep('fadingOutProfile');
    } else { 
        let feedbackText = diff.toString();
        let feedbackColorClass = 'text-[#ff1818]';

        if (diff === 1) pointsEarned = 9;
        else if (diff === 2) pointsEarned = 7;
        else if (diff === 3) pointsEarned = 5;
        else if (diff === 4) pointsEarned = 3;
        else if (diff === 5) pointsEarned = 2;
        else if (diff >= 6 && diff <= 7) pointsEarned = 1;
        else pointsEarned = 0;
        
        updateUserGuessingStats(pointsEarned, currentUserToGuess, guess);
        
        if (diff >= 1 && diff <= 3) { // Only show number feedback for close guesses
            setAnimatedFeedback({ text: feedbackText, colorClass: feedbackColorClass, key: Date.now() });
            setTimeout(() => {
              setAnimatedFeedback(null);
              setCurrentIndex(prev => prev + 1);
              submissionLockRef.current = false;
            }, 1500); 
        } else { // For wider misses or GAGED, just move to next
            setTimeout(() => {
              setCurrentIndex(prev => prev + 1);
              submissionLockRef.current = false;
            }, 500); // Quicker transition for misses without number feedback
        }
    }
        
  }, [currentUserToGuess, profile, currentGuessValue, updateUserGuessingStats, gagedAnimationStep]);


  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentGuessValue(parseInt(event.target.value, 10));
  };

  const handleSliderRelease = () => {
    submitGuessAndLoadNext();
  };

  if (isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px] sm:min-h-[500px]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-slate-600">Loading Profile Data...</p>
      </div>
    );
  }

  if (!profile) { // Should be redirected by useEffect, but as a fallback
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px] sm:min-h-[500px]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-slate-600">Redirecting to login...</p>
      </div>
    );
  }
  
  if (noProfilesMessage && gagedAnimationStep === 'idle') {
     return (
      <div className="text-center p-8 bg-white rounded-xl shadow-xl max-w-md mx-auto">
        <h3 className="text-2xl font-semibold text-[#ff1818] mb-4">No Gages Available</h3>
        <p className="text-slate-600 mb-6">
          {noProfilesMessage}
        </p>
         <button
              onClick={() => navigate('/statistics')}
              className="px-6 py-3 bg-[#ff1818] text-white font-semibold rounded-lg shadow-md hover:bg-[#e00000] transition-all transform hover:scale-105"
          >
              Go to Your Profile & Stats
          </button>
      </div>
    );
  }
  
  if (gagedAnimationStep === 'idle' && !currentUserToGuess && !animatedFeedback && !noProfilesMessage) {
     // This state occurs briefly while profiles are loading or if there's an issue before noProfilesMessage is set
     return (
      <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px] sm:min-h-[500px]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-slate-600">Preparing Gages...</p>
      </div>
    );
  }

  return (
    <div className="relative max-w-sm mx-auto w-full">
      {animatedFeedback && gagedAnimationStep === 'idle' && (animatedFeedback.text === "1" || animatedFeedback.text === "2" || animatedFeedback.text === "3") && (
        <div 
            key={animatedFeedback.key} 
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-40 p-4"
            aria-live="polite"
        >
          <div 
            className={`animate-ping-once text-7xl sm:text-8xl md:text-9xl font-bold ${animatedFeedback.colorClass}`}
          >
            {animatedFeedback.text}
          </div>
        </div>
      )}

      {gagedAnimationStep !== 'idle' && gagedAnimationStep !== 'gagedComplete' && (
        <div 
            className={`fixed inset-0 flex flex-col items-center justify-center z-50 transition-opacity duration-300 ease-in-out bg-[#F0E1D1] 
                        ${gagedAnimationStep === 'fadingOutProfile' || gagedAnimationStep === 'showingGage' || gagedAnimationStep === 'showingGaged' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-live="polite" // Announce GAGED animation
        >
          <div 
            className={`flex items-end justify-center transition-opacity duration-500 ease-in-out 
                        ${(gagedAnimationStep === 'showingGage' || gagedAnimationStep === 'showingGaged') ? 'opacity-100 delay-300' : 'opacity-0'}`}
          >
            <GageLogoIcon className="h-20 sm:h-24 w-auto text-[#ff1818]" />
            <span 
              className={`text-6xl sm:text-7xl font-bold text-[#ff1818] ml-0 transition-opacity duration-500 ease-in-out 
                          ${gagedAnimationStep === 'showingGaged' ? 'opacity-100 delay-[500ms]' : 'opacity-0'}`}
              style={{ fontFamily: 'sans-serif' }} 
            >
              D
            </span>
          </div>
        </div>
      )}

      {currentUserToGuess && (
         <div 
            className={`bg-white p-5 sm:p-6 rounded-xl shadow-2xl transform transition-opacity duration-300 ease-in-out 
                        ${gagedAnimationStep === 'fadingOutProfile' ? 'opacity-0' : (gagedAnimationStep !== 'idle' ? 'opacity-0 pointer-events-none' : 'opacity-100') }`}
        >
          {currentUserToGuess?.photoBase64 && (
            <div className="aspect-[3/4] w-full rounded-lg overflow-hidden shadow-lg mb-6 border border-gray-200 bg-gray-100">
              <img 
                src={currentUserToGuess.photoBase64} 
                alt={currentUserToGuess.name ? `Profile picture of ${currentUserToGuess.name}` : 'User to guess'} 
                className="w-full h-full object-cover" 
                draggable="false"
              />
            </div>
          )}

          <div className="mb-5 text-center">
            <label htmlFor="ageGuessSlider" className="block text-base sm:text-lg font-medium text-gray-700">
              YOUR GUESS: <span className="font-bold text-[#ff1818] text-xl sm:text-2xl">{currentGuessValue}</span>
            </label>
          </div>

          <input
            type="range"
            id="ageGuessSlider"
            min="1" // Assuming min age is 1
            max="100" // Assuming max age is 100
            value={currentGuessValue}
            onChange={handleSliderChange}
            onMouseUp={handleSliderRelease}
            onTouchEnd={handleSliderRelease}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff1818] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#ff1818]/50 mb-1"
            aria-label="Age guess slider"
            disabled={!!animatedFeedback || submissionLockRef.current || gagedAnimationStep !== 'idle'}
          />
          <div className="flex justify-between text-xs text-gray-500 px-1 mb-6">
            <span>1</span>
            <span>100</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgeGuessingScreen;