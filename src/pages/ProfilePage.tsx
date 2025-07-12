import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Plus, X, Save } from 'lucide-react';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const skillOptions = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'HTML/CSS',
  'Photoshop', 'Illustrator', 'UI/UX Design', 'Graphic Design',
  'Marketing', 'Content Writing', 'SEO', 'Social Media',
  'Project Management', 'Data Analysis', 'Excel', 'SQL',
  'Teaching', 'Language Translation', 'Photography', 'Video Editing'
];

const availabilityOptions = [
  'Weekdays', 'Weekends', 'Mornings', 'Afternoons', 'Evenings', 'Flexible'
];


const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    location: currentUser?.location || '',
    photoURL: currentUser?.photoURL || '',
    skillsOffered: currentUser?.skillsOffered || [],
    skillsWanted: currentUser?.skillsWanted || [],
    availability: currentUser?.availability || [],
    isPublic: currentUser?.isPublic ?? true
  });

  const [newSkillOffered, setNewSkillOffered] = useState('');
  const [newSkillWanted, setNewSkillWanted] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        location: currentUser.location || '',
        photoURL: currentUser.photoURL || '',
        skillsOffered: currentUser.skillsOffered || [],
        skillsWanted: currentUser.skillsWanted || [],
        availability: currentUser.availability || [],
        isPublic: currentUser.isPublic ?? true
      });
    }
  }, [currentUser]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setPhotoUploading(true);
    try {
      // Upload to Firebase Storage
      const photoRef = ref(storage, `profile-photos/${currentUser.uid}/${file.name}`);
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);

      // Update local state so it appears in the preview
      setFormData(prev => ({ ...prev, photoURL }));

      // Save photoURL to Firestore immediately (optional: or on profile save)
      await updateDoc(doc(db, 'users', currentUser.uid), { photoURL });
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const addSkill = (type: 'offered' | 'wanted', skill: string) => {
    if (!skill.trim()) return;
    
    const key = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
    if (!formData[key].includes(skill)) {
      setFormData(prev => ({
        ...prev,
        [key]: [...prev[key], skill]
      }));
    }
    
    if (type === 'offered') {
      setNewSkillOffered('');
    } else {
      setNewSkillWanted('');
    }
  };

  const removeSkill = (type: 'offered' | 'wanted', skill: string) => {
    const key = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter(s => s !== skill)
    }));
  };

  const toggleAvailability = (option: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(a => a !== option)
        : [...prev.availability, option]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Ensure arrays are always present
      const dataToSave = {
        ...formData,
        skillsOffered: formData.skillsOffered || [],
        skillsWanted: formData.skillsWanted || [],
        availability: formData.availability || [],
        updatedAt: new Date()
      };

      // Print to console for debugging
      console.log('Saving profile data:', dataToSave);

      await updateDoc(doc(db, 'users', currentUser.uid), dataToSave);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-2">Update your information and skills</p>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">Profile updated successfully!</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Photo Upload */}
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={formData.photoURL || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  {photoUploading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={photoUploading}
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* Skills Offered */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Skills Offered
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.skillsOffered.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill('offered', skill)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={newSkillOffered}
                  onChange={(e) => setNewSkillOffered(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a skill...</option>
                  {skillOptions
                    .filter(skill => !formData.skillsOffered.includes(skill))
                    .map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => addSkill('offered', newSkillOffered)}
                  disabled={!newSkillOffered}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Skills Wanted */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Skills Wanted
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.skillsWanted.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill('wanted', skill)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={newSkillWanted}
                  onChange={(e) => setNewSkillWanted(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a skill...</option>
                  {skillOptions
                    .filter(skill => !formData.skillsWanted.includes(skill))
                    .map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => addSkill('wanted', newSkillWanted)}
                  disabled={!newSkillWanted}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Availability
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availabilityOptions.map(option => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.availability.includes(option)}
                      onChange={() => toggleAvailability(option)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Privacy Setting */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make my profile public (others can find and contact me)
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;