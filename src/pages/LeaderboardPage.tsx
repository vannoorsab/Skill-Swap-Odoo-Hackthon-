import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Feedback, SwapRequest } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Star, Trophy } from 'lucide-react';

interface LeaderboardUser extends User {
  swapsCount: number;
  averageRating: number;
}

const LeaderboardPage: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      // Fetch all users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));

      // Fetch all accepted requests
      const requestsSnap = await getDocs(query(collection(db, 'requests'), where('status', '==', 'accepted')));
      const requestsData = requestsSnap.docs.map(doc => doc.data() as SwapRequest);

      // Fetch all feedback
      const feedbackSnap = await getDocs(collection(db, 'feedback'));
      const feedbackData = feedbackSnap.docs.map(doc => doc.data() as Feedback);

      // Calculate swaps count and average rating for each user
      const leaderboard: LeaderboardUser[] = usersData.map(user => {
        const swapsCount = requestsData.filter(
          r => r.fromUid === user.uid || r.toUid === user.uid
        ).length;

        const userFeedback = feedbackData.filter(f => f.toUid === user.uid);
        const averageRating =
          userFeedback.length > 0
            ? userFeedback.reduce((sum, f) => sum + f.rating, 0) / userFeedback.length
            : 0;

        return {
          ...user,
          swapsCount,
          averageRating,
        };
      });

      // Sort by swapsCount, then averageRating
      leaderboard.sort((a, b) => {
        if (b.swapsCount !== a.swapsCount) return b.swapsCount - a.swapsCount;
        return b.averageRating - a.averageRating;
      });

      setUsers(leaderboard);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-lg">No active swappers yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.slice(0, 20).map((user, idx) => (
              <div
                key={user.uid}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4 ${
                  idx === 0 ? 'border-yellow-400 ring-2 ring-yellow-300' : ''
                }`}
              >
                <div>
                  <img
                    src={user.photoURL || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                    alt={user.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{user.name}</h3>
                    {idx === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.location}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {user.swapsCount} swaps
                    </span>
                    <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                      <Star className="w-4 h-4" />
                      {user.averageRating.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;