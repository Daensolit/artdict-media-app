import React, { useMemo } from 'react';
import { Trophy, Award, Flame, DollarSign, Briefcase, Film, Crown, Medal } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, getAvatarColor, getInitials } from '../utils/helpers';

export default function Scoreboard() {
  const { teamMembers, projects } = useStore();

  // 1. Người kiếm / quản lý nhiều job nhất (Job Hunter / Lead)
  const topJobHunters = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      const leaderId = p.managerId || p.salesPersonId;
      if (leaderId) {
        counts[leaderId] = (counts[leaderId] || 0) + 1;
      }
    });

    return teamMembers
      .map((member) => ({
        member,
        jobCount: counts[member.id] || 0,
      }))
      .filter((item) => item.jobCount > 0)
      .sort((a, b) => b.jobCount - a.jobCount);
  }, [teamMembers, projects]);

  // 2. Người mang lại doanh thu nhiều nhất (Revenue King)
  const topRevenueGenerators = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    projects.forEach((p) => {
      const leaderId = p.managerId || p.salesPersonId;
      if (leaderId) {
        revenueMap[leaderId] = (revenueMap[leaderId] || 0) + (p.budget || 0);
      }
    });

    return teamMembers
      .map((member) => ({
        member,
        totalRevenue: revenueMap[member.id] || 0,
      }))
      .filter((item) => item.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [teamMembers, projects]);

  // 3. Người có mặt trong nhiều dự án nhất (Most Active Crew Member)
  const topActiveCrew = useMemo(() => {
    const activeMap: Record<string, number> = {};
    projects.forEach((p) => {
      p.teamMemberIds?.forEach((mId) => {
        activeMap[mId] = (activeMap[mId] || 0) + 1;
      });
    });

    return teamMembers
      .map((member) => ({
        member,
        projectCount: activeMap[member.id] || 0,
      }))
      .filter((item) => item.projectCount > 0)
      .sort((a, b) => b.projectCount - a.projectCount);
  }, [teamMembers, projects]);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-bold shadow-md text-sm">
          🥇
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-bold shadow-md text-sm">
          🥈
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/80 text-amber-100 font-bold shadow-md text-sm">
          🥉
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-500 font-semibold text-xs">
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gradient-to-r from-amber-500/10 via-primary-500/10 to-purple-500/10 border border-amber-500/20 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Bảng Vinh Danh Artdict Media
              <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold">
                SCOREBOARD
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Thành tích xuất sắc của các thành viên trong team theo từng dự án thực tế
            </p>
          </div>
        </div>
      </div>

      {/* 3 Leaderboard Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Leaderboard 1: Top Săn Job */}
        <div className="card p-5 relative overflow-hidden border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Chiến Thần Săn Job</h3>
                <p className="text-xs text-gray-400">Quản lý / Mang về nhiều job nhất</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {topJobHunters.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu quản lý job</p>
            ) : (
              topJobHunters.slice(0, 5).map((item, idx) => (
                <div
                  key={item.member.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    idx === 0
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 shadow-sm'
                      : 'bg-gray-50/50 dark:bg-dark-800/40 border-gray-100 dark:border-dark-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getRankBadge(idx)}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${getAvatarColor(
                        item.member.name
                      )}`}
                    >
                      {getInitials(item.member.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {item.member.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{item.member.role}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {item.jobCount}
                    </span>
                    <span className="text-xs text-gray-500 block">dự án</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Leaderboard 2: Top Doanh Thu */}
        <div className="card p-5 relative overflow-hidden border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Vua Doanh Thu</h3>
                <p className="text-xs text-gray-400">Tổng ngân sách job phụ trách</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {topRevenueGenerators.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu doanh thu</p>
            ) : (
              topRevenueGenerators.slice(0, 5).map((item, idx) => (
                <div
                  key={item.member.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    idx === 0
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 shadow-sm'
                      : 'bg-gray-50/50 dark:bg-dark-800/40 border-gray-100 dark:border-dark-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getRankBadge(idx)}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${getAvatarColor(
                        item.member.name
                      )}`}
                    >
                      {getInitials(item.member.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {item.member.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{item.member.role}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                      {formatCurrency(item.totalRevenue)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Leaderboard 3: Top On-Set / Crew Member */}
        <div className="card p-5 relative overflow-hidden border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Chiến Binh On-Set</h3>
                <p className="text-xs text-gray-400">Góp mặt trong nhiều dự án nhất</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {topActiveCrew.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu thành viên</p>
            ) : (
              topActiveCrew.slice(0, 5).map((item, idx) => (
                <div
                  key={item.member.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    idx === 0
                      ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 shadow-sm'
                      : 'bg-gray-50/50 dark:bg-dark-800/40 border-gray-100 dark:border-dark-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getRankBadge(idx)}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${getAvatarColor(
                        item.member.name
                      )}`}
                    >
                      {getInitials(item.member.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {item.member.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{item.member.role}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {item.projectCount}
                    </span>
                    <span className="text-xs text-gray-500 block">job tham gia</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
