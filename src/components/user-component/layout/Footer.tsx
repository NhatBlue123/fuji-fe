"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Mail, Phone, Facebook, Youtube, Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Footer Component - Responsive & Modern
 * - Mobile-first design với spacing tối ưu
 * - Smooth animations
 * - Adaptive layout cho mọi kích thước màn hình
 */
const Footer = () => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Youtube, href: "#", label: "Youtube" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  return (
    <footer className="bg-muted/30 dark:bg-muted/10 text-foreground/80 border-t border-border mt-auto transition-colors w-full">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          
          {/* Cột 1: Brand */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg blur-sm opacity-30" />
                <Image 
                  src="/images/logofuji_v1.png" 
                  alt="FUJI Logo" 
                  width={56} 
                  height={38} 
                  quality={100} 
                  className="object-contain relative z-10" 
                />
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tighter bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent uppercase">
                FUJI
              </h2>
            </div>
            {isMounted ? (
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xs opacity-80">
                {t('auto.footer_1')}
              </p>
            ) : (
              <div className="h-12 w-full max-w-xs bg-muted/30 rounded animate-pulse" />
            )}
            <div className="flex gap-2.5 mt-1">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 20 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "size-8 sm:size-9 rounded-full",
                    "bg-background border border-border",
                    "flex items-center justify-center",
                    "hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-600",
                    "hover:text-white hover:border-transparent",
                    "transition-all duration-300",
                    "shadow-sm hover:shadow-md"
                  )}
                  aria-label={social.label}
                >
                  <social.icon className="size-3.5 sm:size-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Cột 2: Danh mục */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-3 sm:gap-4"
          >
            <h4 className="text-foreground font-bold uppercase tracking-wider text-[10px] sm:text-xs opacity-50">
              {isMounted ? t('auto.footer_2') : ''}
            </h4>
            <ul className="flex flex-col gap-2 sm:gap-2.5">
              {isMounted && ['footer_3', 'footer_4', 'footer_5'].map((key, index) => (
                <motion.li
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <a 
                    href="#" 
                    className="text-xs sm:text-sm hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium inline-block hover:translate-x-1 duration-200"
                  >
                    {t(`auto.${key}`)}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Cột 3: Học tập */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-3 sm:gap-4"
          >
            <h4 className="text-foreground font-bold uppercase tracking-wider text-[10px] sm:text-xs opacity-50">
              {isMounted ? t('auto.footer_6') : ''}
            </h4>
            <ul className="flex flex-col gap-2 sm:gap-2.5">
              {isMounted && ['footer_7', 'footer_8', 'footer_9'].map((key, index) => (
                <motion.li
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <a 
                    href="#" 
                    className="text-xs sm:text-sm hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium inline-block hover:translate-x-1 duration-200"
                  >
                    {t(`auto.${key}`)}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Cột 4: Liên hệ */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-3 sm:gap-4"
          >
            <h4 className="text-foreground font-bold uppercase tracking-wider text-[10px] sm:text-xs opacity-50">
              {isMounted ? t('auto.footer_10') : ''}
            </h4>
            <ul className="flex flex-col gap-2.5 sm:gap-3">
              <motion.li 
                className="flex items-center gap-2.5"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center size-7 sm:size-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <Mail className="size-3.5 sm:size-4" />
                </div>
                <a 
                  href="mailto:support@fuji.edu.vn" 
                  className="text-xs sm:text-sm hover:text-pink-600 dark:hover:text-pink-400 font-medium transition-colors"
                >
                  support@fuji.edu.vn
                </a>
              </motion.li>
              <motion.li 
                className="flex items-center gap-2.5"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center size-7 sm:size-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <Phone className="size-3.5 sm:size-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold">1900 1234</span>
              </motion.li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Dòng bản quyền dưới cùng */}
      <div className="bg-background/20 border-t border-border py-3 sm:py-4 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          <p className="text-muted-foreground text-[10px] sm:text-xs font-bold tracking-tight opacity-50 uppercase text-center sm:text-left">
            {isMounted ? t('auto.footer_11') : ''}
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-wider">
            {isMounted && ['footer_12', 'footer_13', 'footer_14'].map((key) => (
              <a 
                key={key}
                className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors" 
                href="#"
              >
                {t(`auto.${key}`)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
