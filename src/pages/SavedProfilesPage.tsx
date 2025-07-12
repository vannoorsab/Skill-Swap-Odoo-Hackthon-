import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import ProfileCard from '../components/profile/ProfileCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { User } from '../types';

const SavedProfilesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [profiles, setProfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedProfiles = async () => {
      if (!currentUser) return;
      setLoading(true);
      const savedSnap = await getDocs(collection(db, 'users', currentUser.uid, 'savedProfiles'));
      const profileIds = savedSnap.docs.map(doc => doc.id);
      const profilePromises = profileIds.map(async uid => {
        const userDoc = await getDoc(doc(db, 'users', uid));
        return userDoc.exists() ? { ...userDoc.data(), uid } as User : null;
      });
      const profilesData = (await Promise.all(profilePromises)).filter(Boolean) as User[];
      setProfiles(profilesData);
      setLoading(false);
    };
    fetchSavedProfiles();
  }, [currentUser]);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Saved Profiles</h1>
        {profiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-lg">No saved profiles yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(profile => (
              <ProfileCard key={profile.uid} user={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedProfilesPage;