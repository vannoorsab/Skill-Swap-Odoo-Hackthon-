import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc, deleteDoc, addDoc, serverTimestamp, arrayRemove, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { User, SwapRequest } from '../types';
import { ShieldCheck, Download, CheckCircle, XCircle, Clock, Trash2, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annMsg, setAnnMsg] = useState('');
  const [annLoading, setAnnLoading] = useState(false);

  // Protect route
  useEffect(() => {
    if (!currentUser) return;
    const checkAdmin = async () => {
      const userDoc = await getDocs(collection(db, 'users'));
      const user = userDoc.docs.find(d => d.id === currentUser.uid)?.data() as User;
      if (!user?.isAdmin) navigate('/');
    };
    checkAdmin();
  }, [currentUser, navigate]);

  // Real-time users and requests
  useEffect(() => {
    setLoading(true);
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User)));
      setLoading(false);
    });
    const unsubRequests = onSnapshot(collection(db, 'requests'), (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as SwapRequest)));
    });
    return () => {
      unsubUsers();
      unsubRequests();
    };
  }, []);

  // Remove skill from user
  const removeSkill = async (uid: string, field: 'skillsOffered' | 'skillsWanted', skill: string) => {
    await updateDoc(doc(db, 'users', uid), { [field]: arrayRemove(skill) });
  };

  // Toggle ban
  const toggleBan = async (uid: string, isBanned: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isBanned: !isBanned });
  };

  // Update request status
  const updateRequestStatus = async (id: string, status: 'accepted' | 'rejected' | 'pending') => {
    await updateDoc(doc(db, 'requests', id), { status, updatedAt: new Date() });
  };

  // Delete request
  const deleteRequest = async (id: string) => {
    await deleteDoc(doc(db, 'requests', id));
  };

  // Add announcement
  const handleAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnLoading(true);
    await addDoc(collection(db, 'announcements'), {
      title: annTitle,
      message: annMsg,
      createdAt: serverTimestamp()
    });
    setAnnTitle('');
    setAnnMsg('');
    setAnnLoading(false);
  };

  // Download users as CSV
  const downloadCSV = () => {
    const csvRows = [
      ['Name', 'Email', 'SkillsOffered', 'SkillsWanted', 'isBanned', 'isPublic'],
      ...users.map(u => [
        u.name,
        u.email,
        `"${u.skillsOffered.join(';')}"`,
        `"${u.skillsWanted.join(';')}"`,
        u.isBanned ? 'Yes' : 'No',
        u.isPublic ? 'Yes' : 'No'
      ])
    ];
    const csv = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Users</h2>
            <button
              onClick={downloadCSV}
              className="mb-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Users CSV
            </button>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {users.map(u => (
                <div key={u.uid} className="border-b pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.photoURL || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </div>
                    <button
                      onClick={() => toggleBan(u.uid, !!u.isBanned)}
                      className={`ml-auto px-3 py-1 rounded-lg text-xs font-medium ${u.isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                  <div className="mt-2 flex gap-4">
                    <div>
                      <span className="font-semibold text-xs">Skills Offered:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {u.skillsOffered.map(skill => (
                          <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{skill}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-xs">Skills Wanted:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {u.skillsWanted.map(skill => (
                          <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Public: {u.isPublic ? 'Yes' : 'No'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skill Swap Requests</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {requests.map(r => (
                <div key={r.id} className="border-b pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-semibold text-xs">From:</span> {r.fromUser?.name}
                      <span className="font-semibold text-xs ml-2">To:</span> {r.toUser?.name}
                    </div>
                    <span className={`ml-auto px-3 py-1 rounded-lg text-xs font-medium ${r.status === 'accepted' ? 'bg-green-100 text-green-800' : r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4">
                    <div>
                      <span className="font-semibold text-xs">Skills:</span> {r.fromSkill} → {r.toSkill}
                    </div>
                  </div>
                  {r.message && (
                    <div className="bg-gray-50 rounded-lg p-2 mt-2 text-xs text-gray-700">{r.message}</div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => updateRequestStatus(r.id, 'accepted')}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                    >
                      <CheckCircle className="w-3 h-3 inline" /> Accept
                    </button>
                    <button
                      onClick={() => updateRequestStatus(r.id, 'rejected')}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                    >
                      <XCircle className="w-3 h-3 inline" /> Reject
                    </button>
                    <button
                      onClick={() => updateRequestStatus(r.id, 'pending')}
                      className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs"
                    >
                      <Clock className="w-3 h-3 inline" /> Pending
                    </button>
                    <button
                      onClick={() => deleteRequest(r.id)}
                      className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                    >
                      <Trash2 className="w-3 h-3 inline" /> Delete
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {r.createdAt.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" /> Announcements
          </h2>
          <form onSubmit={handleAnnouncement} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={annTitle}
                onChange={e => setAnnTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={annMsg}
                onChange={e => setAnnMsg(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write your announcement..."
              />
            </div>
            <button
              type="submit"
              disabled={annLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {annLoading ? 'Sending...' : 'Send Announcement'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;