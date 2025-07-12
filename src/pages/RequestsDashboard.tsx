import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MessageSquare, Check, X, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { db } from '../firebase/config';
import { SwapRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChatWindow from '../components/chat/ChatWindow';
import { useLocation } from 'react-router-dom';

type RequestTab = 'incoming' | 'outgoing';
type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';

const RequestsDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<RequestTab>('incoming');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const chatRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (!currentUser) return;

    const field = activeTab === 'incoming' ? 'toUid' : 'fromUid';
    const q = query(
      collection(db, 'requests'),
      where(field, '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as SwapRequest));

      setRequests(requestsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (location.hash.startsWith('#chat-')) {
      const chatId = location.hash.replace('#chat-', '');
      const chatDiv = chatRefs.current[chatId];
      if (chatDiv) {
        chatDiv.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash, requests]);

  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  const handleAction = async (requestId: string, action: 'accept' | 'reject' | 'delete') => {
    setActionLoading(requestId);
    
    try {
      if (action === 'delete') {
        await deleteDoc(doc(db, 'requests', requestId));
      } else {
        await updateDoc(doc(db, 'requests', requestId), {
          status: action === 'accept' ? 'accepted' : 'rejected',
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error sending request:', error);
      setError('Failed to send request');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Please log in to view your requests</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Swap Requests</h1>
          <p className="text-gray-600 mt-2">Manage your skill exchange requests</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('incoming')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'incoming'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Incoming Requests
              </button>
              <button
                onClick={() => setActiveTab('outgoing')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'outgoing'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Outgoing Requests
              </button>
            </nav>
          </div>

          {/* Status Filter */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'accepted', 'rejected'] as StatusFilter[]).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600">
              {activeTab === 'incoming' 
                ? "You haven't received any swap requests yet." 
                : "You haven't sent any swap requests yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => {
              const otherUser = activeTab === 'incoming' ? request.fromUser : request.toUser;
              const yourSkill = activeTab === 'incoming' ? request.toSkill : request.fromSkill;
              const theirSkill = activeTab === 'incoming' ? request.fromSkill : request.toSkill;
              
              return (
                <div key={request.id} ref={el => chatRefs.current[request.id] = el} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <img
                        src={otherUser.photoURL || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                        alt={otherUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{otherUser.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status}</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">
                              {activeTab === 'incoming' ? 'They offer:' : 'You offer:'}
                            </p>
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              {theirSkill}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {activeTab === 'incoming' ? 'You offer:' : 'They offer:'}
                            </p>
                            <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              {yourSkill}
                            </span>
                          </div>
                        </div>

                        {request.message && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-gray-700">{request.message}</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          {activeTab === 'incoming' ? 'Received' : 'Sent'} {request.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {activeTab === 'incoming' && request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(request.id, 'accept')}
                            disabled={actionLoading === request.id}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === request.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleAction(request.id, 'reject')}
                            disabled={actionLoading === request.id}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {(request.status === 'pending' || activeTab === 'outgoing') && (
                        <button
                          onClick={() => handleAction(request.id, 'delete')}
                          disabled={actionLoading === request.id}
                          className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chat Window */}
                  {request.status === 'accepted' && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">Chat</h3>
                      <ChatWindow chatId={request.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsDashboard;
