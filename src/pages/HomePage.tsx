import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, DocumentSnapshot } from 'firebase/firestore';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../firebase/config';
import { User } from '../types';
import ProfileCard from '../components/profile/ProfileCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Route, Link } from 'react-router-dom';
import AdminPanel from '../pages/AdminPanel';

const USERS_PER_PAGE = 9;

const availabilityOptions = [
  'Weekdays',
  'Weekends',
  'Mornings',
  'Afternoons',
  'Evenings',
  'Flexible'
];

const HomePage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = async (reset = false) => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'users'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(USERS_PER_PAGE)
      );

      if (!reset && lastDoc) {
        q = query(
          collection(db, 'users'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(USERS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);
      const fetchedUsers = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as User));

      console.log('Fetched users:', fetchedUsers);

      if (reset) {
        setUsers(fetchedUsers);
        setCurrentPage(1);
      } else {
        setUsers(prev => [...prev, ...fetchedUsers]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === USERS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(true);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.skillsOffered.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.skillsWanted.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAvailability = availabilityFilter === '' ||
      user.availability.includes(availabilityFilter);

    return matchesSearch && matchesAvailability;
  });

  const paginatedUsers = filteredUsers.slice(0, currentPage * USERS_PER_PAGE);

  const loadMore = () => {
    if (currentPage * USERS_PER_PAGE >= filteredUsers.length && hasMore) {
      fetchUsers();
    }
    setCurrentPage(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Share Skills, Learn Together
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            Connect with others to exchange knowledge and grow your abilities
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Availability</option>
                {availabilityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* User Grid */}
        {loading && users.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedUsers.map(user => (
              <ProfileCard key={user.uid} user={user} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {paginatedUsers.length < filteredUsers.length || hasMore ? (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Loading...</span>
                </div>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No users found matching your criteria.</p>
          </div>
        ) : null}
      </div>

      
    </div>
  );
};

export default HomePage;