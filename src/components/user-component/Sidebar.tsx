
"use client";

import React from 'react';

const Sidebar = () => {
    return (
        <aside className="hidden w-64 flex-col bg-white dark:bg-sidebar-bg border-r border-gray-200 dark:border-gray-800 md:flex shadow-xl z-20 transition-colors duration-300">
            <div className="flex items-center gap-3 px-6 py-8">
                <div className="relative flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden shadow-lg shadow-blue-500/30">
                    <span className="material-symbols-outlined text-3xl">landscape</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">FUJI</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Học Tiếng Nhật</p>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 space-y-1">
                <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-white font-bold transition-all shadow-sm dark:shadow-none" href="#">
                    <span className="material-symbols-outlined filled">home</span>
                    <span>Trang chủ</span>
                </a>
                <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-all font-medium group" href="#">
                    <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">menu_book</span>
                    <span>Khóa học</span>
                </a>
                <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-all font-medium group" href="#">
                    <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">group</span>
                    <span>Cộng đồng</span>
                </a>
                <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-all font-medium group" href="#">
                    <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">chat_bubble</span>
                    <span>Tin nhắn</span>
                    <span className="ml-auto bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-secondary/30">3</span>
                </a>
                <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-all font-medium group" href="#">
                    <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">smart_toy</span>
                    <span>Luyện tập AI</span>
                </a>
                <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-all font-medium group" href="#">
                    <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">style</span>
                    <span>Thẻ ghi nhớ</span>
                </a>
                <div className="my-4 border-t border-gray-200 dark:border-gray-800 mx-4"></div>
                <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-all font-medium group" href="#">
                    <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">notifications</span>
                    <span>Thông báo</span>
                </a>
                <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-all font-medium group" href="#">
                    <span className="material-symbols-outlined group-hover:text-blue-600 dark:group-hover:text-white transition-colors">settings</span>
                    <span>Quản lý</span>
                </a>
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-4">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 dark:from-blue-900 dark:to-indigo-950 rounded-xl p-4 text-white relative overflow-hidden group cursor-pointer shadow-lg shadow-blue-900/20 ring-1 ring-white/10">
                    <div className="absolute -right-2 -top-2 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-6xl text-yellow-300">diamond</span>
                    </div>
                    <p className="text-xs font-medium opacity-80 mb-1 text-blue-200">Gói cao cấp</p>
                    <h3 className="font-bold text-sm mb-2">Nâng cấp Premium</h3>
                    <button className="bg-white/20 hover:bg-white/30 text-xs font-bold py-1.5 px-3 rounded-lg backdrop-blur-sm transition-colors w-full border border-white/10">Xem chi tiết</button>
                </div>
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400">contrast</span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Sáng / Tối</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input checked={true} className="sr-only peer" type="checkbox" onChange={() => { }} />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                <div className="flex items-center gap-3 px-2">
                    <div className="size-10 rounded-full bg-gray-200 bg-cover bg-center border-2 border-white dark:border-gray-600 shadow-sm" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAfFl_pOyFigGwfLtmeb6LniwUCm0yBud_fv-LOAt4SoJGaT1pzBnvbOgHz5kbgBJOB_ssp423Jkd3U7soqab37_QOtQjp5mQW96CfW95qvn9FSRNVuMMNXx7T7vxkuG7ZnHbevTkCEnYHd7eRQX_QSbjeoZteLQeY9ag0vm-wqmhxamd3eiryL-cOTWrKLJp4fETdKaaaZEcH--J8xyVwIDsYlZdYp_zX6qbEXJOIXInVkVVBxP_D4xyoF96BL9Zpu4P_AZlntpRY')" }}></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Minh Anh</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Học viên N3</p>
                    </div>
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
