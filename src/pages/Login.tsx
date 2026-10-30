import React, { useState } from 'react';
import { Lock, User as UserIcon, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import AmbientGlow from '../components/AmbientGlow';

export default function Login() {
  const { login } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        setError(res.message || 'Đăng nhập không thành công');
      }
      setLoading(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#070709] relative flex items-center justify-center p-4 overflow-hidden">
      {/* visionOS Spatial Ambient Mesh Glow */}
      <AmbientGlow />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Card Header */}
        <div className="text-center mb-8">
          <div className="inline-block relative mb-4 group cursor-pointer">
            <img
              src="/artdict-logo.jpg"
              alt="Artdict Media Logo"
              className="w-24 h-24 rounded-3xl object-cover mx-auto shadow-2xl ring-1 ring-white/30 dark:ring-white/20 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-3xl bg-orange-500/25 blur-xl -z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest leading-none">ARTDICT MEDIA</h1>
          <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mt-1.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pro Studio Production Suite</span>
          </p>
        </div>

        {/* Login Liquid Glass Box */}
        <div className="bg-[#0e101a]/65 backdrop-blur-3xl border border-white/[0.1] border-t-white/[0.22] rounded-3xl p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_30px_rgba(249,115,22,0.08)]">
          <h2 className="text-base font-bold text-zinc-100 mb-6 flex items-center justify-between">
            <span>Đăng nhập hệ thống</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 font-mono border border-white/[0.08]">
              v2.5 Pro
            </span>
          </h2>

          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#07080f]/75 border border-white/[0.08] border-t-white/[0.16] rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/80 transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#07080f]/75 border border-white/[0.08] border-t-white/[0.16] rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/80 transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 py-3 text-sm flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào Artdict'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-500 mt-6 font-mono">
          Artdict Media • visionOS & Pro Studio Architecture
        </p>
      </div>
    </div>
  );
}
