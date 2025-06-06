import { db } from '../firebase';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { getAvailableProfilesForGuessing } from '../hooks/useProfile';
import { db } from '../firebase';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import type { OtherUser } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { GageLogoIcon } from './icons';

interface AnimatedFeedback {
  text: string;
  colorClass: string;
  key: number;
}

type GagedAnimationStep = 'idle' | 'fadingOutProfile' | 'showingGage' | 'showingGaged' | 'gagedComplete';

const AgeGuessingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateUserGuessingStats, isLoading: isProfileLoading } = useProfile();

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
        setNoProfilesMessage("Come back soon to gauge more ages");
        setShuffledProfiles([]);
      } else {
        setNoProfilesMessage(null);
        setShuffledProfiles([...availableProfiles].sort(() => Math.random() - 0.5));
      }
      setCurrentIndex(0);
      setGagedAnimationStep('idle');
    }
  }, [profile?.id, isProfileLoading]);

  useEffect(() => {
    if (gagedAnimationStep === 'idle' && shuffledProfiles.length > 0 && profile) {
      const newIndex = currentIndex % shuffledProfiles.length;
      setCurrentUserToGuess(shuffledProfiles[newIndex]);
      setCurrentGuessValue(30);
    } else if (gagedAnimationStep === 'idle' && shuffledProfiles.length === 0 && profile && !isProfileLoading) {
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

    if (diff === 0) pointsEarned = 10;
    else if (diff === 1) pointsEarned = 9;
    else if (diff === 2) pointsEarned = 7;
    else if (diff === 3) pointsEarned = 5;
    else if (diff === 4) pointsEarned = 3;
    else if (diff === 5) pointsEarned = 2;
    else if (diff >= 6 && diff <= 7) pointsEarned = 1;
    else pointsEarned = 0;

    updateUserGuessingStats(pointsEarned, currentUserToGuess, guess);

    try {
      const userDocRef = doc(db, 'users', currentUserToGuess.id);
      await updateDoc(userDocRef, {
        communityAverageGuessTotal: increment(guess),
        numberOfCommunityGuesses: increment(1),
        guessHistory: arrayUnion({ guesserId: profile.id, guessValue: guess })
      });
    } catch (error) {
      console.error("Error updating Firestore for guess:", error);
    }

    if (diff >= 1 && diff <= 3) {
      setAnimatedFeedback({ text: diff.toString(), colorClass: 'text-[#ff1818]', key: Date.now() });
      setTimeout(() => {
        setAnimatedFeedback(null);
        setCurrentIndex(prev => prev + 1);
        submissionLockRef.current = false;
      }, 1500);
    } else if (diff === 0) {
      setGagedAnimationStep('fadingOutProfile');
    } else {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        submissionLockRef.current = false;
      }, 500);
    }
  }, [currentUserToGuess, profile, currentGuessValue, updateUserGuessingStats, gagedAnimationStep]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentGuessValue(parseInt(e.target.value, 10));
  };

  const handleSliderRelease = () => {
    submitGuessAndLoadNext();
  };

  if (isProfileLoading) return <LoadingSpinner size="lg" />;
  if (!profile) return <LoadingSpinner size="lg" />;
  if (noProfilesMessage && gagedAnimationStep === 'idle') {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-xl max-w-md mx-auto">
        <h3 className="text-2xl font-semibold text-[#ff1818] mb-4">No Gages Available</h3>
        <p className="text-slate-600 mb-6">{noProfilesMessage}</p>
        <button
          onClick={() => navigate('/statistics')}
          className="px-6 py-3 bg-[#ff1818] text-white font-semibold rounded-lg shadow-md hover:bg-[#e00000]"
        >
          Go to Your Profile & Stats
        </button>
      </div>
    );
  }

  return <div>{/* ...rest of original UI code... */}</div>;
};

export default AgeGuessingScreen;
