/* --- StatisticsScreen.tsx --- */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { GuessRecord } from '../types';
import { UserIcon, CheckCircleIcon, XCircleIcon, LightBulbIcon, SparklesIcon, CogIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

const StatCard: React.FC<{ title: string; value: string | number; children?: React.ReactNode; icon?: React.ReactNode }> = ({ title, value, children, icon }) => (
  <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center text-gray-500 mb-1">
      {icon && <span className="mr-2">{icon}</span>}
      <h3 className="text-sm font-medium uppercase tracking-wider">{title}</h3>
    </div>
    <p className="mt-1 text-3xl font-semibold text-[#ff1818]">{value}</p>
    {children && <div className="mt-2 text-xs text-gray-500">{children}</div>}
  </div>
);

const db = getFirestore();

const StatisticsScreen: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const navigate = useNavigate();
  const [communityAvg, setCommunityAvg] = useState<number | null>(null);
  const [communityCount, setCommunityCount] = useState<number>(0);

  useEffect(() => {
    if (!isProfileLoading && !profile) {
      navigate('/login', { replace: true });
    }
  }, [isProfileLoading, profile, navigate]);

  useEffect(() => {
    if (profile?.id) {
      const statRef = doc(db, 'userStats', profile.id);
      getDoc(statRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCommunityAvg(data.average);
          setCommunityCount(data.totalGuesses);
        }
      }).catch((err) => console.error("Failed to load community average", err));
    }
  }, [profile]);

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
        <LoadingSpinner size="lg" />
        <p className="ml-4 text-slate-700">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6">
      <StatCard
        title="Games Played"
        value={profile.gamesPlayed || 0}
        icon={<SparklesIcon className="w-5 h-5 text-[#ff1818]" />}
      >
        Number of people you've guessed an age for.
      </StatCard>

      <StatCard
        title="Accuracy Score"
        value={profile.totalScore || 0}
        icon={<CogIcon className="w-5 h-5 text-[#ff1818]" />}
      >
        Higher is better. Max 10 per guess.
      </StatCard>

      <StatCard
        title="Your GAGE"
        value={communityAvg !== null ? communityAvg : 'N/A'}
        icon={<UserIcon className="w-5 h-5 text-[#ff1818]" />}
      >
        Avg. age others guess for you.<br />
        Based on {communityCount} community guess{communityCount === 1 ? '' : 'es'}.
      </StatCard>
    </div>
  );
};

export default StatisticsScreen;
