import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Star, MapPin, DollarSign } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/features/SearchBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAppStore } from '../stores/useAppStore';
import { talentsApi } from '../services/api';
import { CATEGORIES, EXPERIENCE_LEVELS } from '../utils/constants';
import type { Talent } from '../types';

export const Talents: React.FC = () => {
  const { 
    talents, 
    setTalents, 
    filteredTalents, 
    isLoading, 
    setIsLoading 
  } = useAppStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    experience: '',
    location: '',
    hourlyRate: '',
    skills: '',
    bio: '',
    portfolio: ''
  });

  useEffect(() => {
    loadTalents();
  }, []);

  const loadTalents = async () => {
    try {
      setIsLoading(true);
      const data = await talentsApi.getAll();
      setTalents(data);
    } catch (error) {
      console.error('Failed to load talents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const talentData = {
        ...formData,
        hourlyRate: parseFloat(formData.hourlyRate),
        skills: formData.skills.split(',').map(s => s.trim()),
        portfolio: formData.portfolio.split(',').map(s => s.trim()).filter(Boolean),
        availability: true,
        rating: 4.5
      };

      if (editingTalent) {
        await talentsApi.update(editingTalent.id, talentData);
      } else {
        await talentsApi.create(talentData);
      }
      
      await loadTalents();
      closeModal();
    } catch (error) {
      console.error('Failed to save talent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this talent?')) {
      try {
        setIsLoading(true);
        await talentsApi.delete(id);
        await loadTalents();
      } catch (error) {
        console.error('Failed to delete talent:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openModal = (talent?: Talent) => {
    if (talent) {
      setEditingTalent(talent);
      setFormData({
        name: talent.name,
        email: talent.email,
        phone: talent.phone,
        category: talent.category,
        experience: talent.experience,
        location: talent.location,
        hourlyRate: talent.hourlyRate.toString(),
        skills: talent.skills.join(', '),
        bio: talent.bio,
        portfolio: talent.portfolio.join(', ')
      });
    } else {
      setEditingTalent(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: '',
        experience: '',
        location: '',
        hourlyRate: '',
        skills: '',
        bio: '',
        portfolio: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTalent(null);
  };

  const categoryOptions = CATEGORIES.map(cat => ({ value: cat, label: cat }));
  const experienceOptions = EXPERIENCE_LEVELS.map(exp => ({ value: exp, label: exp }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Talents</h1>
            <p className="text-white/70 mt-2">
              Manage and browse creative professionals
            </p>
          </div>
          <Button
            onClick={() => openModal()}
            className="flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Talent</span>
          </Button>
        </div>
        
        <SearchBar />
      </motion.div>

      {isLoading && talents.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTalents().map((talent, index) => (
            <motion.div
              key={talent.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {talent.name}
                    </h3>
                    <p className="text-sm text-white/70 mb-2">{talent.category}</p>
                    <div className="flex items-center space-x-4 text-sm text-white/60 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {talent.location}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ₹{talent.hourlyRate}/hr
                      </div>
                    </div>
                    <div className="flex items-center mb-3">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium">{talent.rating}</span>
                      <span className="text-sm text-white/60 ml-1">
                        ({talent.experience})
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(talent)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(talent.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-white/70 mb-3 line-clamp-2">
                  {talent.bio}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {talent.skills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                  {talent.skills.length > 3 && (
                    <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-md">
                      +{talent.skills.length - 3} more
                    </span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTalent ? 'Edit Talent' : 'Add Talent'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Hourly Rate"
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              required
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categoryOptions}
              required
            />
            <Select
              label="Experience"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              options={experienceOptions}
              required
            />
            <Input
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
          
          <Input
            label="Skills (comma-separated)"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="e.g., Portrait Photography, Event Photography, Photo Editing"
            required
          />
          
          <Input
            label="Portfolio URLs (comma-separated)"
            value={formData.portfolio}
            onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
            placeholder="e.g., https://portfolio1.com, https://portfolio2.com"
          />
          
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="block w-full px-4 py-3 glass-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="Tell us about your experience and expertise..."
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={closeModal} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {editingTalent ? 'Update' : 'Create'} Talent
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};