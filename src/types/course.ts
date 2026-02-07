export interface Course {
  id: string;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  levelLabel: string;
  thumbnail: string;
  progress: number;
  isEnrolled: boolean;
  featured?: boolean;
}

// ✅ Static course data - no API fetch, instant render
export const FEATURED_COURSES: Course[] = [
  {
    id: "1",
    title: "Tiếng Nhật N5 Tổng Quát",
    description:
      "Nắm vững bảng chữ cái Hiragana, Katakana và các mẫu câu giao tiếp cơ bản.",
    level: "N5",
    levelLabel: "N5 - Sơ cấp",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCFtrgYxIHrIC8LqsG9HSJRJi4ezZqXkxEH2gGQsH3olG72YrG6BtQqFbXhnI_PZUALjDZjyae-W9GgyY8v_pZPwDRPUrKcw6ivgEbXMzb8hl6Wagm2g5B9Hk5V87qAY0raZ2eNH-EmMakh8ymm42NaD06MLgJt-hX_tyWzZpOtmtCjQzYOy3_hlLnc9KfTBIkfK_o1FlsoZJvTyRM2Tg4x-m7B97Zuf9aA27SLZaEOObFxyvuAH4O6B0ZfEEtzvNUkAf5Z7Lf2pqE",
    progress: 35,
    isEnrolled: true,
  },
  {
    id: "2",
    title: "Luyện thi JLPT N4",
    description:
      "Ôn tập ngữ pháp, từ vựng và Kanji cho kỳ thi năng lực tiếng Nhật N4.",
    level: "N4",
    levelLabel: "N4 - Sơ trung cấp",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD53X8X3vIHM6x4BdBWvXcxV0ZWZZbN6qNiyqaXSWW8V2Edb90Dn4wMoiUzbhq7FzLv54fNLw3w5FYSAy3FG41Vh8ND4aQb_5PRhiN_xRtEsB16gM65h2EQS10lFctFnpioUFnvoTG23tbdSIsWjRriHWmt6ouUMFWadHjNWNXU8ZTSxhGff_ecnBpgtJKbOgxO18VbWJGCjfBYg9uQy1TZokDW_3M05cj6_xiGpWym3q_X55FA2lySz_1ldI9lZIy8982TaSoLK04",
    progress: 12,
    isEnrolled: true,
  },
];
