import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Users, 
  Clock, 
  BarChart3, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import heroBackground from '../../assets/hero-bg.png';
import pcIcon from '../../assets/pc-icon.png';
import dashboardGraphic from '../../assets/dashboard-graphic.png';
import queueIcon from '../../assets/queue-icon.png';
import adminIcon from '../../assets/admin-icon.png';

function HomePage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const controls = useAnimation();
  const [stats, setStats] = useState({
    totalPCs: 0,
    availablePCs: 0,
    activeUsers: 0,
    queueLength: 0
  });

  useEffect(() => {
    // Update stats from global state
    setStats({
      totalPCs: state.pcs.length,
      availablePCs: state.pcs.filter(pc => pc.status === 'available').length,
      activeUsers: state.pcs.filter(pc => pc.status === 'in-use').length,
      queueLength: state.queue.length
    });
  }, [state.pcs, state.queue]);

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    });
  }, [controls]);

  const features = [
    {
      icon: Monitor,
      title: "Real-Time PC Monitoring",
      description: "Monitor all computers in your lab with live status updates, usage tracking, and instant notifications.",
      color: "text-blue-500"
    },
    {
      icon: Users,
      title: "Student Management",
      description: "Comprehensive student registration, profile management, and usage history tracking system.",
      color: "text-green-500"
    },
    {
      icon: Clock,
      title: "Smart Queue System",
      description: "FIFO auto-queue with 5-minute sign-in timeout ensures fair access and optimal lab utilization.",
      color: "text-orange-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Detailed usage reports, peak time analysis, and insights to optimize your computer lab operations.",
      color: "text-purple-500"
    }
  ];

  const benefits = [
    "Reduce wait times with intelligent queue management",
    "Increase lab efficiency by up to 40%",
    "Real-time monitoring prevents system issues",
    "Automated reporting saves administrative time",
    "Mobile-friendly interface for on-the-go management",
    "Secure user authentication and data protection"
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 container-responsive text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={controls}
            className="space-y-8"
          >
            <motion.h1 
              className="text-6xl md:text-8xl font-black text-white mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <span className="gradient-text">PC Monitor</span>
              <br />
              <span className="text-white">Pro</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto font-medium"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              The ultimate computer lab management system with real-time monitoring, 
              intelligent queue management, and powerful analytics.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button
                size="lg"
                onClick={() => navigate('/admin')}
                className="btn-energy bg-primary hover:bg-primary/90 text-lg px-8 py-4 glow-blue"
              >
                <Shield className="mr-2 h-5 w-5" />
                Admin Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/student')}
                className="btn-energy border-white text-white hover:bg-white hover:text-black text-lg px-8 py-4"
              >
                <Users className="mr-2 h-5 w-5" />
                Student Portal
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Floating Stats */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="flex flex-wrap justify-center gap-6 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.totalPCs}</div>
              <div className="text-sm opacity-80">Total PCs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{stats.availablePCs}</div>
              <div className="text-sm opacity-80">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{stats.activeUsers}</div>
              <div className="text-sm opacity-80">In Use</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{stats.queueLength}</div>
              <div className="text-sm opacity-80">In Queue</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your computer lab efficiently and effectively
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-card p-6 rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                <span className="gradient-text">Advanced Dashboard</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Get real-time insights with our comprehensive monitoring dashboard. 
                Track usage patterns, monitor system health, and optimize lab operations.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src={dashboardGraphic} 
                alt="Dashboard Preview" 
                className="w-full rounded-xl shadow-2xl"
              />
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary rounded-full flex items-center justify-center pulse-blue">
                <TrendingUp className="h-12 w-12 text-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-destructive">
        <div className="container-responsive text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Ready to Transform Your Lab?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join thousands of institutions already using PC Monitor Pro to streamline 
              their computer lab operations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/admin')}
                className="btn-energy text-lg px-8 py-4 bg-white text-black hover:bg-gray-100"
              >
                <Zap className="mr-2 h-5 w-5" />
                Get Started Now
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/student')}
                className="btn-energy border-white text-white hover:bg-white hover:text-black text-lg px-8 py-4"
              >
                Try Student Portal
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;

