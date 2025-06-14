import React, { useState, FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { Page } from '../App';

interface RegisterVoterProfilePageProps {
  navigate: (page: Page) => void;
}

const RegisterVoterProfilePage: React.FC<RegisterVoterProfilePageProps> = ({ navigate }) => {
  const [voterId, setVoterId] = useState('');
  const [officialName, setOfficialName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createProfile = useMutation(api.users.createVoterProfile);
  const existingProfile = useQuery(api.users.getCurrentVoterProfile);

  if (existingProfile) {
    // Should not happen if navigation logic is correct, but as a safeguard
    return (
      <div className="text-center p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold text-primary mb-4">Profile Already Exists</h2>
        <p className="text-gray-700 mb-4">Your voter profile is already set up.</p>
        <button 
          onClick={() => navigate('home')}
          className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!voterId || !officialName || !phoneNumber) {
      toast.error("All fields are required.");
      return;
    }
    setIsLoading(true);
    try {
      await createProfile({ voterId, officialName, phoneNumber });
      toast.success("Voter profile created successfully!");
      navigate('home'); // Or navigate to 'vote' page
    } catch (error: any) {
      console.error("Profile creation error:", error);
      toast.error(error.data?.message || error.message || "Failed to create profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white shadow-xl rounded-lg">
      <h2 className="text-3xl font-bold text-primary mb-8 text-center">Complete Your Voter Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="voterId" className="block text-sm font-medium text-gray-700 mb-1">
            Unique Voter ID
          </label>
          <input
            type="text"
            id="voterId"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            required
            className="auth-input-field"
            placeholder="Enter your unique voter ID"
          />
        </div>
        <div>
          <label htmlFor="officialName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Official Name
          </label>
          <input
            type="text"
            id="officialName"
            value={officialName}
            onChange={(e) => setOfficialName(e.target.value)}
            required
            className="auth-input-field"
            placeholder="As per official records"
          />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="auth-input-field"
            placeholder="e.g., +1234567890"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="auth-button w-full flex justify-center items-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterVoterProfilePage;
