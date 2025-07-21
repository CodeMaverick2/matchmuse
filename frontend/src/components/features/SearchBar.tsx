import React from 'react';
import { Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/useAppStore';
import { CATEGORIES } from '../../utils/constants';

interface SearchBarProps {
  showCategoryFilter?: boolean;
  showLocationFilter?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  showCategoryFilter = true,
  showLocationFilter = true
}) => {
  const {
    searchTerm,
    selectedCategory,
    selectedLocation,
    setSearchTerm,
    setSelectedCategory,
    setSelectedLocation
  } = useAppStore();
  
  const categoryOptions = CATEGORIES.map(cat => ({ value: cat, label: cat }));
  
  const locationOptions = [
    { value: 'New York', label: 'New York' },
    { value: 'Los Angeles', label: 'Los Angeles' },
    { value: 'San Francisco', label: 'San Francisco' },
    { value: 'Chicago', label: 'Chicago' },
    { value: 'Austin', label: 'Austin' },
    { value: 'Seattle', label: 'Seattle' }
  ];
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLocation('');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl mb-6"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
          <Input
            placeholder="Search by name, email, skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {showCategoryFilter && (
          <div className="w-full md:w-48">
            <Select
              placeholder="Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categoryOptions}
            />
          </div>
        )}
        
        {showLocationFilter && (
          <div className="w-full md:w-48">
            <Select
              placeholder="Location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              options={locationOptions}
            />
          </div>
        )}
        
        <Button
          variant="outline"
          onClick={clearFilters}
          className="flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Clear</span>
        </Button>
      </div>
    </motion.div>
  );
};