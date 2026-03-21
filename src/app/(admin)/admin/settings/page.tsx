"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Edit3, Trash2, Package, TrendingUp, Ticket, X,
  CheckCircle2, Clock, Infinity, AlertTriangle 
} from "lucide-react";

export default function PaymentPackages() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Giả lập dữ liệu
  const [packages, setPackages] = useState([
    { id: 1, name: "Cơ bản (Monthly)", desc: "Dành cho người mới bắt đầu", oldPrice: 200000, newPrice: 150000, duration: "1 Tháng", status: "Đang bán" },
    { id: 2, name: "Phổ thông (Standard)", desc: "Mở khóa đầy đủ tính năng", oldPrice: 500000, newPrice: 350000, duration: "3 Tháng", status: "Đang bán" },
    { id: 3, name: "Chuyên sâu (Infinite)", desc: "Truy cập cao cấp trọn đời", oldPrice: 2000000, newPrice: 1200000, duration: "Vĩnh viễn", status: "Đang bán", isHot: true },
  ]);

  if (!mounted) return null;

  // Xử lý mở Modal Chỉnh sửa
  const handleEdit = (pkg: any) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  // Xử lý mở Modal Xóa
  const handleDeleteClick = (pkg: any) => {
    setSelectedPackage(pkg);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setPackages(packages.filter(p => p.id !== selectedPackage.id));
    setIsDeleteModalOpen(false);
    // Ở đây bạn có thể thêm hàm gọi API xóa
  };

  return (
    <main className=" min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="text-cyan-500" /> Quản lý Gói Thanh Toán
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Cấu hình hệ thống <span className="text-pink-500">FUJI</span>
          </p>
        </div>
        <button 
          onClick={() => { setSelectedPackage(null); setIsModalOpen(true); }}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center shadow-lg shadow-cyan-500/25 active:scale-95 hover:brightness-110"
        >
          <Plus className="w-5 h-5 mr-2" /> Thêm gói mới
        </button>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Tổng gói" value={`${packages.length} Gói`} icon={<Package className="text-cyan-500" />} />
        <StatCard label="Phổ biến nhất" value="Premium 6 Tháng" icon={<TrendingUp className="text-pink-500" />} highlight />
        <StatCard label="Voucher" value="05 Mã" icon={<Ticket className="text-purple-500" />} />
      </div>

      {/* TABLE */}
      <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Tên gói</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Giá gốc</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Giá sale</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Thời hạn</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {packages.map((pkg) => (
                <PackageRow 
                  key={pkg.id} 
                  pkg={pkg} 
                  onEdit={() => handleEdit(pkg)} 
                  onDelete={() => handleDeleteClick(pkg)} 
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: THÊM / SỬA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {selectedPackage ? "Cập nhật Gói" : "Thiết lập Gói Mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-pink-500 transition-colors"><X size={28} /></button>
            </div>
            <form className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Tên gói</label>
                  <input defaultValue={selectedPackage?.name} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 dark:text-white focus:ring-2 focus:ring-cyan-500" type="text" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Giá gốc</label>
                  <input defaultValue={selectedPackage?.oldPrice} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 dark:text-white" type="number" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-pink-500 mb-2 block">Giá sale</label>
                  <input defaultValue={selectedPackage?.newPrice} className="w-full bg-pink-50/50 dark:bg-pink-500/5 border border-pink-100 dark:border-pink-500/20 rounded-2xl p-4 text-pink-600 font-bold" type="number" />
                </div>
              </div>
              <div className="flex gap-4 justify-end mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-bold text-slate-500">Hủy</button>
                <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-cyan-500/20">
                  {selectedPackage ? "Lưu thay đổi" : "Xuất bản ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-pink-50 dark:bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-pink-500" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Xác nhận xóa?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">
              Bạn đang chuẩn bị xóa gói <span className="text-pink-500 font-bold">"{selectedPackage?.name}"</span>. Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">Hủy</button>
              <button onClick={confirmDelete} className="flex-1 py-4 rounded-2xl font-black bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-500/30 transition-all">Xóa ngay</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// COMPONENT CON: DÒNG TRONG BẢNG
function PackageRow({ pkg, onEdit, onDelete }: any) {
  return (
    <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group ${pkg.isHot ? 'border-l-4 border-pink-500' : ''}`}>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white">{pkg.name}</span>
          {pkg.isHot && <span className="px-2 py-0.5 bg-pink-500 text-[9px] rounded-lg text-white font-black uppercase tracking-tighter">Hot</span>}
        </div>
        <div className="text-xs text-slate-400 font-medium">{pkg.desc}</div>
      </td>
      <td className="px-6 py-5 text-slate-400 line-through text-sm italic">{pkg.oldPrice.toLocaleString()}đ</td>
      <td className="px-6 py-5 font-black text-cyan-600 dark:text-cyan-400 text-lg">{pkg.newPrice.toLocaleString()}đ</td>
      <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-bold">
        <div className="flex items-center gap-1.5">
           {pkg.duration === "Vĩnh viễn" ? <Infinity size={16} /> : <Clock size={16} />}
           {pkg.duration}
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 size={12} /> {pkg.status}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <button onClick={onEdit} className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-600 hover:text-white transition-all shadow-sm">
            <Edit3 size={18} />
          </button>
          <button onClick={onDelete} className="p-3 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-600 hover:text-white transition-all shadow-sm">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// COMPONENT CON: THẺ THỐNG KÊ
function StatCard({ label, value, icon, highlight = false }: any) {
  return (
    <div className={`p-6 rounded-[2rem] border ${highlight ? 'border-pink-200 dark:border-pink-500/30 bg-pink-50/30 dark:bg-pink-500/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm">{icon}</div>
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
          <p className={`text-xl font-black mt-0.5 ${highlight ? 'text-pink-600 dark:text-pink-400' : 'text-slate-900 dark:text-white'}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}