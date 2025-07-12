import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, getDocs, query, where, setDoc } from 'firebase/firestore';
import { ArrowLeft, Send } from 'lucide-react';
import { db } from '../firebase/config';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RequestPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fromSkill: '',
    toSkill: '',
    message: ''
  });

  useEffect(() => {
    const fetchTargetUser = async () => {
      if (!userId || !currentUser) return;

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
          setError('User not found');
          return;
        }

        const userData = { ...userDoc.data(), uid: userDoc.id } as User;
        
        if (!userData.isPublic) {
          setError('This user\'s profile is private');
          return;
        }

        if (userData.uid === currentUser.uid) {
          setError('You cannot request a swap with yourself');
          return;
        }

        setTargetUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchTargetUser();
  }, [userId, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !targetUser) return;

    if (!formData.fromSkill || !formData.toSkill) {
      setError('Please select both skills');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('Sending request:', {
        fromUid: currentUser.uid,
        toUid: targetUser.uid,
        fromUser: { name: currentUser.name, photoURL: currentUser.photoURL },
        toUser: { name: targetUser.name, photoURL: targetUser.photoURL },
        fromSkill: formData.fromSkill,
        toSkill: formData.toSkill,
        message: formData.message,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const requestDoc = await addDoc(collection(db, 'requests'), {
        fromUid: currentUser.uid,
        toUid: targetUser.uid,
        fromUser: {
          name: currentUser.name,
          photoURL: currentUser.photoURL
        },
        toUser: {
          name: targetUser.name,
          photoURL: targetUser.photoURL
        },
        fromSkill: formData.fromSkill,
        toSkill: formData.toSkill,
        message: formData.message,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create chat document
      const chatId = requestDoc.id; // Use request ID as chatId for simplicity
      await setDoc(doc(db, 'chats', chatId), {
        users: [currentUser.uid, targetUser.uid],
        createdAt: new Date()
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/requests');
      }, 2000);
    } catch (error) {
      console.error('Error sending request:', error);
      setError('Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Please log in to send swap requests</p>
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'User not found'}</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-600 mb-6">
            Your swap request has been sent to {targetUser.name}. You'll be notified when they respond.
          </p>
          <Link
            to="/requests"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View My Requests
          </Link>
        </div>
      </div>
    );
  }

  const availableFromSkills = currentUser.skillsOffered.filter(skill =>
    targetUser.skillsWanted.includes(skill)
  );

  const availableToSkills = targetUser.skillsOffered.filter(skill =>
    currentUser.skillsWanted.includes(skill)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to={`/user/${targetUser.uid}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Send Swap Request</h1>
            <p className="text-gray-600 mt-2">
              Request a skill exchange with {targetUser.name}
            </p>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-4">
              <img
                src={targetUser.photoURL || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                alt={targetUser.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{targetUser.name}</h3>
                <p className="text-gray-600">
                  {targetUser.skillsOffered.length} skills offered • {targetUser.skillsWanted.length} skills wanted
                </p>
              </div>
            </div>
          </div>

          {availableFromSkills.length === 0 || availableToSkills.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">
                {availableFromSkills.length === 0 
                  ? "You don't have any skills that this user wants to learn."
                  : "This user doesn't offer any skills that you want to learn."
                }
              </p>
              <p className="text-yellow-700 mt-2">
                Try updating your profile to match more skills, or browse other users.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Your Skill */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Skill to Offer *
                </label>
                <select
                  value={formData.fromSkill}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromSkill: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a skill you can teach...</option>
                  {availableFromSkills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  These are skills you offer that {targetUser.name} wants to learn
                </p>
              </div>

              {/* Their Skill */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill You Want to Learn *
                </label>
                <select
                  value={formData.toSkill}
                  onChange={(e) => setFormData(prev => ({ ...prev, toSkill: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a skill you want to learn...</option>
                  {availableToSkills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  These are skills {targetUser.name} offers that you want to learn
                </p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Introduce yourself and explain why you'd like to exchange skills..."
                />
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center space-x-2"
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestPage;