import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, DollarSign, MapPin, Clock, User } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/features/SearchBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAppStore } from '../stores/useAppStore';
import { gigsApi, clientsApi } from '../services/api';
import { CATEGORIES } from '../utils/constants';
import type { Gig, Client } from '../types';

export const Gigs: React.FC = () => {
  const { 
    gigs, 
    setGigs, 
    filteredGigs, 
    isLoading, 
    setIsLoading 
  } = useAppStore();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    timeline: '',
    requirements: '',
    clientId: '',
    status: 'open' as const
  });

  useEffect(() => {
    loadGigs();
    loadClients();
  }, []);

  const loadGigs = async () => {
    try {
      setIsLoading(true);
      const data = await gigsApi.getAll();
      setGigs(data);
    } catch (error) {
      console.error('Failed to load gigs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const gigData = {
        ...formData,
        budget: parseFloat(formData.budget),
        requirements: formData.requirements.split(',').map(s => s.trim())
      };

      if (editingGig) {
        await gigsApi.update(editingGig.id, gigData);
      } else {
        await gigsApi.create(gigData);
      }
      
      await loadGigs();
      closeModal();
    } catch (error) {
      console.error('Failed to save gig:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this gig?')) {
      try {
        setIsLoading(true);
        await gigsApi.delete(id);
        await loadGigs();
      } catch (error) {
        console.error('Failed to delete gig:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openModal = (gig?: Gig) => {
    if (gig) {
      setEditingGig(gig);
      setFormData({
        title: gig.title,
        description: gig.description,
        category: gig.category,
        budget: gig.budget.toString(),
        location: gig.location,
        timeline: gig.timeline,
        requirements: gig.requirements.join(', '),
        clientId: gig.clientId,
        status: gig.status
      });
    } else {
      setEditingGig(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        budget: '',
        location: '',
        timeline: '',
        requirements: '',
        clientId: '',
        status: 'open'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGig(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/20 text-green-300';
      case 'in-progress': return 'bg-blue-500/20 text-blue-300';
      case 'completed': return 'bg-purple-500/20 text-purple-300';
      case 'cancelled': return 'bg-red-500/20 text-red-300';
      default: return 'bg-white/10 text-white/70';
    }
  };

  const categoryOptions = CATEGORIES.map(cat => ({ value: cat, label: cat }));
  const clientOptions = clients.map(client => ({ 
    value: client.id, 
    label: `${client.name} (${client.company})` 
  }));
  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Gigs</h1>
            <p className="text-white/70 mt-2">
              Manage project opportunities and requirements
            </p>
          </div>
          <Button
            onClick={() => openModal()}
            className="flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Gig</span>
          </Button>
        </div>
        
        <SearchBar />
      </motion.div>

      {isLoading && gigs.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGigs().map((gig, index) => (
            <motion.div
              key={gig.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {gig.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(gig.status)}`}>
                        {gig.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 mb-2">{gig.category}</p>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-sm text-white/60">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ₹{gig.budget.toLocaleString()}
                      </div>
                      <div className="flex items-center text-sm text-white/60">
                        <MapPin className="w-4 h-4 mr-1" />
                        {gig.location}
                      </div>
                      <div className="flex items-center text-sm text-white/60">
                        <Clock className="w-4 h-4 mr-1" />
                        {gig.timeline}
                      </div>
                      {gig.client && (
                        <div className="flex items-center text-sm text-white/60">
                          <User className="w-4 h-4 mr-1" />
                          {gig.client.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(gig)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(gig.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-white/70 mb-3 line-clamp-2">
                  {gig.description}
                </p>
                
                {gig.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {gig.requirements.slice(0, 3).map((req, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-md"
                      >
                        {req}
                      </span>
                    ))}
                    {gig.requirements.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-md">
                        +{gig.requirements.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingGig ? 'Edit Gig' : 'Add Gig'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="block w-full px-4 py-3 glass-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300"
              required
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categoryOptions}
              required
            />
            <Input
              label="Budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              required
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
            <Input
              label="Timeline"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              placeholder="e.g., 2 weeks, 1 month"
              required
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Client"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              options={clientOptions}
              required
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={statusOptions}
              required
            />
          </div>
          
          <Input
            label="Requirements (comma-separated)"
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            placeholder="e.g., 5+ years experience, Portfolio required, Available weekends"
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={closeModal} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {editingGig ? 'Update' : 'Create'} Gig
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};