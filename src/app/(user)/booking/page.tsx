"use client";
import React, { useState } from "react";
import BookingModal from "./bookingmodal/page";
import { Button } from "@/components/ui/button";

const teachers = [
  {
    name: "Haruka Sato",
    rating: 4.9,
    price: 25,
    desc: "Giúp học sinh chinh phục ngữ pháp N2/N1 thông qua các tình huống thực tế.",
    exp: "8 Năm KN",
    tag: "JLPT Expert",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvQFVjaA0ZgmkPZEXimtW00t7GPwNeIGsyJMq7arB2jvnLSppnuhNs-SYDqamYhzfLQmPbpci444m1IPuSUeACsi5ICYEDRV8gEvOhqqrjCEEoobYluCeNFTIub_G8p1P3K66QidoZmtuZHxFN4gSQyaI_Wx1oSduv93CFalNFnbOdSEX-h6yAb_pphUiM-yIHkUvTVztIKO7p9fxdR8oKXbG7hfNsdDfTtA-GKcNOmehZuk3Ld2-QV6mFFggN-JXGIZwbcIA9X5eK",
  },
  {
    name: "Kenji Tanaka",
    rating: 5.0,
    price: 18,
    desc: "Chuyên về giọng Osaka tự nhiên và phương ngữ Tokyo thân mật.",
    exp: "3 Năm KN",
    tag: "Giao tiếp",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCg0_0OE4sYBxDju-DVusMpElcphmnSVZAzkGMBASVX_ElYueNs1G0Q4ujzKUIvN3uJExN1DhFN2tuEIbEspDpyRl5ui-a7VND1sIQElU5xw_sxgjJaeGphYoJZjYoSlPgGe88CN4QnSaxL0vSfyBbI24E1AjT2NiT4emA-xFD2TA5r-SSEguIgY_2hKazMAY87x0AIrM6buopWK_V4Hz8K3kUdaD7JMXhLc5Gdi_U86cMz0PfS8McrHnvndfGIxQT0wGnMprbBXUs8",
  },
  {
    name: "Yumi Ishii",
    rating: 4.8,
    price: 22,
    desc: "Dạy tiếng Nhật cho trẻ em và người mới bắt đầu N5/N4 một cách sinh động.",
    exp: "5 Năm KN",
    tag: "Trẻ em",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBO3uj9J29q5O4rTZSqYwK2o1xdXTV-_3yjB3GUPasHDC0MYBhSkIckEUIDy2c08WvLmCqArmGwzZFWGiyXnDINAHgJfQlCDi9tPHTX1zI56HTtTzkAjtFVC6WkEp9cTbzCQoU42ZRCbNvw9iuqwPQe9KS4ZmBVPF2hvNUc8wgBSDuTDhVbf6OVJnEmLmPNX81KzH-4AnS6J-7mmpyl2HR3a7IFo88iNDUkrJwokBnUjwKtIoXfpgj1D-cUb64oDphr_fr0M6VBWuE",
  },
  {
    name: "Kenji Tanaka",
    rating: 5.0,
    price: 18,
    desc: "Chuyên về giọng Osaka tự nhiên và phương ngữ Tokyo thân mật.",
    exp: "3 Năm KN",
    tag: "Giao tiếp",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCg0_0OE4sYBxDju-DVusMpElcphmnSVZAzkGMBASVX_ElYueNs1G0Q4ujzKUIvN3uJExN1DhFN2tuEIbEspDpyRl5ui-a7VND1sIQElU5xw_sxgjJaeGphYoJZjYoSlPgGe88CN4QnSaxL0vSfyBbI24E1AjT2NiT4emA-xFD2TA5r-SSEguIgY_2hKazMAY87x0AIrM6buopWK_V4Hz8K3kUdaD7JMXhLc5Gdi_U86cMz0PfS8McrHnvndfGIxQT0wGnMprbBXUs8",
  },
  {
    name: "Yumi Ishii",
    rating: 4.8,
    price: 22,
    desc: "Dạy tiếng Nhật cho trẻ em và người mới bắt đầu N5/N4 một cách sinh động.",
    exp: "5 Năm KN",
    tag: "Trẻ em",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBO3uj9J29q5O4rTZSqYwK2o1xdXTV-_3yjB3GUPasHDC0MYBhSkIckEUIDy2c08WvLmCqArmGwzZFWGiyXnDINAHgJfQlCDi9tPHTX1zI56HTtTzkAjtFVC6WkEp9cTbzCQoU42ZRCbNvw9iuqwPQe9KS4ZmBVPF2hvNUc8wgBSDuTDhVbf6OVJnEmLmPNX81KzH-4AnS6J-7mmpyl2HR3a7IFo88iNDUkrJwokBnUjwKtIoXfpgj1D-cUb64oDphr_fr0M6VBWuE",
  },
];

export default function TeacherBookingDashboard() {
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 12;

  const [openBooking, setOpenBooking] = useState(false);

  const goPrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const pages = [1, 2, 3];

  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth bg-background min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full h-[320px] flex flex-col justify-center overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-secondary/10">
        <div className="absolute inset-0 z-0 opacity-50">
          <div
            className="w-full h-full bg-cover bg-bottom opacity-40 dark:opacity-20 transition-opacity"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-0H413QGHVmbebIlG1fj6OMnPzgFRDOaQZOq2DxLJMxtjK0P7VjCnCsjUlnAoun3J-acR1M3rSTXPDtqTNSTFUdFiJinhXaGf1nQNb1Gl8XA6gdYyijjozi-gJsg6V4tEB5xCpoCZaw1xb26qCFFYfLeCT64NwSSsPs-1Q64PHfLkuuvmdJdQpgUfIpcrb8S2jhDXazjs-F19uu8vR444_2S5hjtAWw1a5HOALkwVzUoBmbeLiuKC7CcBFfAbJ3IhdDZ4awJcN_c')",
            }}
          ></div>
        </div>
        <div className="relative z-20 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 -mt-10 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-3">
            Đặt lịch cùng{" "}
            <span className="text-secondary text-glow">Sensei</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-xl md:max-w-2xl leading-relaxed">
            Nâng trình hội thoại với giáo viên bản xứ cực kỳ tâm huyết. Tìm kiếm chuyên gia tiếng Nhật 1 kèm 1 phù hợp nhất.
          </p>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 -mt-16 relative z-30 mb-8">
        <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-2xl shadow-black/5 dark:shadow-white/5">
          <div className="flex flex-col gap-6">
            {/* Search */}
            <div className="flex gap-4">
              <label className="flex flex-1 items-stretch rounded-xl bg-background border border-border overflow-hidden focus-within:ring-2 focus-within:ring-secondary/30 transition-all">
                <div className="text-muted-foreground flex items-center justify-center pl-5">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  type="text"
                  placeholder="Tìm theo tên giáo viên, từ khóa hoặc chuyên môn..."
                  className="w-full border-none bg-transparent focus:ring-0 text-foreground placeholder:text-muted-foreground py-4 px-4 outline-none"
                />
              </label>

              <button className="bg-secondary text-secondary-foreground hover:brightness-110 px-6 md:px-10 rounded-xl font-bold transition-all shadow-lg shadow-secondary/20 whitespace-nowrap">
                TÌM KIẾM
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center mt-2">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest hidden md:inline-block">
                Cấp độ:
              </span>
              <div className="flex gap-2">
                {["N1", "N2", "N3", "N4", "N5"].map((level) => (
                  <button
                    key={level}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      level === "N2" || level === "N3"
                        ? "bg-secondary text-secondary-foreground shadow-md shadow-secondary/30"
                        : "bg-background border border-border text-muted-foreground hover:border-secondary hover:text-secondary"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="hidden md:block h-8 w-px bg-border mx-2" />

              {/* Other Filters */}
              <div className="relative flex flex-wrap gap-3">
                <div className="relative">
                  {showPriceDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                      {["Dưới $15", "$15 - $20", "$20 - $30", "Trên $30"].map(
                        (price) => (
                          <Button
                            key={price}
                            onClick={() => {
                              setSelectedPrice(price);
                              setShowPriceDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-accent transition-all"
                          >
                            {price}
                          </Button>
                        ),
                      )}
                    </div>
                  )}
                  <Button
                    onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                    className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-lg text-muted-foreground text-sm font-bold hover:border-secondary hover:text-secondary transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    <span>{selectedPrice || "Khoảng giá"}</span>
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </Button>
                </div>

                <button className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-lg text-muted-foreground text-sm font-bold hover:border-secondary hover:text-secondary transition-all">
                  <span className="material-symbols-outlined text-sm">language</span>
                  <span>Ngôn ngữ</span>
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pb-16">
        
        {/* TEACHERS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teachers.map((t, idx) => (
            <div
              key={idx}
              className="bg-card rounded-2xl border border-border shadow-sm hover:border-secondary hover:shadow-secondary/10 hover:shadow-lg transition-all flex flex-col overflow-hidden group relative"
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start gap-4 mb-5">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-foreground line-clamp-1">{t.name}</h3>
                    <p className="text-secondary text-sm font-medium flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> {t.rating}
                    </p>
                    <p className="font-bold text-foreground mt-1">
                      ${t.price} <span className="text-muted-foreground text-xs font-normal">/giờ</span>
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-3 flex-1">
                  "{t.desc}"
                </p>

                <div className="flex flex-wrap gap-2 text-xs font-semibold mt-auto">
                  <span className="px-2.5 py-1 bg-accent text-accent-foreground border border-border rounded-md">
                    {t.exp}
                  </span>
                  <span className="px-2.5 py-1 bg-accent text-accent-foreground border border-border rounded-md">
                    {t.tag}
                  </span>
                </div>
              </div>

              <div className="p-5 pt-0 mt-auto">
                <button
                  onClick={() => setOpenBooking(true)}
                  className="w-full py-3 bg-secondary text-secondary-foreground rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-secondary/20"
                >
                  Đặt lịch ngay
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center mt-12 gap-2">
          {/* PREV */}
          <Button
            onClick={goPrev}
            disabled={currentPage === 1}
            className="size-10 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:border-secondary transition-all text-muted-foreground hover:text-secondary disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </Button>

          {/* PAGE NUMBERS */}
          {pages.map((p) => (
            <Button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={
                p === currentPage
                  ? "size-10 flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold text-sm shadow-md shadow-secondary/30 transition-all"
                  : "size-10 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:border-secondary transition-all font-bold text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {p}
            </Button>
          ))}

          {/* DOTS */}
          <span className="size-10 flex items-center justify-center text-muted-foreground font-bold">...</span>

          {/* LAST PAGE */}
          <Button
            onClick={() => setCurrentPage(totalPages)}
            className="size-10 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:border-secondary transition-all font-bold text-sm text-muted-foreground hover:text-foreground"
          >
            {totalPages}
          </Button>

          {/* NEXT */}
          <Button
            onClick={goNext}
            disabled={currentPage === totalPages}
            className="size-10 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:border-secondary transition-all text-muted-foreground hover:text-secondary disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Button>
        </div>
      </div>

      {openBooking && (
        <BookingModal onClose={() => setOpenBooking(false)} />
      )}

      {/* FLOAT BUTTON */}
      <Button className="fixed bottom-8 right-8 w-14 h-14 bg-secondary text-secondary-foreground rounded-full shadow-lg shadow-secondary/30 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl z-40">
        💬
      </Button>
    </div>
  );
}
