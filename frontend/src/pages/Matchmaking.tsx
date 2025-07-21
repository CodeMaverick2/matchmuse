import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Star, MapPin, DollarSign, User, Target, Gauge, Brain, Shield, Clock, TrendingUp, Search, Filter, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAppStore } from '../stores/useAppStore';
import { gigsApi, matchmakingApi, aiApi } from '../services/api';
import type { Gig, Match, AlgorithmInfo, AIStatus } from '../types';

interface ProjectPreferences {
  profession: string;
  category: string;
  budgetRange: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  radius: number;
  remote: boolean;
  requiredSkills: string[];
  experienceLevel: string;
  styleTags: string[];
  projectDescription: string;
  availability: string;
  rating: number;
}

export const Matchmaking: React.FC = () => {
  const { gigs: allGigs, matches, setMatches, isLoading, setIsLoading } = useAppStore();
  const [selectedGigId, setSelectedGigId] = useState('');
  const [matchLimit, setMatchLimit] = useState('5');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [algorithmInfo, setAlgorithmInfo] = useState<AlgorithmInfo | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  
  // New preference-based state
  const [usePreferences, setUsePreferences] = useState(true);
  const [preferences, setPreferences] = useState<ProjectPreferences>({
    profession: '',
    category: '',
    budgetRange: { min: 10000, max: 50000 },
    timeline: '2 weeks',
    location: 'Mumbai',
    radius: 50,
    remote: true,
    requiredSkills: [],
    experienceLevel: 'Intermediate',
    styleTags: [],
    projectDescription: '',
    availability: 'Flexible',
    rating: 4.0
  });

  // Filter gigs that are available for matchmaking (status 'open' after transformation)
  const availableGigs = allGigs.filter(gig => gig.status === 'open');

  useEffect(() => {
    // Load algorithm info and AI status on component mount
    const loadSystemInfo = async () => {
      try {
        const [algoInfo, aiInfo] = await Promise.all([
          matchmakingApi.getAlgorithmInfo(),
          aiApi.getStatus()
        ]);
        setAlgorithmInfo(algoInfo);
        setAiStatus(aiInfo);
      } catch (error) {
        console.error('Failed to load system info:', error);
      }
    };
    
    loadSystemInfo();
  }, []);

  const generateMatches = async () => {
    if (usePreferences) {
      // Generate matches based on preferences
      await generateMatchesFromPreferences();
    } else {
      // Generate matches from existing gig
      await generateMatchesFromGig();
    }
  };

  const generateMatchesFromPreferences = async () => {
    try {
      setIsGenerating(true);
      const matchData = await matchmakingApi.generateMatches({
        preferences: {
          profession: preferences.profession,
          category: preferences.category,
          budget_range: preferences.budgetRange,
          timeline: preferences.timeline,
          location: preferences.location,
          radius: preferences.radius,
          remote: preferences.remote,
          required_skills: preferences.requiredSkills,
          experience_level: preferences.experienceLevel,
          style_tags: preferences.styleTags,
          project_description: preferences.projectDescription,
          availability: preferences.availability,
          rating: preferences.rating
        },
        limit: parseInt(matchLimit),
        algorithm: selectedAlgorithm as 'gale-shapley' | 'legacy' | 'auto'
      });
      setMatches(matchData.matches);
      setMetadata(matchData.metadata);
    } catch (error) {
      console.error('Failed to generate matches from preferences:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMatchesFromGig = async () => {
    if (!selectedGigId) return;
    
    try {
      setIsGenerating(true);
      const matchData = await matchmakingApi.generateMatches({
        gig_id: selectedGigId,
        limit: parseInt(matchLimit),
        algorithm: selectedAlgorithm as 'gale-shapley' | 'legacy' | 'auto'
      });
      setMatches(matchData.matches);
      setMetadata(matchData.metadata);
    } catch (error) {
      console.error('Failed to generate matches:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-300 bg-green-500/20';
    if (score >= 60) return 'text-blue-300 bg-blue-500/20';
    if (score >= 40) return 'text-orange-300 bg-orange-500/20';
    return 'text-red-300 bg-red-500/20';
  };

  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'locationCompatibility': return <MapPin className="w-4 h-4" />;
      case 'budgetAlignment': return <DollarSign className="w-4 h-4" />;
      case 'skillsMatch': return <Target className="w-4 h-4" />;
      case 'experienceLevel': return <User className="w-4 h-4" />;
      case 'styleSimilarity': return <Star className="w-4 h-4" />;
      default: return <Gauge className="w-4 h-4" />;
    }
  };

  const formatFactorName = (factor: string) => {
    switch (factor) {
      case 'locationCompatibility': return 'Location';
      case 'budgetAlignment': return 'Budget';
      case 'skillsMatch': return 'Skills';
      case 'experienceLevel': return 'Experience';
      case 'styleSimilarity': return 'Style';
      default: return factor;
    }
  };

  const gigOptions = availableGigs.map(gig => ({
    value: gig.id,
    label: `${gig.title} - ${gig.category} (₹${gig.budget.toLocaleString()})`
  }));

  const limitOptions = [
    { value: '3', label: '3 matches' },
    { value: '5', label: '5 matches' },
    { value: '10', label: '10 matches' },
    { value: '20', label: '20 matches' }
  ];

  const algorithmOptions = [
    { value: 'auto', label: 'Auto (Recommended)' },
    { value: 'gale-shapley', label: 'Gale-Shapley (Stable)' },
    { value: 'legacy', label: 'Legacy (Fast)' }
  ];

  const professionOptions = [
    { value: 'Photographer', label: 'Photographer' },
    { value: 'Videographer', label: 'Videographer' },
    { value: 'Designer', label: 'Designer' },
    { value: 'Writer', label: 'Writer' },
    { value: 'Developer', label: 'Developer' },
    { value: 'Musician', label: 'Musician' },
    { value: 'Artist', label: 'Artist' }
  ];

  const experienceOptions = [
    { value: 'Beginner', label: 'Beginner (0-2 years)' },
    { value: 'Intermediate', label: 'Intermediate (2-5 years)' },
    { value: 'Expert', label: 'Expert (5+ years)' }
  ];

  const timelineOptions = [
    { value: '1 week', label: '1 week' },
    { value: '2 weeks', label: '2 weeks' },
    { value: '1 month', label: '1 month' },
    { value: '2 months', label: '2 months' },
    { value: 'Flexible', label: 'Flexible' }
  ];

  const availabilityOptions = [
    { value: 'Immediate', label: 'Immediate' },
    { value: 'Next week', label: 'Next week' },
    { value: 'Flexible', label: 'Flexible' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            AI-Powered Talent Matchmaking
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Tell us what you need and our AI will find the perfect talent matches for your project. 
            Use our Nobel Prize-winning algorithms for stable, optimal matches.
          </p>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Brain className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-white/60">AI Status</p>
                <p className="text-white font-medium">
                  {aiStatus?.semantic_matching.available ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-white/60">Algorithm</p>
                <p className="text-white font-medium">
                  {algorithmInfo?.algorithms.primary || 'Enhanced'}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-white/60">Stability</p>
                <p className="text-white font-medium">
                  {algorithmInfo?.algorithms.galeShapley.stability || 'Guaranteed'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Input Method Selection */}
        <Card className="max-w-2xl mx-auto mb-6">
          <div className="flex space-x-4 mb-4">
            <Button
              variant={usePreferences ? "default" : "outline"}
              onClick={() => setUsePreferences(true)}
              className="flex-1"
            >
              <Search className="w-4 h-4 mr-2" />
              Define My Requirements
            </Button>
            <Button
              variant={!usePreferences ? "default" : "outline"}
              onClick={() => setUsePreferences(false)}
              className="flex-1"
            >
              <Filter className="w-4 h-4 mr-2" />
              Select Existing Gig
            </Button>
          </div>
        </Card>

        {/* Preference-Based Form */}
        {usePreferences && (
          <Card className="max-w-4xl mx-auto mb-6">
            <h2 className="text-xl font-semibold mb-6 text-white">Project Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-3">Basic Information</h3>
                
                <Select
                  label="Profession"
                  value={preferences.profession}
                  onChange={(e) => setPreferences({...preferences, profession: e.target.value})}
                  options={professionOptions}
                  required
                />
                
                <Input
                  label="Category/Specialization"
                  value={preferences.category}
                  onChange={(e) => setPreferences({...preferences, category: e.target.value})}
                  placeholder="e.g., Event Photography, Product Design"
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Min Budget (₹)"
                    type="number"
                    value={preferences.budgetRange.min}
                    onChange={(e) => setPreferences({
                      ...preferences, 
                      budgetRange: {...preferences.budgetRange, min: parseInt(e.target.value)}
                    })}
                    required
                  />
                  <Input
                    label="Max Budget (₹)"
                    type="number"
                    value={preferences.budgetRange.max}
                    onChange={(e) => setPreferences({
                      ...preferences, 
                      budgetRange: {...preferences.budgetRange, max: parseInt(e.target.value)}
                    })}
                    required
                  />
                </div>
                
                <Select
                  label="Timeline"
                  value={preferences.timeline}
                  onChange={(e) => setPreferences({...preferences, timeline: e.target.value})}
                  options={timelineOptions}
                />
              </div>

              {/* Location & Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-3">Location & Requirements</h3>
                
                <Input
                  label="Location"
                  value={preferences.location}
                  onChange={(e) => setPreferences({...preferences, location: e.target.value})}
                  placeholder="e.g., Mumbai, Delhi"
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Radius (km)"
                    type="number"
                    value={preferences.radius}
                    onChange={(e) => setPreferences({...preferences, radius: parseInt(e.target.value)})}
                  />
                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="remote"
                      checked={preferences.remote}
                      onChange={(e) => setPreferences({...preferences, remote: e.target.checked})}
                      className="rounded"
                    />
                    <label htmlFor="remote" className="text-white text-sm">Accept remote work</label>
                  </div>
                </div>
                
                <Select
                  label="Experience Level"
                  value={preferences.experienceLevel}
                  onChange={(e) => setPreferences({...preferences, experienceLevel: e.target.value})}
                  options={experienceOptions}
                />
                
                <Select
                  label="Availability"
                  value={preferences.availability}
                  onChange={(e) => setPreferences({...preferences, availability: e.target.value})}
                  options={availabilityOptions}
                />
              </div>
            </div>

            {/* Skills & Style */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-white">Skills & Style</h3>
              
              <Input
                label="Required Skills (comma-separated)"
                value={preferences.requiredSkills.join(', ')}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                })}
                placeholder="e.g., Portrait Photography, Lighting, Photoshop"
              />
              
              <Input
                label="Style Tags (comma-separated)"
                value={preferences.styleTags.join(', ')}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  styleTags: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                })}
                placeholder="e.g., Professional, Creative, Minimalist"
              />
              
              <Input
                label="Project Description"
                value={preferences.projectDescription}
                onChange={(e) => setPreferences({...preferences, projectDescription: e.target.value})}
                placeholder="Describe your project requirements..."
                multiline
                rows={3}
              />
            </div>
          </Card>
        )}

        {/* Existing Gig Selection */}
        {!usePreferences && (
          <Card className="max-w-2xl mx-auto mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Select Existing Gig</h2>
            {availableGigs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/70 mb-4">No gigs are currently available for matchmaking.</p>
                <p className="text-white/50 text-sm">Try using the preference-based matching instead.</p>
              </div>
            ) : (
              <Select
                label="Select Gig"
                value={selectedGigId}
                onChange={(e) => setSelectedGigId(e.target.value)}
                options={gigOptions}
                required
              />
            )}
          </Card>
        )}

        {/* Algorithm & Match Settings */}
        <Card className="max-w-2xl mx-auto mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Match Settings</h2>
          <div className="space-y-4">
            <Select
              label="Algorithm"
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              options={algorithmOptions}
            />
            
            <Select
              label="Number of Matches"
              value={matchLimit}
              onChange={(e) => setMatchLimit(e.target.value)}
              options={limitOptions}
            />
            
            <Button
              onClick={generateMatches}
              disabled={usePreferences ? !preferences.profession : !selectedGigId}
              loading={isGenerating}
              className="w-full flex items-center justify-center space-x-2"
              size="lg"
            >
              <Zap className="w-5 h-5" />
              <span>{isGenerating ? 'Finding Perfect Matches...' : 'Find Matches'}</span>
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Results */}
      {matches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Match Results
            </h2>
            <p className="text-white/70">
              Found {matches.length} talented professionals for your project
            </p>
            
            {/* Metadata Display */}
            {metadata && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-3 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm">
                      {metadata.processingTimeMs}ms
                    </span>
                  </div>
                  <p className="text-white/60 text-xs">Processing Time</p>
                </Card>
                
                <Card className="p-3 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-white text-sm capitalize">
                      {metadata.stability}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs">Stability</p>
                </Card>
                
                <Card className="p-3 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-white text-sm">
                      {metadata.algorithm}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs">Algorithm</p>
                </Card>
                
                <Card className="p-3 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Target className="w-4 h-4 text-orange-400" />
                    <span className="text-white text-sm">
                      {metadata.totalCandidates || 0}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs">Candidates</p>
                </Card>
              </div>
            )}
          </div>

          <div className="grid gap-6">
            {matches.map((match, index) => (
              <motion.div
                key={match.talent.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Talent Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-1">
                            {match.talent.name}
                          </h3>
                          <p className="text-white/70 mb-2">{match.talent.category}</p>
                          <div className="flex items-center space-x-4 text-sm text-white/60">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {match.talent.location}
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              ₹{match.talent.hourlyRate}/hr
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                              {match.talent.rating}
                            </div>
                          </div>
                        </div>
                        
                        {/* Match Score */}
                        <div className="text-center">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(match.score)}`}>
                            {match.score}%
                          </div>
                          <div className="text-xs text-white/60 mt-1">Match Score</div>
                          
                          {/* Enhanced Algorithm Info */}
                          {match.algorithm && (
                            <div className="mt-2">
                              <div className="text-xs text-white/40">
                                {match.algorithm === 'gale-shapley' && <Shield className="w-3 h-3 inline mr-1" />}
                                {match.algorithm === 'enhanced' && <Brain className="w-3 h-3 inline mr-1" />}
                                {match.algorithm}
                              </div>
                              {match.stability_verified && (
                                <div className="text-xs text-green-400">
                                  ✓ Stable
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Scoring Breakdown */}
                      {match.totalScore && (
                        <div className="mb-4 p-4 bg-white/5 rounded-lg">
                          <h4 className="text-sm font-medium text-white mb-3">AI Scoring Breakdown</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-white/60 mb-1">Rule-Based Score</p>
                              <p className="text-white font-medium">{match.totalScore.ruleBasedScore.total}/60</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/60 mb-1">AI Semantic Score</p>
                              <p className="text-white font-medium">{match.totalScore.semanticScore.total}/40</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/60 mb-1">Style Similarity</p>
                              <p className="text-white font-medium">{match.totalScore.semanticScore.breakdown.styleSimilarity} pts</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/60 mb-1">Semantic Match</p>
                              <p className="text-white font-medium">{match.totalScore.semanticScore.breakdown.semanticMatch} pts</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Match Factors */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(match.factors).map(([factor, score]) => (
                          <div key={factor} className="flex items-center space-x-2">
                            {getFactorIcon(factor)}
                            <div>
                              <p className="text-xs text-white/60">{formatFactorName(factor)}</p>
                              <p className="text-sm text-white font-medium">{score}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reasoning */}
                      <div className="mt-4 p-3 bg-white/5 rounded-lg">
                        <p className="text-sm text-white/80">{match.reasoning}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};