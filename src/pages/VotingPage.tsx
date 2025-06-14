import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';
import { Page } from '../App';

interface VotingPageProps {
  navigate: (page: Page) => void;
}

const VotingPage: React.FC<VotingPageProps> = ({ navigate }) => {
  const candidates = useQuery(api.candidates.listCandidates) || [];
  const castVoteMutation = useMutation(api.candidates.castVote);
  const voterProfile = useQuery(api.users.getCurrentVoterProfile);
  const userHasVoted = useQuery(api.candidates.hasVoted) ?? false;

  const [selectedCandidate, setSelectedCandidate] = useState<Id<"candidates"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async () => {
    if (!selectedCandidate) {
      toast.error("Please select a candidate to vote for.");
      return;
    }
    if (!voterProfile) {
      toast.error("Please complete your voter profile before voting.");
      navigate("registerProfile");
      return;
    }
    if (userHasVoted) {
      toast.info("You have already cast your vote.");
      return;
    }

    setIsSubmitting(true);
    try {
      await castVoteMutation({ candidateId: selectedCandidate });
      toast.success("Your vote has been cast successfully!");
    } catch (error: any) {
      toast.error(error.data?.message || error.message || "Failed to cast vote.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!voterProfile && voterProfile !== undefined) {
    return (
      <div className="text-center p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold text-primary mb-4">Profile Incomplete</h2>
        <p className="text-gray-700 mb-4">You need to complete your voter profile before you can vote.</p>
        <button 
          onClick={() => navigate('registerProfile')}
          className="button button-primary"
        >
          Complete Profile
        </button>
      </div>
    );
  }
  
  if (userHasVoted) {
    return (
      <div className="text-center p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-primary mb-6">Thank You for Voting!</h1>
        <p className="text-gray-700 mb-4">You have already cast your vote in this election.</p>
        <p className="text-gray-600">Results will be announced once the polling period ends.</p>
        <button 
          onClick={() => navigate('home')}
          className="mt-6 button button-secondary"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-primary mb-8 text-center">Cast Your Vote</h1>
      
      {candidates.length === 0 ? (
        <p className="text-gray-600 text-center">No candidates are currently available for voting.</p>
      ) : (
        <div className="space-y-6">
          {candidates.map(candidate => (
            <div 
              key={candidate._id}
              onClick={() => setSelectedCandidate(candidate._id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out
                          ${selectedCandidate === candidate._id ? 'border-primary ring-2 ring-primary shadow-xl' : 'border-gray-300 hover:shadow-md'}`}
            >
              <div className="flex items-center space-x-4">
                {candidate.imageUrl ? (
                  <img src={candidate.imageUrl} alt={candidate.name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">No Img</div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{candidate.name}</h2>
                  <p className="text-sm text-gray-600 max-w-md truncate">{candidate.description || "No description available."}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {candidates.length > 0 && (
        <div className="mt-10 text-center">
          <button
            onClick={handleVote}
            disabled={!selectedCandidate || isSubmitting || userHasVoted}
            className="button button-primary px-8 py-3 text-lg"
          >
            {isSubmitting ? "Submitting Vote..." : "Submit My Vote"}
          </button>
          {!selectedCandidate && <p className="text-sm text-red-500 mt-2">Please select a candidate.</p>}
        </div>
      )}
       <div className="text-center mt-10">
        <button 
          onClick={() => navigate('home')}
          className="button button-secondary text-sm"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default VotingPage;
