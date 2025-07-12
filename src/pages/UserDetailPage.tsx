import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { MapPin, Star, Clock, MessageSquare, ArrowLeft } from 'lucide-react';
import { db } from '../firebase/config';
import { User, Feedback } from '../types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [canLeaveFeedback, setCanLeaveFeedback] = useState(false);
  const [completedRequestId, setCompletedRequestId] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          setError('User not found');
          return;
        }

        const userData = { ...userDoc.data(), uid: userDoc.id } as User;
        
        // Only show public profiles or own profile
        if (!userData.isPublic && currentUser?.uid !== userId) {
          setError('This profile is private');
          return;
        }

        setUser(userData);

        // Fetch feedback
        const feedbackQuery = query(
          collection(db, 'feedback'),
          where('toUid', '==', userId)
        );
        const feedbackSnapshot = await getDocs(feedbackQuery);
        const feedbackData = feedbackSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          } as Feedback;
        });
        setFeedback(feedbackData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser]);

  useEffect(() => {
    const checkCompletedSwap = async () => {
      if (!currentUser || !userId) return;
      // Find accepted requests between currentUser and profile user
      const requestsQuery = query(
        collection(db, 'requests'),
        where('status', '==', 'accepted'),
        where('fromUid', 'in', [currentUser.uid, userId]),
        where('toUid', 'in', [currentUser.uid, userId])
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const completed = requestsSnapshot.docs.find(doc => {
        const data = doc.data();
        // Either user can be fromUid or toUid
        return (
          (data.fromUid === currentUser.uid && data.toUid === userId) ||
          (data.fromUid === userId && data.toUid === currentUser.uid)
        );
      });
      if (completed) {
        setCanLeaveFeedback(true);
        setCompletedRequestId(completed.id);
      } else {
        setCanLeaveFeedback(false);
        setCompletedRequestId(null);
      }
    };
    checkCompletedSwap();
  }, [currentUser, userId]);

  useEffect(() => {
    const fetchAcceptedSwap = async () => {
      if (!currentUser || !user) return;
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
  }, [currentUser, user]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !completedRequestId) {
      setError('You must have a completed swap to leave feedback');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Add feedback to Firestore
      const newFeedback: Feedback = {
        rating,
        comment,
        toUid: userId,
        fromUid: currentUser.uid,
        requestId: completedRequestId,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'feedback'), newFeedback);

      // Update local feedback state
      setFeedback(prev => [...prev, newFeedback]);

      // Reset form
      setRating(5);
      setComment('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = () => {
    if (chatId) {
      navigate(`/requests#chat-${chatId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'User not found'}</p>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = feedback.length > 0 
    ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
    : 0;

  const canRequestSwap = currentUser && currentUser.uid !== user.uid;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Browse
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <img
                src={user.photoURL || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                {user.location && (
                  <div className="flex items-center justify-center md:justify-start text-blue-100 mt-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {user.location}
                  </div>
                )}
                {averageRating > 0 && (
                  <div className="flex items-center justify-center md:justify-start mt-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-blue-100">
                      {averageRating.toFixed(1)} ({feedback.length} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills Offered</h2>
                <div className="flex flex-wrap gap-2">
                  {user.skillsOffered.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills Wanted</h2>
                <div className="flex flex-wrap gap-2">
                  {user.skillsWanted.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability */}
            {user.availability.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability</h2>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>{user.availability.join(', ')}</span>
                </div>
              </div>
            )}

            {/* Reviews */}
            {feedback.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h2>
                <div className="space-y-4">
                  {feedback.map((review, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-2">
                          {review.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Form */}
            {currentUser && canLeaveFeedback && !showFeedbackForm && (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <button
                  onClick={() => setShowFeedbackForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit Your Feedback
                </button>
              </div>
            )}

            {currentUser && canLeaveFeedback && showFeedbackForm && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave a Review</h2>
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <select
                      value={rating}
                      onChange={e => setRating(Number(e.target.value))}
                      className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment
                    </label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Submit Feedback
                  </button>
                </form>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              {canRequestSwap && (
                <Link
                  to={`/request/${user.uid}`}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Request Swap</span>
                </Link>
              )}
              {chatId && (
                <button
                  onClick={handleChatClick}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;