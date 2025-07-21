import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building, MapPin, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/features/SearchBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAppStore } from '../stores/useAppStore';
import { clientsApi } from '../services/api';
import type { Client } from '../types';

export const Clients: React.FC = () => {
  const { 
    clients, 
    setClients, 
    filteredClients, 
    isLoading, 
    setIsLoading 
  } = useAppStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    location: '',
    preferences: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const clientData = {
        ...formData,
        preferences: formData.preferences.split(',').map(s => s.trim()),
        projectHistory: 0
      };

      if (editingClient) {
        await clientsApi.update(editingClient.id, clientData);
      } else {
        await clientsApi.create(clientData);
      }
      
      await loadClients();
      closeModal();
    } catch (error) {
      console.error('Failed to save client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        setIsLoading(true);
        await clientsApi.delete(id);
        await loadClients();
      } catch (error) {
        console.error('Failed to delete client:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        industry: client.industry,
        location: client.location,
        preferences: client.preferences.join(', ')
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        industry: '',
        location: '',
        preferences: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Clients</h1>
            <p className="text-white/70 mt-2">
              Manage your client relationships and projects
            </p>
          </div>
          <Button
            onClick={() => openModal()}
            className="flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Client</span>
          </Button>
        </div>
        
        <SearchBar showCategoryFilter={false} />
      </motion.div>

      {isLoading && clients.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients().map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {client.name}
                    </h3>
                    <div className="flex items-center text-sm text-white/70 mb-2">
                      <Building className="w-4 h-4 mr-1" />
                      {client.company}
                    </div>
                    <div className="flex items-center text-sm text-white/60 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {client.location}
                    </div>
                    <div className="flex items-center text-sm text-white/60 mb-3">
                      <Calendar className="w-4 h-4 mr-1" />
                      {client.projectHistory} projects
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(client)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <span className="text-sm font-medium text-white/90">Industry:</span>
                  <span className="text-sm text-white/70 ml-1">{client.industry}</span>
                </div>
                
                <div className="mb-3">
                  <span className="text-sm font-medium text-white/90">Contact:</span>
                  <div className="text-sm text-white/70">
                    <div>{client.email}</div>
                    <div>{client.phone}</div>
                  </div>
                </div>
                
                {client.preferences.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {client.preferences.slice(0, 3).map((pref, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-md"
                      >
                        {pref}
                      </span>
                    ))}
                    {client.preferences.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-md">
                        +{client.preferences.length - 3} more
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
        title={editingClient ? 'Edit Client' : 'Add Client'}
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
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
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
            label="Preferences (comma-separated)"
            value={formData.preferences}
            onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
            placeholder="e.g., High-end photography, Quick turnaround, Local talent"
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={closeModal} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {editingClient ? 'Update' : 'Create'} Client
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};