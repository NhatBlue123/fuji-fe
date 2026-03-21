"use client";

import React, { useState, useEffect } from 'react';
import { 
  Moon, Sun, ChevronDown, UserPlus, BookOpen, 
  ArrowRight, TrendingUp, Zap, Bell, Search
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useTheme } from 'next-themes';

// Dữ liệu mẫu
const revenueData = [
  { name: 'Jan', value: 120 }, { name: 'Feb', value: 190 },
  { name: 'Mar', value: 150 }, { name: 'Apr', value: 250 },
  { name: 'May', value: 220 }, { name: 'Jun', value: 310 },
];

const growthData = [
  { name: 'Học viên mới', value: 65 },
  { name: 'Khóa học', value: 35 },
];

const AdminDashboard = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Đợi component mounted để tránh lỗi hydration mismatch của Next.js
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const COLORS = theme === 'dark' ? ['#22d3ee', '#fb7185'] : ['#0891b2', '#e11d48'];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      
      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0">
        
        
        {/* BEGIN: Content Area */}
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          
          {/* Section 1: Stats Grid */}
          <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Welcome Card */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Tổng quan hệ thống</h3>
                    <button className="text-pink-500 bg-pink-50 dark:bg-pink-500/10 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      Chi tiết <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-10">
                    <div className="p-5 bg-cyan-50/50 dark:bg-cyan-500/5 rounded-3xl border border-cyan-100 dark:border-cyan-500/20">
                      <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Doanh thu</p>
                      <p className="text-2xl font-black text-slate-800 dark:text-white">15.4M</p>
                    </div>
                    <div className="p-5 bg-pink-50/50 dark:bg-pink-500/5 rounded-3xl border border-pink-100 dark:border-pink-500/20">
                      <p className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">Học viên</p>
                      <p className="text-2xl font-black text-slate-800 dark:text-white">1,240</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats List */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-widest mb-6">Tăng trưởng nhanh</h3>
                <div className="space-y-4">
                   <GrowthItem icon={<UserPlus size={18}/>} color="cyan" label="Học viên" percent="+65%" />
                   <GrowthItem icon={<BookOpen size={18}/>} color="pink" label="Khóa học" percent="+35%" />
                </div>
              </div>
            </div>

            {/* Target Donut Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col items-center">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={growthData} innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                        {growthData.map((_, i) => <Cell key={i} fill={COLORS[i % 2]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm font-black text-slate-800 dark:text-white">Mục tiêu quý 1</p>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">Đã đạt 82%</p>
                </div>
            </div>
          </section>

          {/* Section 2: Main Revenue Chart */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Phân tích doanh thu</h3>
              <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold px-4 py-2 dark:text-white">
                <option>6 Tháng qua</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', borderRadius: '16px', border: 'none'}} />
                  <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={4} fill="url(#colorCyan)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Section 3: Recent Activity Table */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Giao dịch mới</h3>
              <button className="text-xs font-black text-cyan-500 uppercase tracking-widest hover:underline">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="px-6 py-3">Khách hàng</th>
                    <th className="px-6 py-3">Khóa học</th>
                    <th className="px-6 py-3 text-right">Số tiền</th>
                    <th className="px-6 py-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  <TableRow name="Nguyễn Văn A" status="Success" price="2.5M" />
                  <TableRow name="Trần Thị B" status="Pending" price="1.2M" />
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
          © 2026 Nihon Management System
        </footer>
      </main>
    </div>
  );
};

/* --- Helper Components --- */

const GrowthItem = ({ icon, color, label, percent }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-cyan-500/30 transition-all group">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'cyan' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400' : 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400'}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Đăng ký mới</p>
      </div>
    </div>
    <span className={`text-sm font-black ${color === 'cyan' ? 'text-cyan-500' : 'text-pink-500'}`}>{percent}</span>
  </div>
);

const TableRow = ({ name, status, price }: any) => (
  <tr className="bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group shadow-sm">
    <td className="px-6 py-4 rounded-l-2xl border-y border-l border-slate-50 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`} alt="" />
        </div>
        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{name}</span>
      </div>
    </td>
    <td className="px-6 py-4 border-y border-slate-50 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">Khóa JLPT N1</td>
    <td className="px-6 py-4 border-y border-slate-50 dark:border-slate-800 text-sm font-black text-right text-slate-700 dark:text-slate-200">{price}</td>
    <td className="px-6 py-4 rounded-r-2xl border-y border-r border-slate-50 dark:border-slate-800 text-center">
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status === 'Success' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400' : 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400'}`}>
        {status === 'Success' ? 'Xong' : 'Chờ'}
      </span>
    </td>
  </tr>
);

export default AdminDashboard;