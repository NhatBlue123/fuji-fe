"use client";
import { useState } from "react";
import Filter from "@/components/admin-component/course/Filter";
import CourseList from "@/components/admin-component/course/CourseList";

export default function CoursePage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = (filters: {
    search: string;
    level: string;
    category: string;
  }) => {
    console.log("Filters changed:", filters);
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <main className="flex-1 overflow-y-auto relative scroll-smooth bg-[#0B1120]">
      {/* Hero Section */}
      <div className="relative w-full h-[320px] flex flex-col justify-center overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-blue-900/10">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-[#0B1120] to-[#0B1120] z-10"></div>
        <div className="absolute inset-0 z-0 opacity-40">
          <div
            className="w-full h-full bg-cover bg-bottom"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-0H413QGHVmbebIlG1fj6OMnPzgFRDOaQZOq2DxLJMxtjK0P7VjCnCsjUlnAoun3J-acR1M3rSTXPDtqTNSTFUdFiJinhXaGf1nQNb1Gl8XA6gdYyijjozi-gJsg6V4tEB5xCpoCZaw1xb26qCFFYfLeCT64NwSSsPs-1Q64PHfLkuuvmdJdQpgUfIpcrb8S2jhDXazjs-F19uu8vR444_2S5hjtAWw1a5HOALkwVzUoBmbeLiuKC7CcBFfAbJ3IhdDZ4awJcN_c')",
            }}
          ></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1120] to-transparent z-10"></div>
        <div className="relative z-20 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 -mt-10 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
            Kho tàng khóa học{" "}
            <span className="text-secondary text-glow">FUJI</span>
          </h1>
          <p className="text-slate-300 text-lg font-light max-w-xl md:max-w-2xl leading-relaxed">
            Hệ thống bài giảng chất lượng cao, thiết kế độc quyền cho người
            Việt. Từ sơ cấp N5 đến cao cấp N1.
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 -mt-16 relative z-30">
        <Filter onFilterChange={handleFilterChange} />
      </div>

      {/* Course List */}
      <CourseList isLoading={isLoading} />
    </main>
  );
}
