"use client";

import React, { useState, useEffect } from 'react';
import { 
  Moon, Sun, ChevronDown, Clock, Users, 
  Wallet, Heart, TrendingUp, TrendingDown, 
  Plus, Zap
} from 'lucide-react';
import { useTheme } from 'next-themes';
// Import Recharts
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

// Dữ liệu mẫu cho biểu đồ
const chartData = [
  { name: 'T2', income: 4000, expense: 2400 },
  { name: 'T3', income: 3000, expense: 1398 },
  { name: 'T4', income: 2000, expense: 9800 },
  { name: 'T5', income: 2780, expense: 3908 },
  { name: 'T6', income: 1890, expense: 4800 },
  { name: 'T7', income: 2390, expense: 3800 },
  { name: 'CN', income: 3490, expense: 4300 },
];

const Dashboard: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Cấu hình màu sắc dựa trên theme
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9'; // slate-800 : slate-100
  const textColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 : slate-500

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans transition-colors duration-500">
      
      {/* --- HEADER GIỮ NGUYÊN --- */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-pink-100 dark:border-slate-800 sticky top-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap size={18} className="text-white fill-current" />
          </div>
          <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-pink-600 dark:from-cyan-400 dark:to-pink-400">
            Xin chào, Nguyen Van A
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-slate-400 hover:text-pink-500 rounded-full transition-all">
            {isDark ? <Sun size={22} className="text-yellow-400" /> : <Moon size={22} />}
          </button>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-pink-100 dark:border-slate-700 px-4 py-1.5 rounded-2xl cursor-pointer hover:shadow-md transition-all group">
            <div className="p-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-pink-400">
                <img alt="Avatar" className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nguyen" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-cyan-600">Nguyen Van A</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* --- STATS SECTION GIỮ NGUYÊN --- */}
        <section>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-pink-50 dark:border-slate-800 flex flex-col md:flex-row gap-8 shadow-xl shadow-pink-500/5 transition-all">
           <div className="relative w-full md:w-[350px] h-[210px] bg-gradient-to-br from-slate-900 via-blue-900 to-pink-600 rounded-[1.5rem] p-6 text-white shadow-2xl shadow-cyan-500/20 overflow-hidden shrink-0 group transition-transform hover:scale-[1.02] duration-300 border border-white/10">
  
  {/* Hiệu ứng ánh kim quét qua thẻ khi hover */}
  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

  {/* Trang trí: Các vòng tròn mờ ảo phía sau */}
  <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-[60px]"></div>
  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/20 rounded-full blur-[60px]"></div>

  <div className="relative z-10 flex flex-col h-full justify-between">
    
    {/* Phần trên: Brand & Chip */}
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <span className="text-[10px] font-black tracking-[0.2em] text-cyan-400 uppercase">SenseiHub Premium</span>
        {/* Chip Ngân hàng */}
        <div className="mt-4 w-11 h-8 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-md relative overflow-hidden shadow-inner">
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-black/20"></div>
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-black/20"></div>
        </div>
      </div>
      
      {/* Biểu tượng Contactless (Sóng không dây) */}
      <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/><path d="M8 6a6 6 0 0 1 6 6" strokeLinecap="round"/><path d="M4 10a2 2 0 0 1 2 2" strokeLinecap="round"/>
      </svg>
    </div>

    {/* Phần giữa: Số thẻ (Phông chữ mono đặc trưng của thẻ tín dụng) */}
    <div className="mt-2">
      <p className="text-xl font-medium tracking-[0.15em] font-mono shadow-sm">
        4521 &nbsp; 8802 &nbsp; 3391 &nbsp; 5678
      </p>
    </div>

    {/* Phần dưới: Tên chủ thẻ & Thông tin phụ */}
    <div className="flex justify-between items-end">
      <div className="space-y-1">
        <p className="text-[10px] uppercase opacity-60 font-bold">Card Holder</p>
        <p className="text-sm font-black tracking-widest uppercase">NGUYEN VAN A</p>
      </div>
      
      <div className="text-right">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end mr-2">
            <p className="text-[8px] uppercase opacity-60 leading-none">Valid Thru</p>
            <p className="text-xs font-bold font-mono">12/29</p>
          </div>
          {/* Logo loại thẻ (Gợi liên tưởng đến Visa/Mastercard bằng 2 vòng tròn) */}
          <div className="flex -space-x-3">
            <div className="w-8 h-8 rounded-full bg-pink-500/80 backdrop-blur-sm border border-white/20"></div>
            <div className="w-8 h-8 rounded-full bg-cyan-400/80 backdrop-blur-sm border border-white/20"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
            <div className="flex-1 grid grid-cols-2 gap-5">
              <StatItem icon={<Clock size={20} className="text-cyan-500" />} bg="bg-cyan-50 dark:bg-cyan-500/10" label="Tổng số giờ dạy" value="128.5 Giờ" borderColor="group-hover:border-cyan-200 dark:group-hover:border-cyan-800" />
              <StatItem icon={<Users size={20} className="text-pink-500" />} bg="bg-pink-50 dark:bg-pink-500/10" label="Học viên" value="24" borderColor="group-hover:border-pink-200 dark:group-hover:border-pink-800" />
              <StatItem icon={<Wallet size={20} className="text-cyan-600 dark:text-cyan-400" />} bg="bg-cyan-100/50 dark:bg-cyan-400/10" label="Số dư" value="15.42M" highlight="text-cyan-600 dark:text-cyan-400" borderColor="group-hover:border-cyan-300 dark:group-hover:border-cyan-700" />
              <StatItem icon={<Heart size={20} className="text-rose-500" />} bg="bg-rose-50 dark:bg-rose-500/10" label="Yêu thích" value="12K" borderColor="group-hover:border-rose-200 dark:group-hover:border-rose-800" />
            </div>
          </div>
        </section>

        {/* --- BIỂU ĐỒ ĐỘNG --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-800 dark:text-slate-200">
          <section className="lg:col-span-2 space-y-4 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Biểu đồ tăng trưởng</h3>
                <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Thu nhập
                  </span>
                </div>
              </div>
              <select className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-2.5 outline-none dark:text-white">
                <option>7 Ngày qua</option>
              </select>
            </div>
            
            {/* Chart Container */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: textColor, fontSize: 12, fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: textColor, fontSize: 12, fontWeight: 600 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#0f172a' : '#fff', 
                      borderRadius: '16px', 
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }} 
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#06b6d4" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#ec4899" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* SIDEBAR VÀ CÁC PHẦN CÒN LẠI GIỮ NGUYÊN... */}
          <section className="space-y-6">
             {/* Report Item & Bank Card code ở đây */}
             <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
              <h3 className="text-lg font-extrabold dark:text-white mb-6">Báo cáo</h3>
              <div className="space-y-4">
                <ReportItem type="income" label="Doanh thu" amount="10.000.000" color="cyan" />
                <ReportItem type="expense" label="Rút tiền" amount="0" color="pink" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-all">
                <div className="p-5 bg-slate-900 dark:bg-black rounded-[1.5rem] text-white border border-white/5">
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Linked Bank</p>
                  <p className="text-sm font-black tracking-widest mb-4">MB BANK</p>
                  <p className="text-xs font-bold tracking-[0.2em] mb-4">**** **** **** 6446</p>
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-bold opacity-60 uppercase">NHO HY</p>
                    <span className="text-[8px] bg-cyan-400 text-cyan-950 px-2 py-0.5 rounded font-black italic">VERIFIED</span>
                  </div>
                </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

/* --- Các Sub-components --- */
const StatItem = ({ icon, bg, label, value, highlight, borderColor }: any) => (
  <div className={`bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 group hover:shadow-lg ${borderColor}`}>
    <div className={`p-3 ${bg} rounded-xl transition-transform group-hover:scale-110`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{label}</p>
      <p className={`text-base font-black ${highlight ? highlight : 'text-slate-700 dark:text-slate-100'}`}>{value}</p>
    </div>
  </div>
);

const ReportItem = ({ type, label, amount, color }: any) => {
  const isCyan = color === 'cyan';
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border ${
      isCyan ? 'bg-cyan-50/30 dark:bg-cyan-500/5 border-cyan-50 dark:border-cyan-500/10' : 'bg-pink-50/30 dark:bg-pink-500/5 border-pink-50 dark:border-pink-500/10'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${isCyan ? 'text-cyan-500' : 'text-pink-500'}`}>
          {type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{label}</p>
          <p className="text-sm font-black text-slate-700 dark:text-slate-200">{amount} ₫</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;