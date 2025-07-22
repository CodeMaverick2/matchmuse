import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Zap, BarChart3, Star, Play, CheckCircle, TrendingUp, Award, Globe, Sparkles, Target, Brain, Clock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';
import { ROUTES } from '../utils/constants';
import { useAppStore } from '../stores/useAppStore';

export const Home: React.FC = () => {
  const { talentCount, clientCount, gigCount } = useAppStore();
  
  const features = [
    {
      icon: Users,
      title: 'Talent Management',
      description: 'Manage creative professionals with comprehensive profiles, portfolios, and skill tracking.',
      link: ROUTES.TALENTS,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'AI Matchmaking',
      description: 'Advanced AI algorithms match the perfect talent with your project requirements.',
      link: ROUTES.MATCHMAKING,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Get insights into your hiring patterns, success rates, and talent performance.',
      link: ROUTES.ANALYTICS,
      gradient: 'from-green-500 to-emerald-500'
    }
  ];
  
  const stats = [
    { label: 'Talented Professionals', value: talentCount, icon: Users },
    { label: 'Active Clients', value: clientCount, icon: Award },
    { label: 'Successful Projects', value: gigCount, icon: CheckCircle },
    { label: 'Match Success Rate', value: '94%', icon: TrendingUp }
  ];
  
  const testimonials = [
    {
      name: 'Sarah Johnson',
      company: 'Creative Studios Inc.',
      text: 'MatchMuse helped us find the perfect photographer for our brand campaign. The AI matching was spot-on!',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      name: 'Michael Chen',
      company: 'Tech Innovations',
      text: 'The talent quality and matching accuracy exceeded our expectations. Saved us weeks of searching.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      name: 'Emily Rodriguez',
      company: 'Design House',
      text: 'Incredible platform! Found amazing animators and directors for our video projects.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    }
  ];
  
  const categories = [
    { name: 'Photography', count: 45, icon: '📸' },
    { name: 'Animation', count: 32, icon: '🎬' },
    { name: 'UI/UX Design', count: 38, icon: '🎨' },
    { name: 'Videography', count: 29, icon: '🎥' },
    { name: 'Music Production', count: 18, icon: '🎵' },
    { name: 'Content Writing', count: 25, icon: '✍️' }
  ];

  const platformBenefits = [
    {
      icon: Brain,
      title: 'AI-Powered Matching',
      description: 'Our advanced AI analyzes skills, experience, location, and style to find perfect matches.',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Clock,
      title: 'Save Time & Money',
      description: 'Find the right talent in minutes, not weeks. Reduce hiring costs by up to 70%.',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: 'All talents are vetted and rated. Get quality assurance with every match.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Access talent worldwide or find local professionals. Work remotely or in-person.',
      color: 'from-blue-500 to-cyan-500'
    }
  ];
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="mb-8 flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Logo size="lg" />
              </motion.div>
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 text-shadow-lg"
            >
              Connect Creative Talent
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                With Perfect Projects
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl lg:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              MatchMuse is the world's most advanced AI-powered talent matchmaking platform. 
              We connect creative clients with exceptional professionals using intelligent algorithms 
              that analyze skills, experience, location, and project compatibility.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link to={ROUTES.MATCHMAKING}>
                <Button size="lg" glow className="group">
                  <Zap className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                  <span>Find Perfect Matches</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to={ROUTES.TALENTS}>
                <Button variant="glass" size="lg" className="group">
                  <Users className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  Browse Talent Pool
                </Button>
              </Link>
            </motion.div>
            
            {/* Live Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Card className="text-center group hover-lift">
                      <Icon className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:animate-bounce" />
                      <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-white/70">{stat.label}</div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
          
          {/* Floating Talent Cards */}
          <div className="mt-20 relative hidden lg:block">
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-0 left-1/4 transform -translate-x-1/2"
            >
              <Card className="w-64 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    SC
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Sarah Chen</h3>
                    <p className="text-sm text-white/70">Photographer</p>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm ml-1 text-white/80">4.9</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute top-12 right-1/4 transform translate-x-1/2"
            >
              <Card className="w-64 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    AR
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Alex Rodriguez</h3>
                    <p className="text-sm text-white/70">Animator</p>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm ml-1 text-white/80">4.8</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What is MatchMuse Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              What is MatchMuse?
            </h2>
            <p className="text-xl text-white/80 max-w-4xl mx-auto leading-relaxed">
              MatchMuse revolutionizes how creative projects come to life. We're the bridge between 
              visionary clients and exceptional creative talent, powered by cutting-edge AI that 
              understands the nuances of creative collaboration.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                For Creative Clients
              </h3>
              <p className="text-lg text-white/80">
                Whether you're a startup needing a brand identity, a company launching a product, 
                or an agency managing multiple projects - MatchMuse finds you the perfect creative 
                professionals who understand your vision and can bring it to life.
              </p>
              <ul className="space-y-3">
                {[
                  'Post your project requirements in minutes',
                  'Get AI-matched with pre-vetted professionals',
                  'Review portfolios and compatibility scores',
                  'Connect directly with top-rated talent'
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center text-white/90"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 text-center hover-lift">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Perfect Project Matches</h4>
                <p className="text-white/70">
                  Our AI analyzes project requirements, budget, timeline, and creative style 
                  to find talents who are not just skilled, but perfectly aligned with your vision.
                </p>
              </Card>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <Card className="p-8 text-center hover-lift">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Showcase Your Talent</h4>
                <p className="text-white/70">
                  Build a comprehensive profile with your portfolio, skills, and experience. 
                  Get discovered by clients who value your unique creative abilities.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 order-1 lg:order-2"
            >
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                For Creative Professionals
              </h3>
              <p className="text-lg text-white/80">
                Stop competing in crowded marketplaces. MatchMuse connects you with clients 
                who specifically need your skills and appreciate your creative style. 
                Build meaningful professional relationships and grow your career.
              </p>
              <ul className="space-y-3">
                {[
                  'Create a stunning portfolio profile',
                  'Get matched with relevant projects automatically',
                  'Build long-term client relationships',
                  'Focus on creativity, not client hunting'
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center text-white/90"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose MatchMuse?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              We're not just another freelance platform. We're the future of creative collaboration.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="group"
                >
                  <Card className="p-8 text-center h-full hover-lift">
                    <div className={`w-16 h-16 bg-gradient-to-r ${benefit.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-white">{benefit.title}</h3>
                    <p className="text-white/70">{benefit.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Explore Creative Categories
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Discover talented professionals across various creative disciplines
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group cursor-pointer"
              >
                <Card className="p-6 text-center hover-lift">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{category.name}</h3>
                  <p className="text-sm text-white/60">{category.count} talents</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How MatchMuse Works
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Our AI-powered platform simplifies the talent matching process in three easy steps.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Define Your Project',
                description: 'Tell us about your project requirements, budget, timeline, and creative vision. Our smart forms capture every detail.',
                icon: '🎯'
              },
              {
                step: '02',
                title: 'AI Finds Perfect Matches',
                description: 'Our advanced AI analyzes thousands of talent profiles, considering skills, experience, location, and creative compatibility.',
                icon: '🤖'
              },
              {
                step: '03',
                title: 'Connect & Create',
                description: 'Review ranked matches with detailed compatibility scores, connect with your top choices, and start creating amazing work together.',
                icon: '🚀'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <Card className="p-8 h-full hover-lift">
                  <div className="text-6xl mb-6">{item.icon}</div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-white">{item.title}</h3>
                  <p className="text-white/70">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Platform Features
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Everything you need to manage talent and create successful project matches.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="group"
                >
                  <Link to={feature.link}>
                    <Card className="p-8 h-full hover-lift">
                      <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-4 text-white">{feature.title}</h3>
                      <p className="text-white/70 mb-6">{feature.description}</p>
                      <div className="flex items-center text-blue-400 font-medium group-hover:text-purple-400 transition-colors duration-300">
                        <span>Explore Feature</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Join thousands of creative professionals and clients who trust MatchMuse for their projects.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className="p-8 hover-lift">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-white/60">{testimonial.company}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-12 hover-lift" glow>
              <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-6 animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Creative Projects?
              </h2>
              <p className="text-xl text-white/80 mb-8">
                Join the future of creative collaboration. Whether you're looking for talent or seeking opportunities, 
                MatchMuse connects you with the perfect creative partnerships.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={ROUTES.MATCHMAKING}>
                  <Button
                    size="lg"
                    glow
                    className="group"
                  >
                    <Zap className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    Start Matching Now
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to={ROUTES.TALENTS}>
                  <Button
                    variant="glass"
                    size="lg"
                    className="group"
                  >
                    <Users className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    Explore Talent Pool
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};