import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const MobieSidebar = () => {
  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/images/logofuji_v1.png" alt="FUJI Logo" width={36} height={24} quality={100} className="object-contain" />
        <span className="font-black text-slate-900 dark:text-white text-lg">
          FUJI
        </span>
      </Link>
      <Button variant="ghost" className="p-2 text-gray-600 dark:text-white">
        <span className="material-symbols-outlined">menu</span>
      </Button>
    </div>
  );
};

export default MobieSidebar;
