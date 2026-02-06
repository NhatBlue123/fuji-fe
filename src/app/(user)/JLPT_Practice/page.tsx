"use client";
import CourseHeader from "./CourseHeader";
import CourseFilters from "./CourseFilter";
import HistoryCard from "./HistoryCard";
import ExamCard from "./ExamCard";
import  { useState } from "react";
export default function JlptPracticePage() {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 3;
  return (
    <div className="w-full px-6 md:px-12 lg:px-20 py-12 relative bg-[#0B1120] min-h-screen">
      <CourseHeader />
      <CourseFilters />
      {/* 3. Grid chứa các thẻ */}
      <section className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        <HistoryCard />

        {/*Card Bài thi  */}
        <ExamCard 
          status="new" 
          title="JLPT N3 – Đề mô phỏng toàn diện số 01" 
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuCDxFdbUtg2jEo2f1rVJJRTWZBFyHB44-mlAfp-GKLrUnc3cvcH-cYZkH9ydP1YZODRfyQc0x6eBpLw_08krUI8ntpUCInksY4rGhIQ81URRQSBldgEks8NzAQfdI8muIWwfH4RaeSIOQCcSC46f2ShFOMCOQekPfNuYnJdTzqcgOFbRdGgflkzcH3f6CnWfeMZ-BeBwcAsHM_QHKpoJWgS8OFizAnRfRkQ-wkuB1LIA4y2pGlwyGgNB5FumbYYiB57B4jKGJC2xEI" 
          tag="N3" info="105 câu hỏi • 140 phút"
          colorTheme="pink-400"
        />
        
        <ExamCard 
          status="doing" 
          title="JLPT N3 – Đề mô phỏng toàn diện số 02" 
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuCawvqWkKg9qSrkrtcIeWX_rKp2o2_k-CSOuaRPh5nQ_GwX391hj-20zVJPFE8KDu3eB5NREv2ep6-YjiLkivsGOzdYMF9adztcRoATBiInC1LpmabNvD832VoxiCieB05GibU2St7S3uH-6TryTKAXZH6tIALrVQ26_JWDPGKrEDYUVa-xfFZsYMJrvzQ2hxlifsOlOWmN_m3XWBuMsTZ6As6oc01gwzV13VP7QZhYvXHdStoa3GxA-X5tjgCsiaWdx5NU-gQe8JE"
          tag="N3" info="105 câu hỏi • 58p còn lại"
          colorTheme="pink-400"
        />

        <ExamCard 
          status="done" 
          title="JLPT N3 – Đề mô phỏng toàn diện số 03" 
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuC_NTcAhTfuiJvkk-gslbbjgQdC7H_lDCrO0cu4LNID12zyAw8oz45TPQhw-HuiHcFMgQX2UiYim0ck3zapDlyfOjjlqrXy01_QMbgs3eTcg4ML2VRv_TkK3R2hN-2nx_GkSNDsayWwN3xEwYoECtd--gHqX83cICipmYRJc6iCEci5qpvWtOxjupBJm23jYNaozsUlumI9EBiQxQVBna1DUjOlm896LvzIevKuRfQKGP9e6gzgb_m9zigiUc9a2k2iyTT19RxO6Oo"
          tag="N3" info="145/180 điểm"
          colorTheme="pink-400"
        />

        <ExamCard 
          status="new" 
          title="N3 Vocabulary Master Test #1" 
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuDKvHcidreWBO4DBqHYMccVPZffxXiQJsAp0xppEah6q3xZwi7N7nJWHPBShYkEcXo36L0zFYfA22OMIkVONQx5l1Jf1Zp6f65THp2xWNrN90KD8XpuBJoxGskHOp8zvTwp6YYVy9Vf30VCidJwZcYYjyDpLpu7WGIrG__1z5Rg8XVaC337MevffxgMbaQMQIrRFT5N5nTdw6b3wW9wnSkU57TsedRWSbcfMu45FkUifna2yuGrB9_EXL1uwOxydeKbIH9Ok_Ai27c"
          tag="N3" info="35 câu hỏi • 30 phút"
          colorTheme="pink-400"
        />

        <ExamCard 
          status="new" 
          title="N3 Grammar Challenge #1" 
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuC0cs1F7uERCl7lZS6YPLauhU94lIbPil345MxmzZpsPmWm0Q-Cci934O051JMQJ97RtTyEH_uKT8WXarjZhtbccbkBBIS_o4wLr7xeZydNUwMSLkOZkRJd57v4Filsj72HEgdxLrF_vGBaLbhEvy6unLx77rjEOnArk5jpMu-O_uCg4kCIhEWzK0TDcAYpalb1FifanrkIBdx_eCcn6Ched6XNilDyk-ws3Jg-UQRNi90hb1UqPFn8dtGYUiBe8vdslQN1e2pBQBA"
          tag="N3" info="25 câu hỏi • 40 phút"
          colorTheme="pink-400"
        />

        <ExamCard 
          status="locked" 
          title="JLPT N3 – Đề mô phỏng toàn diện số 04 (VIP)" 
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuD4bB8jIQe-LeDCuqLFDifFjwqdZppIzZBxQbtrpjif40cYvw1bpoxlyJ5dT_2Dr-A1qN6kpgrdOMLRv-aEOzJT4Jpu1LROprH_a5JIdAojDU0Zt_lCnA7Bn7bnH2In_yWUNT2fGzhB2yPuXlq-s_-I0Enxg6KhTM63RU45YnZ7bNHKmHT7Zdr71CmWrEUYCYZrRIcbZC5uRWKKBqiu-2yFh361CGOlj4wTsFyhQ4D-FK9tSDUyXkGAu9IimPoHkoVn3-w6uDMisc4"
          tag="N3" info="105 câu hỏi • 140 phút"
          colorTheme="pink-400"
        />
      </section>

      <div className="flex justify-center mt-12 gap-2 relative z-10">

        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          className="size-10 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 flex items-center justify-center transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        {[1, 2, 3].map((page) => {
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`
                size-10 rounded-lg flex items-center justify-center font-bold transition-all
                ${isActive
                 
                  ? "bg-pink-400 text-white shadow-[0_0_10px_rgba(242,181,196,0.3)]"
                 
                  : "border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              {page}
            </button>
          );
        })}

        {/* Dấu ba chấm (...) */}
        <span className="size-10 flex items-center justify-center text-slate-500">...</span>

        {/* Nút NEXT (>) */}
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          className="size-10 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 flex items-center justify-center transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>

      </div>

    </div>
  );
}