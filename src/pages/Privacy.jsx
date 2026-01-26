import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Shield, Ghost, Eye, EyeOff, Globe, Monitor, MapPin, 
  Lock, Database, FileText, ExternalLink, CheckCircle, 
  XCircle, ArrowLeft, Info
} from 'lucide-react'
import { useApp } from '../App'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function Privacy() {
  const { ghostMode, setGhostMode } = useApp()

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-4xl mx-auto"
    >
      {/* Back Link */}
      <motion.div variants={itemVariants} className="mb-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-3">
          Privacy & Analytics
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          OffGrid is built with privacy as a core principle. Here's exactly what we track, 
          what we don't, and how you can go completely invisible with Ghost Mode.
        </p>
      </motion.div>

      {/* Ghost Mode Status Card */}
      <motion.div 
        variants={itemVariants}
        className={`glass-card rounded-2xl p-6 mb-8 border-2 transition-colors ${
          ghostMode 
            ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
            : 'border-[var(--border-color)]'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              ghostMode ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
            }`}>
              <Ghost className={`w-6 h-6 ${ghostMode ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Ghost Mode is {ghostMode ? 'Active' : 'Inactive'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {ghostMode 
                  ? 'Analytics are completely disabled. You\'re invisible.' 
                  : 'Basic analytics are active. Enable Ghost Mode for full privacy.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setGhostMode(!ghostMode)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              ghostMode
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                : 'bg-[var(--accent)] text-white hover:opacity-90'
            }`}
          >
            {ghostMode ? 'Disable Ghost Mode' : 'Enable Ghost Mode'}
          </button>
        </div>
        <p className="mt-4 text-xs text-[var(--text-tertiary)] flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] font-mono">G</kbd> anywhere in the app to toggle Ghost Mode
        </p>
      </motion.div>

      {/* What We Track */}
      <motion.section variants={itemVariants} className="mb-8">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              What We Track
            </h2>
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-500">
              When Ghost Mode is OFF
            </span>
          </div>
          
          <p className="text-[var(--text-secondary)] mb-4">
            We use Cloudflare Web Analytics — a privacy-focused, cookie-free analytics solution. 
            Here's exactly what is collected:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
              <Globe className="w-5 h-5 text-blue-500 mb-2" />
              <h3 className="font-medium text-[var(--text-primary)] mb-1">Page Views</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Which pages are visited and how often. No user identification.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
              <MapPin className="w-5 h-5 text-green-500 mb-2" />
              <h3 className="font-medium text-[var(--text-primary)] mb-1">Country</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                General geographic region based on IP (not stored). No city-level tracking.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
              <Monitor className="w-5 h-5 text-purple-500 mb-2" />
              <h3 className="font-medium text-[var(--text-primary)] mb-1">Device Type</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Desktop, mobile, or tablet. Browser type. No fingerprinting.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* What We Never Track */}
      <motion.section variants={itemVariants} className="mb-8">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              What We Never Track
            </h2>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-500">
              Always Protected
            </span>
          </div>
          
          <p className="text-[var(--text-secondary)] mb-4">
            Your data stays in your browser. These things are never collected, period:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Lock, text: 'Passwords or credentials you enter', desc: 'Vault data is encrypted locally' },
              { icon: FileText, text: 'Content you process', desc: 'JWTs, JSON, logs, hashes — all local' },
              { icon: Database, text: 'Personal information', desc: 'No names, emails, or identifiers' },
              { icon: Globe, text: 'Browsing history', desc: 'No cross-site tracking or cookies' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-[var(--text-primary)]">{item.text}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How Ghost Mode Works */}
      <motion.section variants={itemVariants} className="mb-8">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
              <Ghost className="w-5 h-5 accent-text" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              How Ghost Mode Works
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Toggle Ghost Mode</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Press <kbd className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)] font-mono text-xs">G</kbd> on 
                  your keyboard, use the toggle in the sidebar, or click the button above.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Analytics Script Removed</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  The Cloudflare analytics script is immediately removed from the page. 
                  Your preference is saved in localStorage and checked on every page load.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Complete Privacy</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  With Ghost Mode enabled, absolutely nothing is tracked. The analytics script 
                  never loads, even on page refresh. You're completely invisible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Cloudflare Info */}
      <motion.section variants={itemVariants} className="mb-8">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              About Cloudflare Web Analytics
            </h2>
          </div>
          
          <p className="text-[var(--text-secondary)] mb-4">
            We chose Cloudflare Web Analytics specifically because it's privacy-focused:
          </p>

          <ul className="space-y-2 mb-4">
            {[
              'No cookies used — ever',
              'No cross-site or cross-device tracking',
              'No personal data collection',
              'IP addresses are not stored',
              'GDPR and CCPA compliant by design',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <a
            href="https://www.cloudflare.com/web-analytics/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Learn more about Cloudflare Web Analytics
          </a>
          
          <div className="mt-3">
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--accent)]"
            >
              <ExternalLink className="w-4 h-4" />
              Cloudflare Privacy Policy
            </a>
          </div>
        </div>
      </motion.section>

      {/* Summary */}
      <motion.section variants={itemVariants}>
        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 border border-[var(--accent)]/20">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Your Privacy, Your Choice
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            All tools work 100% offline and locally. Analytics help us understand which tools 
            are most useful, but you can opt out completely with Ghost Mode. No judgement, no downsides.
          </p>
        </div>
      </motion.section>
    </motion.div>
  )
}
