import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Key, Braces, Code2, Hash, Fingerprint, Shield, 
  Lock, Eye, Server, Zap, ShieldCheck, ArrowRight,
  CheckCircle, Globe, Cpu, Sparkles, WifiOff
} from 'lucide-react'

const tools = [
  {
    path: '/jwt',
    name: 'JWT Decoder',
    description: 'Decode and verify JSON Web Tokens safely',
    icon: Key,
    color: 'from-cyan-500 to-blue-500',
    features: ['Header & Payload decode', 'Signature verification', 'Expiry status']
  },
  {
    path: '/json',
    name: 'JSON Formatter',
    description: 'Format, validate, query and compare JSON',
    icon: Braces,
    color: 'from-purple-500 to-pink-500',
    features: ['Pretty print', 'Tree view', 'JQ-like queries', 'Diff compare']
  },
  {
    path: '/encode',
    name: 'Encode/Decode',
    description: 'Base64, URL, HTML entities and more',
    icon: Code2,
    color: 'from-orange-500 to-red-500',
    features: ['Base64 encoding', 'URL encoding', 'HTML entities', 'Hex & Binary']
  },
  {
    path: '/hash',
    name: 'Hash Generator',
    description: 'Generate cryptographic hashes locally',
    icon: Hash,
    color: 'from-emerald-500 to-teal-500',
    features: ['MD5, SHA-1, SHA-256', 'SHA-384, SHA-512', 'File hashing', 'Hash comparison']
  },
  {
    path: '/uuid',
    name: 'UUID Generator',
    description: 'Generate UUIDs v4 and v7 with batch mode',
    icon: Fingerprint,
    color: 'from-indigo-500 to-purple-500',
    features: ['UUID v4 (random)', 'UUID v7 (timestamp)', 'Batch generation', 'Multiple formats']
  }
]

const features = [
  {
    icon: Lock,
    title: 'Zero Transmission',
    description: 'All processing happens in your browser. No data ever reaches our servers.',
    color: 'text-cyan-500'
  },
  {
    icon: Eye,
    title: 'No Tracking',
    description: 'No analytics, no cookies, no fingerprinting. Your privacy is absolute.',
    color: 'text-purple-500'
  },
  {
    icon: Server,
    title: 'Works Offline',
    description: 'Install as a PWA and use all tools without any internet connection.',
    color: 'text-orange-500'
  },
  {
    icon: Cpu,
    title: 'Open Source',
    description: 'Fully open source. Verify the code yourself or self-host on your infrastructure.',
    color: 'text-emerald-500'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function Landing() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-6xl mx-auto"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="text-center py-12 lg:py-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 glass-card"
        >
          <Sparkles className="w-4 h-4 accent-text" />
          <span className="text-sm text-[var(--text-secondary)]">Privacy-First Developer Tools</span>
        </motion.div>

        <h1 className="text-4xl lg:text-6xl font-bold mb-6 font-display">
          <span className="text-[var(--text-primary)]">Your Data Stays </span>
          <span className="gradient-text">Off The Grid</span>
        </h1>

        <p className="text-lg lg:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
          A collection of essential developer utilities that process everything locally. 
          No servers, no tracking, no compromises.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Link to="/jwt" className="glass-button-primary">
            <ShieldCheck className="w-4 h-4" />
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a 
            href="https://github.com/aabbhishek/off-grid" 
            target="_blank" 
            rel="noopener noreferrer"
            className="glass-button"
          >
            View on GitHub
          </a>
        </div>

        {/* Privacy indicators */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-tertiary)]">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>No data transmitted</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>No analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>100% offline capable</span>
          </div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section variants={itemVariants} className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className="glass-card rounded-2xl p-6 group"
            >
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[var(--bg-tertiary)] group-hover:scale-110 transition-transform`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">{feature.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Tools Grid */}
      <motion.section variants={itemVariants} className="py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-4 font-display">
            Developer Tools
          </h2>
          <p className="text-[var(--text-secondary)]">Everything you need, nothing you don't</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.path}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <Link
                to={tool.path}
                className="glass-card-hover rounded-2xl p-6 h-full flex flex-col group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color} group-hover:scale-110 transition-transform`}
                  >
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{tool.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4 flex-1">{tool.description}</p>

                <div className="flex flex-wrap gap-2">
                  {tool.features.map((feature, i) => (
                    <span 
                      key={i}
                      className="text-[10px] px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section variants={itemVariants} className="py-12">
        <div className="glass-card rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden">
          {/* Background gradient orbs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <Globe className="w-12 h-12 accent-text mx-auto mb-6" />
            <h2 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-4 font-display">
              Ready to Go Off Grid?
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
              Join developers who value their privacy. All tools work instantly 
              in your browser with no signup required.
            </p>
            <Link to="/jwt" className="glass-button-primary inline-flex">
              <Zap className="w-4 h-4" />
              Start Using Tools
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Keyboard shortcuts hint */}
      <motion.section variants={itemVariants} className="py-8 text-center">
        <p className="text-xs text-[var(--text-tertiary)]">
          Pro tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] mx-1">1-5</kbd> 
          to quickly switch tools, <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] mx-1">D</kbd> 
          for Dev Mode, <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] mx-1">T</kbd> 
          for theme
        </p>
      </motion.section>
    </motion.div>
  )
}
