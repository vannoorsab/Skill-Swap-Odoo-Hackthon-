import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface ProfileCardProps {
  user: User;
  showRequestButton?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, showRequestButton = true }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chatId, setChatId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchAcceptedSwap = async () => {
      if (!currentUser || currentUser.uid === user.uid) return;
      const q = query(
        collection(db, 'requests'),
        where('status', '==', 'accepted'),
        where('fromUid', 'in', [currentUser.uid, user.uid]),
        where('toUid', 'in', [currentUser.uid, user.uid])
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setChatId(snapshot.docs[0].id);
      }
    };
    fetchAcceptedSwap();
  }, [currentUser, user.uid]);

  const handleChatClick = () => {
    if (chatId) {
      navigate(`/requests#chat-${chatId}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    await setDoc(
      doc(db, 'users', currentUser.uid, 'savedProfiles', user.uid),
      { saved: true }
    );
    setSaved(true);
  };

  const canShowRequestButton = currentUser && currentUser.uid !== user.uid && showRequestButton;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <img
          src={user.photoURL || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
          alt={user.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
          {user.location && (
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {user.location}
            </div>
          )}
          {user.rating && (
            <div className="flex items-center mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">
                {user.rating.toFixed(1)} ({user.reviewCount || 0} reviews)
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Skills Offered</h4>
          <div className="flex flex-wrap gap-1">
            {user.skillsOffered.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
              >
                {skill}
                {user.verifiedSkills?.includes(skill) && (
                  <CheckCircle className="w-3 h-3 text-green-500" title="Verified Skill" />
                )}
              </span>
            ))}
            {user.skillsOffered.length > 0 && (
              <span className="text-xs text-gray-500">+{user.skillsOffered.length - 3} more</span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Skills Wanted</h4>
          <div className="flex flex-wrap gap-1">
            {user.skillsWanted.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
            {user.skillsWanted.length > 3 && (
              <span className="text-xs text-gray-500">+{user.skillsWanted.length - 3} more</span>
            )}
          </div>
        </div>

        {user.availability.length > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            Available: {user.availability.join(', ')}
          </div>
        )}
      </div>

      <div className="mt-6 flex space-x-3">
        <Link
          to={`/user/${user.uid}`}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium text-center hover:bg-gray-200 transition-colors"
        >
          View Profile
        </Link>
        {canShowRequestButton && (
          <Link
            to={`/request/${user.uid}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center hover:bg-blue-700 transition-colors"
          >
            Request Swap
          </Link>
        )}
        {chatId && (
          <button
            onClick={handleChatClick}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        )}
        {currentUser && (
          <button
            onClick={handleSaveProfile}
            disabled={saved}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-2 ${
              saved ? 'bg-yellow-400 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            <Star className="w-4 h-4" />
            {saved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;