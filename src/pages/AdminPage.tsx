import React, { useState, FormEvent, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';
import { Page } from '../App';

interface AdminPageProps {
  navigate: (page: Page) => void;
}

type CandidateFormData = {
  name: string;
  description?: string; // Changed from descriptionText
  imageUrl?: string;
};

const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
  const candidates = useQuery(api.candidates.listCandidates) || [];
  const addCandidateMutation = useMutation(api.candidates.addCandidate);
  const updateCandidateMutation = useMutation(api.candidates.updateCandidate);
  const deleteCandidateMutation = useMutation(api.candidates.deleteCandidate);
  const voteCounts = useQuery(api.candidates.getVoteCounts) || {};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Id<"candidates"> | null>(null);
  const [formData, setFormData] = useState<CandidateFormData>({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCandidate) {
      const candidateToEdit = candidates.find(c => c._id === editingCandidate);
      if (candidateToEdit) {
        setFormData({
          name: candidateToEdit.name,
          description: candidateToEdit.description, // Changed from descriptionText
          imageUrl: candidateToEdit.imageUrl,
        });
      }
    } else {
      setFormData({ name: '', description: '', imageUrl: '' });
    }
  }, [editingCandidate, candidates, isModalOpen]);

  const openModalForCreate = () => {
    setEditingCandidate(null);
    setFormData({ name: '', description: '', imageUrl: '' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (candidateId: Id<"candidates">) => {
    setEditingCandidate(candidateId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCandidate(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Candidate name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingCandidate) {
        await updateCandidateMutation({ candidateId: editingCandidate, ...formData });
        toast.success("Candidate updated successfully!");
      } else {
        await addCandidateMutation(formData);
        toast.success("Candidate added successfully!");
      }
      closeModal();
    } catch (error: any) {
      toast.error(error.data?.message || error.message || "Operation failed.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (candidateId: Id<"candidates">) => {
    if (window.confirm("Are you sure you want to delete this candidate and all associated votes? This action cannot be undone.")) {
      setIsSubmitting(true);
      try {
        await deleteCandidateMutation({ candidateId });
        toast.success("Candidate deleted successfully.");
      } catch (error: any) {
        toast.error(error.data?.message || error.message || "Failed to delete candidate.");
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <div className="p-4 md:p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-indigo-700">Admin Dashboard</h1>
        <button 
          onClick={() => navigate('home')}
          className="button button-secondary text-sm"
        >
          Back to Home
        </button>
      </div>

      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Manage Candidates</h2>
          <button onClick={openModalForCreate} className="button button-primary text-sm">
            Add Candidate
          </button>
        </div>
        {candidates.length === 0 && !isModalOpen && (
          <p className="text-gray-600">No candidates added yet. Click "Add Candidate" to start.</p>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.map(candidate => (
                <tr key={candidate._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {candidate.imageUrl ? (
                      <img src={candidate.imageUrl} alt={candidate.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-sm">No Img</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{candidate.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{candidate.description || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => openModalForEdit(candidate._id)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => handleDelete(candidate._id)} className="text-red-600 hover:text-red-900" disabled={isSubmitting}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Election Results</h2>
        {Object.keys(voteCounts).length === 0 ? (
          <p className="text-gray-600">No votes cast yet, or no candidates available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(voteCounts)
              .sort(([, a], [, b]) => b.count - a.count) 
              .map(([candidateId, data]) => (
              <div key={candidateId} className="p-4 border rounded-lg shadow bg-gray-50">
                <div className="flex items-center mb-2">
                  {data.imageUrl && <img src={data.imageUrl} alt={data.name} className="h-12 w-12 rounded-full object-cover mr-3" />}
                  <h3 className="text-lg font-semibold text-gray-700">{data.name}</h3>
                </div>
                <p className="text-2xl font-bold text-primary">{data.count} <span className="text-sm font-normal text-gray-600">Votes</span></p>
                {data.description && <p className="text-xs text-gray-500 mt-1 truncate">{data.description}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">User Management</h2>
        <p className="text-gray-500 italic">User management features (viewing voter profiles, managing admin status) will be implemented here.</p>
        <div className="mt-3 h-24 bg-gray-100 rounded animate-pulse"></div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-8 bg-white w-full max-w-lg mx-auto rounded-lg shadow-xl">
            <h3 className="text-xl font-semibold mb-6">{editingCandidate ? "Edit Candidate" : "Add New Candidate"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="mt-1 input-field" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea name="description" id="description" value={formData.description || ''} onChange={handleInputChange} rows={3} className="mt-1 input-field"></textarea>
              </div>
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
                <input type="url" name="imageUrl" id="imageUrl" value={formData.imageUrl || ''} onChange={handleInputChange} className="mt-1 input-field" placeholder="https://example.com/image.png"/>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="button button-secondary" disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="button button-primary" disabled={isSubmitting}>
                  {isSubmitting ? (editingCandidate ? "Updating..." : "Adding...") : (editingCandidate ? "Save Changes" : "Add Candidate")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
