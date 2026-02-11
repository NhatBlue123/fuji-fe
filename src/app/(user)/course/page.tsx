"use client";
import { useState } from "react";
import Filter from "@/components/user-component/course/Filter";
import CourseList from "@/components/user-component/course/CourseList";

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
    <div className="flex-1 overflow-y-auto relative scroll-smooth">
      {/* Hero Section */}
      <div className="relative w-full h-[320px] flex flex-col justify-center overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-secondary/10">
        <div className="absolute inset-0 z-0 opacity-50">
          <div
            className="w-full h-full bg-cover bg-bottom"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-0H413QGHVmbebIlG1fj6OMnPzgFRDOaQZOq2DxLJMxtjK0P7VjCnCsjUlnAoun3J-acR1M3rSTXPDtqTNSTFUdFiJinhXaGf1nQNb1Gl8XA6gdYyijjozi-gJsg6V4tEB5xCpoCZaw1xb26qCFFYfLeCT64NwSSsPs-1Q64PHfLkuuvmdJdQpgUfIpcrb8S2jhDXazjs-F19uu8vR444_2S5hjtAWw1a5HOALkwVzUoBmbeLiuKC7CcBFfAbJ3IhdDZ4awJcN_c')",
            }}
          ></div>
        </div>
        <div className="relative z-20 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 -mt-10 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-3">
            Kho tàng khóa học{" "}
            <span className="text-secondary text-glow">FUJI</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-xl md:max-w-2xl leading-relaxed">
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
    </div>
  );
}
