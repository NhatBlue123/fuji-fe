"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Mail, Phone, Facebook, Youtube, Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Footer Component - Tối ưu diện tích nhưng GIỮ NGUYÊN nội dung:
 * - Thu nhỏ các khoảng đệm dọc (py-4 md:py-6).
 * - Loại bỏ container để bám sát lề trái/phải theo yêu cầu.
 * - Giảm kích thước chữ và khoảng cách giữa các hàng.
 * 
 * @fix Hydration Error: Sử dụng useEffect để tránh SSR/Client mismatch
 */
const Footer = () => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  // Chỉ render translation sau khi client mount để tránh hydration mismatch
  useEffect(() => {
    const timer = window.setTimeout(() => setIsMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <footer className="bg-muted/30 dark:bg-muted/10 text-foreground/80 border-t border-border mt-auto transition-colors w-full">
      <div className="px-4 md:px-8 lg:px-12 py-5 md:py-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Cột 1: Brand */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Image src="/images/logofuji_v1.png" alt="FUJI Logo" width={72} height={48} quality={100} className="object-contain" />
              <h2 className="text-base font-black tracking-tighter text-foreground uppercase">FUJI</h2>
            </div>
            {isMounted ? (
              <p className="text-muted-foreground text-[11px] leading-relaxed max-w-xs opacity-70">{t('auto.footer_1')}</p>
            ) : (
              // Placeholder during SSR to prevent hydration mismatch
              <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
            )}
            <div className="flex gap-2 mt-1">
              <a href="#" className="size-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary hover:text-white transition-all"><Facebook className="size-3" /></a>
              <a href="#" className="size-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary hover:text-white transition-all"><Youtube className="size-3" /></a>
              <a href="#" className="size-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary hover:text-white transition-all"><Instagram className="size-3" /></a>
            </div>
          </div>

          {/* Cột 2: Danh mục */}
          <div className="flex flex-col gap-2">
            <h4 className="text-foreground font-bold uppercase tracking-widest text-[9px] opacity-40">{isMounted ? t('auto.footer_2') : ''}</h4>
            <ul className="flex flex-col gap-1.5">
              <li><a href="#" className="text-[11px] hover:text-secondary transition-colors font-medium">{isMounted ? t('auto.footer_3') : ''}</a></li>
              <li><a href="#" className="text-[11px] hover:text-secondary transition-colors font-medium">{isMounted ? t('auto.footer_4') : ''}</a></li>
              <li><a href="#" className="text-[11px] hover:text-secondary transition-colors font-medium">{isMounted ? t('auto.footer_5') : ''}</a></li>
            </ul>
          </div>

          {/* Cột 3: Học tập */}
          <div className="flex flex-col gap-2">
            <h4 className="text-foreground font-bold uppercase tracking-widest text-[9px] opacity-40">{isMounted ? t('auto.footer_6') : ''}</h4>
            <ul className="flex flex-col gap-1.5">
              <li><a href="#" className="text-[11px] hover:text-secondary transition-colors font-medium">{isMounted ? t('auto.footer_7') : ''}</a></li>
              <li><a href="#" className="text-[11px] hover:text-secondary transition-colors font-medium">{isMounted ? t('auto.footer_8') : ''}</a></li>
              <li><a href="#" className="text-[11px] hover:text-secondary transition-colors font-medium">{isMounted ? t('auto.footer_9') : ''}</a></li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div className="flex flex-col gap-2">
            <h4 className="text-foreground font-bold uppercase tracking-widest text-[9px] opacity-40">{isMounted ? t('auto.footer_10') : ''}</h4>
            <ul className="flex flex-col gap-1.5">
              <li className="flex items-center gap-2">
                <Mail className="size-3 text-secondary opacity-50" />
                <a href="mailto:support@fuji.edu.vn" className="text-[11px] hover:text-secondary font-medium">support@fuji.edu.vn</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-3 text-secondary opacity-50" />
                <span className="text-[11px] font-bold">1900 1234</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Dòng bản quyền dưới cùng */}
      <div className="bg-background/20 border-t border-border py-2.5 px-4 md:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-muted-foreground text-[9px] font-bold tracking-tight opacity-40 uppercase">{isMounted ? t('auto.footer_11') : ''}</p>
          <div className="flex gap-4 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            <a className="hover:text-secondary transition-colors" href="#">{isMounted ? t('auto.footer_12') : ''}</a>
            <a className="hover:text-secondary transition-colors" href="#">{isMounted ? t('auto.footer_13') : ''}</a>
            <a className="hover:text-secondary transition-colors" href="#">{isMounted ? t('auto.footer_14') : ''}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
