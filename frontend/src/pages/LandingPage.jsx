import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Search, 
  MapPin, 
  MessageSquare, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  Users, 
  Home as HomeIcon, 
  IndianRupee,
  Star
} from "lucide-react";
import api from "../services/api.js";

// 1. Fetcher function for React Query
const fetchBackendHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

// 2. Framer Motion Animation Constants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const LandingPage = () => {
  const navigate = useNavigate();
  // 3. React Query status request
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["health"],
    queryFn: fetchBackendHealth,
    staleTime: 30000, // Cache clean for 30s
  });

  // 4. Notify users manually upon network checks
  const handleConnectionCheck = () => {
    toast.promise(
      refetch(),
      {
        loading: "Pinging RentEase API...",
        success: (res) => `Successfully connected! Server uptime: ${res?.data?.details?.uptimeSeconds}s`,
        error: (err) => `Connection failed: ${err.message || "Server Offline"}`
      },
      {
        style: {
          minWidth: "250px"
        }
      }
    );
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 overflow-x-hidden relative">
      {/* ========================================================
          HERO SECTION: High-impact introduction
      ======================================================== */}
      <section className="relative px-6 pt-24 pb-20 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* API Connection Indicator Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button 
            onClick={handleConnectionCheck}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border text-xs font-semibold tracking-wide transition-all duration-300 active:scale-95 ${
              isLoading 
                ? "text-yellow-600 bg-yellow-50 border-yellow-200" 
                : error 
                  ? "text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100/50" 
                  : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/50"
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${isLoading ? "animate-pulse" : ""}`} />
            <span>
              {isLoading 
                ? "Connecting to API..." 
                : error 
                  ? "API Offline (Click to Retry)" 
                  : `API Connected (v1.0)`}
            </span>
          </button>
        </motion.div>

        {/* Catchy headline */}
        <motion.h1 
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight"
        >
          Discover Your Dream Rental on the{" "}
          <span className="text-brand-600">Premium Portal</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p 
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl font-light"
        >
          RentEase merges secure Stripe checkout, real-time Socket communication, and map exploration in a modern property workspace.
        </motion.p>

        {/* Hero Interactive Filters mockup (Glassmorphism layout) */}
        <motion.div 
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="mt-12 w-full max-w-4xl glass-card rounded-3xl p-6 border border-slate-700 shadow-md"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-start px-4 py-2 border-r border-slate-200 last:border-0 text-left">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Location</span>
              <div className="flex items-center space-x-1.5 mt-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                <input 
                  type="text" 
                  placeholder="Where are you going?" 
                  className="bg-transparent text-sm focus:outline-none w-full text-slate-200 placeholder-slate-500" 
                  readOnly
                  value="Mumbai, MH"
                />
              </div>
            </div>

            <div className="flex flex-col items-start px-4 py-2 border-r border-slate-200 last:border-0 text-left">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Price range</span>
              <div className="flex items-center space-x-1.5 mt-2">
                <IndianRupee className="w-4 h-4 text-brand-600" />
                <span className="text-sm text-slate-200 font-medium">₹25,000 - ₹80,000</span>
              </div>
            </div>

            <div className="flex flex-col items-start px-4 py-2 border-r border-slate-200 last:border-0 text-left">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Property type</span>
              <div className="flex items-center space-x-1.5 mt-2">
                <HomeIcon className="w-4 h-4 text-brand-600" />
                <span className="text-sm text-slate-200 font-medium">Modern Apartment</span>
              </div>
            </div>

            <div className="flex items-center justify-center p-2">
              <button 
                onClick={() => navigate("/explore?city=Mumbai")}
                className="btn-primary w-full py-3 flex items-center justify-center space-x-2 text-sm"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Real-time stats section */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl"
        >
          {[
            { value: "1,200+", label: "Verified Listings", icon: HomeIcon },
            { value: "450k+", label: "Active Renters", icon: Users },
            { value: "99.8%", label: "Secure Payments", icon: ShieldCheck },
            { value: "< 2hr", label: "Average Reply", icon: MessageSquare }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              variants={fadeInUp} 
              className="flex flex-col items-center p-4 glass-card rounded-2xl border border-slate-700 shadow-sm"
            >
              <div className="p-2 bg-brand-50 rounded-xl mb-3">
                <stat.icon className="w-5 h-5 text-brand-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-100">{stat.value}</span>
              <span className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ========================================================
          FEATURES SECTION: Interactive Showcase
      ======================================================== */}
      <section id="features" className="py-24 border-t border-slate-700 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs text-brand-600 font-semibold tracking-widest uppercase">System capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 text-slate-100">Modern Platform Services</h2>
          <p className="text-slate-400 mt-4 font-light text-sm sm:text-base">
            RentEase delivers the standard ecosystem needed to discover properties and handle bookings smoothly.
          </p>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              title: "Map Discovery",
              description: "Explore nearby listings on an interactive OpenStreetMap canvas with custom markers.",
              icon: MapPin,
            },
            {
              title: "Real-time Messaging",
              description: "Chat instantly with landlords. Includes typing states, read receipts, and system alerts.",
              icon: MessageSquare,
            },
            {
              title: "Secure Checkouts",
              description: "Process rent deposits safely with custom Stripe integration, ledger reports, and refunds.",
              icon: CreditCard,
            },
            {
              title: "Trust Enforcement",
              description: "Role-based authorization checks keep platform interactions safe for landlords and tenants.",
              icon: ShieldCheck,
            }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={fadeInUp}
              className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-700 flex flex-col text-left"
            >
              <div className="p-3 bg-brand-50 rounded-2xl w-fit mb-6 border border-brand-100">
                <feature.icon className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ========================================================
          TESTIMONIALS SECTION: Credibility Proofs
      ======================================================== */}
      <section className="py-24 border-t border-slate-700 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs text-brand-600 font-semibold tracking-widest uppercase">Testimonials</span>
          <h2 className="text-3xl font-extrabold mt-3 text-slate-100">Renter & Landlord Feedback</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Sarah Jenkins",
              role: "Tenant in San Francisco",
              content: "Renting via RentEase was unbelievably smooth. The real-time messaging made negotiating terms with my landlord straightforward and clear.",
              rating: 5
            },
            {
              name: "Marcus Aurelius",
              role: "Landlord (12 Properties)",
              content: "The calendar management and Stripe dashboard integration eliminated booking overlaps and deposit hassles. Fully recommended for listing operations.",
              rating: 5
            },
            {
              name: "David K.",
              role: "Software Developer",
              content: "Decoupled architecture and responsive design elements feel extremely premium. The animation layouts are top-notch.",
              rating: 5
            }
          ].map((test, index) => (
            <div key={index} className="glass-card rounded-3xl p-6 border border-slate-700 text-left flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex space-x-1">
                  {Array.from({ length: test.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 italic font-light leading-relaxed">"{test.content}"</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700">
                <h4 className="font-bold text-sm text-slate-100">{test.name}</h4>
                <span className="text-xs text-slate-400">{test.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          CALL TO ACTION (CTA) SECTION
      ======================================================== */}
      <section className="py-20 px-6 max-w-5xl mx-auto relative z-10">
        <div className="bg-brand-900 text-white rounded-3xl p-12 border border-brand-950 relative overflow-hidden text-center shadow-lg">
          <h2 className="text-3xl sm:text-4xl font-extrabold max-w-2xl mx-auto leading-tight text-white">
            Ready to Find Your Next Space?
          </h2>
          <p className="text-brand-100 mt-4 max-w-lg mx-auto text-sm sm:text-base font-light">
            Register your account today. List properties as a Landlord or explore rental bookings as a Tenant.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => navigate("/auth/register")}
              className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-brand-900 hover:bg-brand-50 hover:text-brand-950 border border-transparent shadow-md"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 text-brand-900" />
            </button>
            <a 
              href="#features" 
              className="btn-secondary w-full sm:w-auto bg-transparent border-brand-300 text-white hover:bg-brand-800 hover:border-brand-200"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
