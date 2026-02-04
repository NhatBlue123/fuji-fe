import React from 'react';
import { Button } from '@/components/ui/button';

const Footer = () => {
    return (
        <footer className="bg-footer-bg relative overflow-hidden pt-16 border-t border-white/5">
            <div className="absolute top-8 right-8 w-6 h-6 bg-secondary/20 sakura-petal opacity-40 rotate-45"></div>
            <div className="absolute top-20 right-14 w-4 h-4 bg-secondary/10 sakura-petal opacity-30 -rotate-12"></div>
            <div className="px-6 md:px-12 lg:px-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-12">
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-500/20">
                            <span className="material-symbols-outlined text-2xl">landscape</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white">FUJI</h2>
                    </div>
                    <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
                        Chinh phục tiếng Nhật cùng AI. Nền tảng học tập thông minh hàng đầu cho người Việt.
                    </p>
                    <div className="flex gap-4">
                        <a className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group" href="#">
                            <svg className="size-5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"></path></svg>
                        </a>
                        <a className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all" href="#">
                            <svg className="size-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>
                        </a>
                        <a className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black hover:border-white transition-all" href="#">
                            <svg className="size-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.023C13.435.035 14.34.05 15.24.1c1.32.07 2.16.29 2.92.59.84.34 1.5.8 2.15 1.45.65.65 1.11 1.31 1.45 2.15.3.76.52 1.6.59 2.92.05.9.065 1.805.077 2.715.012.91.012 1.82 0 2.73-.012.91-.027 1.815-.077 2.715-.07 1.32-.29 2.16-.59 2.92-.34.84-.8 1.5-1.45 2.15-.65-.65-1.11-1.31-1.45-2.15-.3-.76-.52-1.6-.59-2.92-.05-.9-.065-1.805-.077-2.715-.012-.91-.012-1.82 0-2.73.012-.91.027-1.815.077-2.715.07-1.32.29-2.16.59-2.92.34-.84.8-1.5 1.45-2.15.65-.65 1.31-1.11 2.15-1.45.76-.3 1.6-.52 2.92-.59.9-.05 1.805-.065 2.715-.077.91-.012 1.82-.012 2.73 0 .91.012 1.815.027 2.715.077zM12.31 18c2.113.014 4.226.014 6.339 0 .438-.003.876-.014 1.312-.033.51-.023.864-.134 1.157-.26a3.52 3.52 0 0 0 1.25-.815c.37-.365.64-.78.815-1.25.126-.293.237-.647.26-1.157.019-.436.03-1.3.033-1.312.014-2.113.014-4.226 0-6.339-.003-.438-.014-.876-.033-1.312-.023-.51-.134-.864-.26-1.157a3.52 3.52 0 0 0-.815-1.25 3.52 3.52 0 0 0-1.25-.815c-.293-.126-.647-.237-1.157-.26-.436-.019-1.3-.03-1.312-.033-2.113-.014-4.226-.014-6.339 0-.438.003-.876.014-1.312.033-.51.023-.864.134-1.157.26a3.52 3.52 0 0 0-1.25.815 3.52 3.52 0 0 0-.815 1.25c-.126.293-.237.647-.26 1.157-.019.436-.03 1.3-.033 1.312-.014 2.113-.014 4.226 0 6.339.003.438.014.876.033 1.312.023.51.134.864.26 1.157.175.47.45.885.815 1.25.365.37.78.64 1.25.815.293.126.647.237 1.157.26.436.019 1.3.03 1.312.033z"></path></svg>
                        </a>
                    </div>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-5">
                    <h4 className="text-white font-bold uppercase tracking-wider text-sm">Về FUJI</h4>
                    <ul className="flex flex-col gap-3 text-slate-400 font-medium">
                        <li><a className="hover:text-blue-400 transition-colors" href="#">Giới thiệu</a></li>
                        <li><a className="hover:text-blue-400 transition-colors" href="#">Tuyển dụng</a></li>
                        <li><a className="hover:text-blue-400 transition-colors" href="#">Blog</a></li>
                    </ul>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-5">
                    <h4 className="text-white font-bold uppercase tracking-wider text-sm">Học tập</h4>
                    <ul className="flex flex-col gap-3 text-slate-400 font-medium">
                        <li><a className="hover:text-blue-400 transition-colors" href="#">Lộ trình N5-N1</a></li>
                        <li><a className="hover:text-blue-400 transition-colors" href="#">Luyện Kaiwa</a></li>
                        <li><a className="hover:text-blue-400 transition-colors" href="#">Đề thi thử</a></li>
                    </ul>
                </div>
                <div className="lg:col-span-4 flex flex-col gap-5">
                    <h4 className="text-white font-bold uppercase tracking-wider text-sm">Đăng ký nhận tin</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">Nhận mẹo học tiếng Nhật và ưu đãi khóa học mới nhất từ FUJI.</p>
                    <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl focus-within:border-blue-500/50 transition-all">
                        <input className="bg-transparent border-none focus:ring-0 text-white text-sm flex-1 px-3" placeholder="Email của bạn" type="email" />
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap">
                            Đăng ký
                        </Button>
                    </div>
                </div>
            </div>
            <div className="px-6 md:px-12 lg:px-20 border-t border-white/5 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <a className="hover:text-slate-300 transition-colors" href="#">Điều khoản</a>
                        <a className="hover:text-slate-300 transition-colors" href="#">Bảo mật</a>
                        <a className="hover:text-slate-300 transition-colors" href="#">Trung tâm trợ giúp</a>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">© 2026 FUJI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;