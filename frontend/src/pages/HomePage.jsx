/**
 * HomePage.jsx — KrishiLink Landing Page
 *
 * Sections:
 *  1. Hero          — two-column: left copy + right login card
 *  2. Stats Banner
 *  3. Features
 *  4. How It Works
 *  5. Benefits
 *  6. Testimonials
 *  7. Contact
 *  8. CTA
 *
 * All login/register buttons connect to real auth routes.
 * No dummy backend calls.
 */

import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Sprout, Truck, Zap, MapPin, ShieldCheck, BarChart3,
  ArrowRight, Star, CheckCircle2, ChevronRight,
  Users, IndianRupee, Package, Clock,
  Mail, Phone, MessageSquare, Send,
  Leaf, TrendingUp, Globe,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { usePageTitle } from '@/hooks';
import { cn } from '@/utils';
import Button from '@/components/ui/Button';

/* ── Animation helpers ──────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial:     { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0  },
  viewport:    { once: true, margin: '-60px' },
  transition:  { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const fadeIn = (delay = 0) => ({
  initial:     { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport:    { once: true },
  transition:  { duration: 0.5, delay },
});

const stagger = {
  initial:     {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport:    { once: true },
};

const staggerChild = {
  initial:    { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0  },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

/* ── Data ───────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon:  <Zap size={24} />,
    title: 'AI-Powered Matching',
    desc:  'Intelligent algorithm matches produce with the right transporter by vehicle type, route, and capacity in seconds.',
    color: 'text-amber-500',
    bg:    'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    icon:  <MapPin size={24} />,
    title: 'Live GPS Tracking',
    desc:  'Real-time location updates every 30 seconds so farmers and buyers always know exactly where the produce is.',
    color: 'text-blue-500',
    bg:    'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon:  <ShieldCheck size={24} />,
    title: 'Verified Drivers',
    desc:  'Every driver is background-checked, licensed and rated. Your produce is in safe, trustworthy hands.',
    color: 'text-primary-600',
    bg:    'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    icon:  <BarChart3 size={24} />,
    title: 'Smart Analytics',
    desc:  'Detailed dashboards with delivery stats, cost trends and performance insights for every stakeholder.',
    color: 'text-purple-500',
    bg:    'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon:  <Truck size={24} />,
    title: 'Return-Trip Marketplace',
    desc:  'Drivers list available return trips at discounted rates — great savings for farmers, more income for drivers.',
    color: 'text-earth-600',
    bg:    'bg-earth-50 dark:bg-earth-900/20',
  },
  {
    icon:  <Leaf size={24} />,
    title: 'Multi-Produce Support',
    desc:  'Vegetables, fruits, grains, dairy and more — handled with the specific care each produce type requires.',
    color: 'text-emerald-600',
    bg:    'bg-emerald-50 dark:bg-emerald-900/20',
  },
];

const HOW_IT_WORKS = [
  {
    step:  '01',
    title: 'Post Your Requirement',
    desc:  'Enter pickup location, produce type, weight and preferred schedule in under 2 minutes.',
    icon:  <Package size={22} className="text-white" />,
  },
  {
    step:  '02',
    title: 'Get Matched Instantly',
    desc:  'Our AI finds the best available transporter and sends you a verified quote within seconds.',
    icon:  <Zap size={22} className="text-white" />,
  },
  {
    step:  '03',
    title: 'Confirm & Track Live',
    desc:  'Accept the booking and track your produce in real time from field to market.',
    icon:  <MapPin size={22} className="text-white" />,
  },
];

const BENEFITS = [
  { icon: <TrendingUp size={20} />, title: 'Reduce Wastage by 40%',  desc: 'Fast, reliable transport means less spoilage and more money in your pocket.',   color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  { icon: <Clock size={20} />,       title: 'Transport in 60 Minutes', desc: 'Average booking-to-pickup time is under 60 minutes in covered regions.',       color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20'    },
  { icon: <IndianRupee size={20} />, title: 'Save Up to 30% on Costs', desc: 'Shared-load and return-trip options cut transport costs significantly.',        color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20'  },
  { icon: <Globe size={20} />,       title: 'Pan-India Coverage',      desc: 'Available across 15 states with 3,200+ verified drivers on the network.',       color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { icon: <ShieldCheck size={20} />, title: '100% Verified Drivers',   desc: 'Background checks, license verification and ongoing rating system for safety.', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { icon: <Users size={20} />,       title: 'Dedicated Support',       desc: '24/7 support team in Hindi, Kannada, Tamil, Telugu and English.',              color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-900/20'    },
];

const TESTIMONIALS = [
  {
    name:   'Ravi Kumar',
    role:   'Tomato Farmer, Nashik',
    avatar: 'RK',
    rating: 5,
    text:   'KrishiLink reduced my wastage by 40%. I always get a truck within an hour of booking. My income has genuinely improved.',
    color:  'bg-primary-600',
  },
  {
    name:   'Sunita Devi',
    role:   'Vegetable Farmer, Pune',
    avatar: 'SD',
    rating: 5,
    text:   'The live tracking is a game changer. My buyers are much more confident now because they can see the delivery in real time.',
    color:  'bg-blue-600',
  },
  {
    name:   'Arjun Singh',
    role:   'Lorry Owner, Delhi NCR',
    avatar: 'AS',
    rating: 5,
    text:   'The return-trip marketplace helped me double my monthly income. I never run empty anymore. Best platform for drivers.',
    color:  'bg-earth-600',
  },
];

const STATS = [
  { value: '10,000+', label: 'Farmers registered',    icon: <Sprout size={18} />        },
  { value: '3,200+',  label: 'Verified drivers',       icon: <Truck size={18} />         },
  { value: '50,000+', label: 'Successful deliveries',  icon: <Package size={18} />       },
  { value: '₹12 Cr+', label: 'Farmer earnings saved',  icon: <IndianRupee size={18} />   },
];

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  usePageTitle('Home');
  const navigate = useNavigate();

  return (
    <div className="flex flex-col overflow-x-hidden">
      <HeroSection navigate={navigate} />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <TestimonialsSection />
      <ContactSection />
      <CtaSection navigate={navigate} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   1. Hero Section
═══════════════════════════════════════════════════════════════ */
function HeroSection({ navigate }) {
  const [loginTab, setLoginTab] = useState('farmer');

  return (
    <section className="relative min-h-[92dvh] flex items-center gradient-hero overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-white/[0.03] pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-primary-400/[0.06] blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Copy ──────────────────────────────────── */}
          <div>
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm
                         border border-white/15 rounded-full px-4 py-2 mb-7"
            >
              <span className="h-2 w-2 rounded-full bg-secondary-400 animate-pulse shrink-0" />
              <span className="text-sm text-green-100 font-medium">
                Now live across 15 states in India
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-display font-bold
                         text-white leading-[1.1] mb-6 text-balance"
            >
              Smart Transport<br />
              for{' '}
              <span className="text-secondary-300 relative">
                India&apos;s Farmers
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-400/60
                             origin-left block rounded-full"
                />
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="text-green-100/90 text-lg md:text-xl leading-relaxed mb-10 max-w-xl"
            >
              KrishiLink connects farmers directly with verified lorry owners using
              AI-powered matching, live GPS tracking, and a return-trip marketplace —
              reducing waste and maximising income for everyone.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-12"
            >
              <Link to={ROUTES.FARMER_REGISTER}>
                <Button
                  size="xl"
                  className="bg-white text-primary-700 hover:bg-green-50
                             shadow-xl shadow-black/20 font-semibold"
                  leftIcon={<Sprout size={18} />}
                  rightIcon={<ArrowRight size={18} />}
                >
                  Farmer — Get Started
                </Button>
              </Link>
              <Link to={ROUTES.DRIVER_REGISTER}>
                <Button
                  size="xl"
                  className="bg-white/10 text-white border border-white/25
                             hover:bg-white/20 backdrop-blur-sm font-semibold"
                  leftIcon={<Truck size={18} />}
                >
                  Lorry Owner — Join
                </Button>
              </Link>
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center gap-5"
            >
              {['No credit card required', 'Free to get started', '15 states covered'].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-green-200">
                  <CheckCircle2 size={13} className="text-secondary-400 shrink-0" />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Login Card ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0  }}
            transition={{ duration: 0.65, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto"
          >
            <LoginCard loginTab={loginTab} setLoginTab={setLoginTab} navigate={navigate} />
          </motion.div>

        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg"
          className="w-full text-gray-50 dark:text-gray-950">
          <path d="M0 48L60 42.7C120 37.3 240 26.7 360 24C480 21.3 600 26.7 720 29.3C840 32 960 32 1080 28C1200 24 1320 16 1380 12L1440 8V48H0Z"
            fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}

/* ── Login Card ──────────────────────────────────────────────── */
function LoginCard({ loginTab, setLoginTab, navigate }) {
  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl
                    shadow-2xl shadow-black/30 border border-white/30 overflow-hidden">

      {/* Card header */}
      <div className="px-7 pt-7 pb-5">
        <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-1">
          Sign in to KrishiLink
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose your role to continue
        </p>
      </div>

      {/* Tab switcher */}
      <div className="px-7 pb-5">
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700/60 p-1 gap-1">
          {[
            { key: 'farmer', label: '🌾 Farmer',       route: ROUTES.FARMER_LOGIN   },
            { key: 'driver', label: '🚛 Lorry Owner',  route: ROUTES.DRIVER_LOGIN   },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLoginTab(key)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                loginTab === key
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-7 pb-7">
        <AnimatePresence mode="wait">
          {loginTab === 'farmer' ? (
            <motion.div
              key="farmer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Book verified transporters, track your produce live, and reduce wastage —
                all from one dashboard.
              </p>
              <Button
                fullWidth
                size="lg"
                onClick={() => navigate(ROUTES.FARMER_LOGIN)}
                rightIcon={<ArrowRight size={16} />}
                className="mt-1"
              >
                Sign in as Farmer
              </Button>
              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
              </div>
              <Button
                fullWidth
                size="md"
                variant="outline"
                onClick={() => navigate(ROUTES.FARMER_REGISTER)}
              >
                Create a Farmer account
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="driver"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Accept bookings near you, earn from return trips, and grow your transport
                business with KrishiLink.
              </p>
              <Button
                fullWidth
                size="lg"
                onClick={() => navigate(ROUTES.DRIVER_LOGIN)}
                rightIcon={<ArrowRight size={16} />}
                className="mt-1 bg-earth-600 hover:bg-earth-700 focus-visible:ring-earth-500"
              >
                Sign in as Lorry Owner
              </Button>
              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
              </div>
              <Button
                fullWidth
                size="md"
                variant="outline"
                onClick={() => navigate(ROUTES.DRIVER_REGISTER)}
                className="border-earth-300 text-earth-700 hover:bg-earth-50
                           dark:border-earth-700 dark:text-earth-400"
              >
                Register as Lorry Owner
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin link */}
        <div className="mt-5 text-center">
          <button
            onClick={() => navigate(ROUTES.ADMIN_LOGIN_PAGE)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                       transition-colors inline-flex items-center gap-1"
          >
            Admin portal
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. Stats Banner
═══════════════════════════════════════════════════════════════ */
function StatsSection() {
  return (
    <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {STATS.map(({ value, label, icon }) => (
            <motion.div
              key={label}
              variants={staggerChild}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className="h-11 w-11 rounded-2xl bg-primary-50 dark:bg-primary-900/20
                              flex items-center justify-center text-primary-600
                              dark:text-primary-400">
                {icon}
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-primary-600
                               dark:text-primary-400 leading-none">
                  {value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. Features Section
═══════════════════════════════════════════════════════════════ */
function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div {...fadeUp()} className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest
                           text-primary-600 dark:text-primary-400 mb-3">
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold
                         text-gray-900 dark:text-white mb-4">
            Everything you need to grow
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
            From intelligent matching to live tracking — KrishiLink handles the
            complexity so you can focus on farming.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, desc, color, bg }, i) => (
            <motion.div key={title} {...fadeUp(i * 0.07)}>
              <div className="group h-full bg-white dark:bg-gray-800 rounded-2xl
                              border border-gray-100 dark:border-gray-700
                              shadow-card hover:shadow-card-hover
                              transition-all duration-300 hover:-translate-y-1 p-6">
                <div className={cn(
                  'h-11 w-11 rounded-xl flex items-center justify-center mb-5',
                  bg, color,
                )}>
                  {icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. How It Works Section
═══════════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div {...fadeUp()} className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest
                           text-primary-600 dark:text-primary-400 mb-3">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold
                         text-gray-900 dark:text-white mb-4">
            How KrishiLink works
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Book your first transport in under 3 minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)]
                          right-[calc(16.67%+2rem)] h-0.5
                          bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200
                          dark:from-primary-900 dark:via-primary-600 dark:to-primary-900" />

          {HOW_IT_WORKS.map(({ step, title, desc, icon }, i) => (
            <motion.div key={step} {...fadeUp(i * 0.12)} className="flex flex-col items-center text-center">
              {/* Step circle */}
              <div className="relative mb-6">
                <div className="h-24 w-24 rounded-3xl bg-primary-600 flex items-center
                                justify-center shadow-xl shadow-primary-600/25 relative z-10">
                  <div className="flex flex-col items-center gap-0.5">
                    {icon}
                    <span className="font-display font-bold text-xs text-white/70">
                      {step}
                    </span>
                  </div>
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-3xl bg-primary-400/20
                                blur-xl scale-125 -z-10" />
              </div>

              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. Benefits Section
═══════════════════════════════════════════════════════════════ */
function BenefitsSection() {
  return (
    <section id="about" className="py-24 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <motion.div {...fadeUp()}>
            <span className="inline-block text-xs font-bold uppercase tracking-widest
                             text-primary-600 dark:text-primary-400 mb-3">
              Why KrishiLink
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold
                           text-gray-900 dark:text-white mb-5">
              Built for Indian farmers,<br />
              <span className="text-primary-600">by farmers' needs</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-lg">
              We understood the pain of watching fresh produce spoil waiting for transport.
              KrishiLink was built to solve exactly that — with technology that works in
              the field, not just in theory.
            </p>

            <div className="flex flex-col gap-3">
              {[
                'Available in Hindi, Kannada, Tamil & Telugu',
                'Works on 2G/3G connections',
                'SMS fallback for feature phones',
                'Farmer community support network',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-900/30
                                  flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: benefits grid */}
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {BENEFITS.map(({ icon, title, desc, color, bg }) => (
              <motion.div
                key={title}
                variants={staggerChild}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100
                           dark:border-gray-700 shadow-card p-5
                           hover:shadow-card-hover transition-shadow duration-200"
              >
                <div className={cn(
                  'h-9 w-9 rounded-xl flex items-center justify-center mb-3',
                  bg, color,
                )}>
                  {icon}
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                  {title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. Testimonials Section
═══════════════════════════════════════════════════════════════ */
function TestimonialsSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div {...fadeUp()} className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest
                           text-primary-600 dark:text-primary-400 mb-3">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold
                         text-gray-900 dark:text-white mb-4">
            Trusted by thousands across India
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Real stories from real farmers and drivers on the KrishiLink network.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, avatar, rating, text, color }, i) => (
            <motion.div key={name} {...fadeUp(i * 0.1)}>
              <div className="h-full bg-white dark:bg-gray-800 rounded-2xl
                              border border-gray-100 dark:border-gray-700
                              shadow-card hover:shadow-card-hover
                              transition-all duration-300 hover:-translate-y-1 p-6
                              flex flex-col gap-5">
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: rating }).map((_, j) => (
                    <Star key={j} size={14}
                      className="fill-secondary-400 text-secondary-400 shrink-0" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-gray-600 dark:text-gray-300
                               leading-relaxed flex-1">
                  &ldquo;{text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t
                                border-gray-50 dark:border-gray-700/50">
                  <div className={cn(
                    'h-10 w-10 rounded-2xl flex items-center justify-center',
                    'text-white font-bold text-sm shrink-0', color,
                  )}>
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. Contact Section
═══════════════════════════════════════════════════════════════ */
function ContactSection() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  function handleSubmit(e) {
    e.preventDefault();
    /* No backend — mailto fallback */
    const subject = encodeURIComponent(`KrishiLink inquiry from ${form.name}`);
    const body    = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.open(`mailto:support@krishilink.com?subject=${subject}&body=${body}`);
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  }

  const CONTACT_INFO = [
    { icon: <Mail size={18} />,    label: 'Email',   value: 'support@krishilink.com', href: 'mailto:support@krishilink.com' },
    { icon: <Phone size={18} />,   label: 'Phone',   value: '+91 98765 43210',        href: 'tel:+919876543210'            },
    { icon: <MessageSquare size={18} />, label: 'WhatsApp', value: '+91 98765 43210', href: 'https://wa.me/919876543210'   },
  ];

  return (
    <section id="contact" className="py-24 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div {...fadeUp()} className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest
                           text-primary-600 dark:text-primary-400 mb-3">
            Get In Touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold
                         text-gray-900 dark:text-white mb-4">
            We&apos;re here to help
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Have questions? Our team responds within 2 hours during business hours.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* Contact info */}
          <motion.div {...fadeUp(0.05)} className="flex flex-col gap-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Whether you&apos;re a farmer looking to start booking transport, a lorry owner
              wanting to join our network, or an enterprise seeking bulk solutions —
              our team is ready to assist you.
            </p>

            <div className="flex flex-col gap-4">
              {CONTACT_INFO.map(({ icon, label, value, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white
                             dark:bg-gray-800 border border-gray-100 dark:border-gray-700
                             shadow-card hover:shadow-card-hover hover:border-primary-200
                             dark:hover:border-primary-800 transition-all duration-200 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/20
                                  flex items-center justify-center text-primary-600
                                  dark:text-primary-400 shrink-0
                                  group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40
                                  transition-colors">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Office hours */}
            <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20
                            border border-primary-100 dark:border-primary-800">
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-1">
                Support Hours
              </p>
              <p className="text-sm text-primary-800 dark:text-primary-300">
                Monday – Saturday: 7:00 AM – 10:00 PM IST
              </p>
              <p className="text-sm text-primary-800 dark:text-primary-300">
                Sunday: 9:00 AM – 6:00 PM IST
              </p>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div {...fadeUp(0.12)}>
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100
                         dark:border-gray-700 shadow-card p-7 flex flex-col gap-5"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400
                                    uppercase tracking-wide">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200
                               dark:border-gray-600 bg-white dark:bg-gray-700/50
                               text-gray-900 dark:text-gray-100 text-sm
                               placeholder:text-gray-400
                               focus:outline-none focus:ring-2 focus:ring-primary-500
                               focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400
                                    uppercase tracking-wide">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200
                               dark:border-gray-600 bg-white dark:bg-gray-700/50
                               text-gray-900 dark:text-gray-100 text-sm
                               placeholder:text-gray-400
                               focus:outline-none focus:ring-2 focus:ring-primary-500
                               focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400
                                  uppercase tracking-wide">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="How can we help you?"
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200
                             dark:border-gray-600 bg-white dark:bg-gray-700/50
                             text-gray-900 dark:text-gray-100 text-sm
                             placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-primary-500
                             focus:border-transparent transition-shadow resize-none"
                />
              </div>

              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl
                               bg-primary-50 dark:bg-primary-900/20 border border-primary-200
                               dark:border-primary-800 text-primary-700 dark:text-primary-400
                               text-sm font-medium"
                  >
                    <CheckCircle2 size={16} />
                    Message sent! We&apos;ll reply within 2 hours.
                  </motion.div>
                ) : (
                  <motion.button
                    key="btn"
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2
                               py-3 rounded-xl bg-primary-600 hover:bg-primary-700
                               text-white font-semibold text-sm transition-colors
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    <Send size={15} />
                    Send Message
                  </motion.button>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. CTA Section
═══════════════════════════════════════════════════════════════ */
function CtaSection({ navigate }) {
  return (
    <section className="relative py-28 gradient-hero overflow-hidden">
      {/* Background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-[600px] w-[600px] rounded-full border border-white/5" />
        <div className="absolute h-[400px] w-[400px] rounded-full border border-white/5" />
        <div className="absolute h-[200px] w-[200px] rounded-full border border-white/5" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div {...fadeUp()}>
          <span className="inline-block text-xs font-bold uppercase tracking-widest
                           text-secondary-300 mb-5">
            Get Started Today
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold
                         text-white mb-6 leading-tight text-balance">
            Ready to transform your<br />supply chain?
          </h2>
          <p className="text-green-100/80 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join 10,000+ farmers and 3,200+ drivers who are already saving time,
            reducing waste, and earning more with KrishiLink.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(ROUTES.FARMER_REGISTER)}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4
                         rounded-2xl bg-white text-primary-700 font-bold text-base
                         shadow-xl shadow-black/20 hover:bg-green-50 transition-colors"
            >
              <Sprout size={20} />
              Register as Farmer
              <ArrowRight size={18} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(ROUTES.DRIVER_REGISTER)}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4
                         rounded-2xl bg-white/10 text-white font-bold text-base
                         border border-white/25 hover:bg-white/20
                         backdrop-blur-sm transition-colors"
            >
              <Truck size={20} />
              Join as Lorry Owner
            </motion.button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-green-200">
            {[
              'No credit card required',
              'Free forever plan',
              'Cancel anytime',
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-secondary-400 shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
