import React from 'react';
import { Authenticated, Unauthenticated, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SignInForm } from '../SignInForm'; // Assuming this is the standard sign-in/sign-up form
import { Page } from '../App'; // Import Page type

interface HomePageProps {
  navigate: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const voterProfile = useQuery(api.users.getCurrentVoterProfile);

  return (
    <div className="text-center p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-4xl font-bold text-primary mb-6">Welcome to the Online Voting Platform!</h1>
      
      <Authenticated>
        <p className="text-xl text-gray-700 mb-4">
          Hello, {loggedInUser?.name || loggedInUser?.email || "Voter"}!
        </p>
        {voterProfile === undefined && <p>Loading profile...</p>}
        {voterProfile === null && loggedInUser && (
          <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
            <p className="font-semibold">Your voter profile is not yet complete.</p>
            <p className="mb-3">Please complete your profile to participate in voting.</p>
            <button 
              onClick={() => navigate("registerProfile")}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Complete Profile Now
            </button>
          </div>
        )}
        {voterProfile && (
          <p className="text-lg text-green-600 mt-4">Your voter profile is active. You can proceed to vote when polls are open.</p>
        )}
      </Authenticated>

      <Unauthenticated>
        <p className="text-xl text-gray-600 mb-8">Please sign in or register to continue.</p>
        <div className="max-w-sm mx-auto">
          <SignInForm /> 
          {/* SignInForm handles both sign-in and sign-up. 
              If you need a separate registration form for initial user creation (email/password),
              you might need to customize or create a new one.
              The current flow is: sign up via SignInForm, then complete voter profile.
          */}
        </div>
      </Unauthenticated>
      
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">How it Works</h2>
        <ol className="list-decimal list-inside text-left max-w-md mx-auto text-gray-700 space-y-2">
          <li>Register an account with your email and password.</li>
          <li>Complete your voter profile with your unique Voter ID and other details.</li>
          <li>Once polls are open, browse candidates and cast your vote.</li>
          <li>Admins can manage candidates, users, and view election results.</li>
        </ol>
      </div>
    </div>
  );
};

export default HomePage;
