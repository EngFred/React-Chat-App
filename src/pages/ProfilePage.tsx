import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCamera } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import axios from 'axios';
import type { User } from '../types/user';
import { motion } from 'framer-motion';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  profilePicture: z.string().optional(),
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loadingAuth, updateUserProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser && !loadingAuth) {
        try {
          const userDocRef = doc(db, `artifacts/${appId}/users`, currentUser.id);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            setValue('username', userData.username);
            setCurrentProfilePicture(userData.profilePicture || null);
            setValue('profilePicture', userData.profilePicture || '');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load profile data.");
        }
      }
    };
    fetchUserData();
  }, [currentUser, loadingAuth, setValue]);

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'YOUR_CLOUDINARY_UPLOAD_PRESET');
    formData.append('cloud_name', 'YOUR_CLOUDINARY_CLOUD_NAME');

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/YOUR_CLOUDINARY_CLOUD_NAME/image/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      toast.error('Failed to upload profile picture.');
      throw error;
    }
  };

  const onSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
    if (!currentUser) {
      toast.error('No authenticated user found.');
      return;
    }

    setLoading(true);
    let newProfilePictureUrl = currentProfilePicture;

    try {
      const fileInput = document.getElementById('profilePictureUpload') as HTMLInputElement;
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        newProfilePictureUrl = await uploadImageToCloudinary(fileInput.files[0]);
      }

      await updateUserProfile(data.username, newProfilePictureUrl);
      setCurrentProfilePicture(newProfilePictureUrl);
    } catch (error: any) {
      // Error handled by toast in authStore
    } finally {
      setLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-text-primary text-lg">
        Loading profile...
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background text-text-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center p-3 sm:p-4 bg-background border-b border-border shadow-sm">
        <motion.button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-full hover:bg-input-bg text-text-secondary transition-colors duration-200 mr-3"
          title="Back to settings"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiArrowLeft size={24} />
        </motion.button>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Edit Profile</h1>
      </div>
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex justify-center items-start">
        <motion.div
          className="bg-background rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-md">
                <motion.img
                  src={currentProfilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'User')}&background=random&color=fff&size=128`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'User')}&background=random&color=fff&size=128`;
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                />
                <label htmlFor="profilePictureUpload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <FiCamera size={30} />
                </label>
                <input
                  type="file"
                  id="profilePictureUpload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setCurrentProfilePicture(event.target?.result as string);
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                />
              </div>
              <p className="text-sm text-text-secondary mt-2">Click to change profile picture</p>
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
                Username
              </label>
              <motion.input
                type="text"
                id="username"
                {...register('username')}
                className="w-full p-3 rounded-lg border border-border bg-input-bg text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                placeholder="Your username"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full p-3 rounded-lg border border-border bg-gray-100 dark:bg-gray-700 text-text-secondary cursor-not-allowed"
              />
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-[var(--color-button-text)] p-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05, boxShadow: '0 0 8px var(--color-accent)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? 'Updating...' : 'Save Changes'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;