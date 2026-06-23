import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Video, QrCode, BarChart3, ShieldCheck } from 'lucide-react';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "AI Face Recognition",
      description: "Fast, contactless logs utilizing deep learning embeddings and live camera overlays.",
      icon: Video,
      color: "from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20"
    },
    {
      title: "QR Backup Verification",
      description: "Robust scan fallbacks generated for every student to ensure zero record omissions.",
      icon: QrCode,
      color: "from-purple-500/10 to-pink-500/10 text-purple-400 border-purple-500/20"
    },
    {
      title: "Campus Intelligence",
      description: "Performance correlation graphs, GPA scatter charts, and student academic risk logs.",
      icon: BarChart3,
      color: "from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20"
    },
    {
      title: "Role Permission Control",
      description: "Secure, credential-guarded JWT access for Administrators, Teachers, and Students.",
      icon: ShieldCheck,
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20"
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden px-6 lg:px-16 py-12">
      {/* Dynamic Background Blur Accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none animate-pulse-slow"></div>

      {/* Header */}
      <header className="flex items-center justify-between w-full max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
            C
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-gradient">CampusSync</span>
        </div>
        
        <button 
          onClick={() => navigate('/login')}
          className="btn-secondary px-5 py-2.5 text-sm"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-7xl mx-auto my-auto py-16 flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
        {/* Left Col: Tagline & CTA */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider mb-6 light:bg-brand-50 light:border-brand-200 light:text-brand-700">
            ✨ Introducing Version 1.0
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none mb-6">
            One Platform for <br className="hidden md:inline" />
            <span className="text-gradient">Campus Intelligence.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-xl mb-10 light:text-slate-600">
            Integrate contactless face attendance, secure QR checkpoints, and automated performance correlation metrics into a single premium environment.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary px-8 py-4 text-base font-semibold"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => navigate('/login')}
              className="btn-secondary px-8 py-4 text-base font-semibold"
            >
              Explore Sandbox
            </button>
          </div>
        </div>

        {/* Right Col: Features grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div 
                key={i}
                className="glass-card p-6 flex flex-col justify-between h-48 animate-float"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center bg-gradient-to-br ${feature.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-bold tracking-tight">{feature.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed light:text-slate-600">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto border-t border-slate-900/60 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4 relative z-10 light:border-slate-200">
        <span>© 2026 CampusSync Technologies Inc. All rights reserved.</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white">API Documentation</a>
          <a href="#" className="hover:text-white">Security Auditing</a>
          <a href="#" className="hover:text-white">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};
