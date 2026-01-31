import React from 'react';

const MobieSidebar = () => {
  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-blue-600 dark:text-white text-3xl">landscape</span>
        <span className="font-black text-slate-900 dark:text-white text-lg">FUJI</span>
      </div>
      <button className="p-2 text-gray-600 dark:text-white">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </div>
  );
};

export default MobieSidebar;