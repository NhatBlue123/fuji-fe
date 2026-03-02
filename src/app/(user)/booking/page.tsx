"use client";
import React, { useState } from "react";
import BookingModal from "./bookingmodal/page";
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

  const goPrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const pages = [1, 2, 3];
  const [openBooking, setOpenBooking] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth p-8">
      {/* ===== MAIN ===== */}
      <main className="mx-auto max-w-6xl space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* HEADER */}
          <header>
            <h2 className="text-3xl font-bold mb-2">Tìm kiếm Sensei</h2>
            <p className="text-gray-400">
              Khám phá giáo viên phù hợp với trình độ của bạn
            </p>
          </header>

          {/* SEARCH */}
          <section className="bg-card-bg p-8 rounded-2xl border border-accent-border shadow-2xl">
            <div className="flex flex-col gap-6">
              {/* Search */}
              <div className="flex gap-4">
                <label className="flex flex-1 items-stretch rounded-xl bg-dark-bg border border-accent-border overflow-hidden focus-within:ring-2 focus-within:ring-neon-pink/30 transition-all">
                  <div className="text-text-secondary flex items-center justify-center pl-5">
                    <span className="material-symbols-outlined">search</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Tìm theo tên giáo viên, từ khóa hoặc chuyên môn..."
                    className="w-full border-none bg-transparent focus:ring-0 text-sm text-white placeholder:text-text-secondary/50 py-4 px-4 outline-none"
                  />
                </label>

                <button className="bg-pink-500 hover:bg-neon-pink/90 text-white px-10 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,92,141,0.2)]">
                  TÌM KIẾM
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-6 items-center">
                {/* Level */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                    Cấp độ:
                  </span>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg bg-dark-bg border border-accent-border text-xs font-bold text-text-secondary hover:border-neon-pink hover:text-neon-pink transition-all">
                      N1
                    </button>

                    <button className="px-4 py-2 rounded-lg bg-pink-500 text-white text-xs font-bold shadow-[0_0_10px_rgba(255,92,141,0.3)]">
                      N2
                    </button>

                    <button className="px-4 py-2 rounded-lg bg-pink-500 text-white text-xs font-bold shadow-[0_0_10px_rgba(255,92,141,0.3)]">
                      N3
                    </button>

                    <button className="px-4 py-2 rounded-lg bg-dark-bg border border-accent-border text-xs font-bold text-text-secondary hover:border-neon-pink hover:text-neon-pink transition-all">
                      N4
                    </button>

                    <button className="px-4 py-2 rounded-lg bg-dark-bg border border-accent-border text-xs font-bold text-text-secondary hover:border-neon-pink hover:text-neon-pink transition-all">
                      N5
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-accent-border" />

                {/* Other Filters */}
                <div className="relative flex gap-4">
                  {showPriceDropdown && (
                    <div className="absolute top-full mt-2 w-48 bg-card-bg border border-accent-border rounded-xl shadow-xl z-50">
                      {["Dưới $15", "$15 - $20", "$20 - $30", "Trên $30"].map(
                        (price) => (
                          <button
                            key={price}
                            onClick={() => {
                              setSelectedPrice(price);
                              setShowPriceDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-text-secondary hover:bg-dark-bg hover:text-neon-pink transition-all"
                          >
                            {price}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                    className="flex items-center gap-2 bg-dark-bg border border-accent-border px-4 py-2 rounded-lg text-text-secondary text-xs font-bold hover:border-neon-pink hover:text-neon-pink transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      payments
                    </span>
                    <span>{selectedPrice ? selectedPrice : "Khoảng giá"}</span>
                    <span className="material-symbols-outlined text-sm">
                      expand_more
                    </span>
                  </button>

                  <button className="flex items-center gap-2 bg-dark-bg border border-accent-border px-4 py-2 rounded-lg text-text-secondary text-xs font-bold hover:border-neon-pink hover:text-neon-pink transition-all">
                    <span className="material-symbols-outlined text-sm">
                      language
                    </span>
                    <span>Ngôn ngữ</span>
                    <span className="material-symbols-outlined text-sm">
                      expand_more
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* TEACHERS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((t) => (
              <div
                key={t.name}
                className="bg-card-bg rounded-2xl border border-gray-800 hover:border-pink-500 transition flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex gap-4 mb-4">
                    <img
                      src={t.img}
                      alt={t.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-lg">{t.name}</h3>
                      <p className="text-pink-400 text-sm">⭐ {t.rating}</p>
                      <p className="font-bold">
                        ${t.price}
                        <span className="text-gray-400 text-xs"> /giờ</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm italic mb-4">
                    "{t.desc}"
                  </p>

                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-[#0B0F1A] border border-gray-700 rounded">
                      {t.exp}
                    </span>
                    <span className="px-2 py-1 bg-[#0B0F1A] border border-gray-700 rounded">
                      {t.tag}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <button
                    onClick={() => setOpenBooking(true)}
                    className="w-full py-3 bg-pink-500 rounded-xl font-bold hover:brightness-110 transition"
                  >
                    Đặt lịch ngay
                  </button>
                  
                </div>
                {openBooking && (
                    <BookingModal onClose={() => setOpenBooking(false)} />
                  )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="flex justify-center pt-8">
        <nav className="flex items-center gap-2">
          {/* PREV */}
          <button
            onClick={goPrev}
            className="size-11 flex items-center justify-center rounded-xl border border-accent-border bg-card-bg hover:bg-dark-bg hover:border-neon-pink transition-all text-text-secondary hover:text-neon-pink"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_left
            </span>
          </button>

          {/* PAGE NUMBERS */}
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={
                p === currentPage
                  ? "size-11 flex items-center justify-center rounded-xl bg-neon-pink text-white font-bold text-sm shadow-[0_0_15px_rgba(255,92,141,0.3)]"
                  : "size-11 flex items-center justify-center rounded-xl border border-accent-border bg-card-bg hover:bg-dark-bg hover:border-neon-pink transition-all font-bold text-sm text-text-secondary hover:text-neon-pink"
              }
            >
              {p}
            </button>
          ))}

          {/* DOTS */}
          <span className="px-2 text-text-secondary/40 font-bold">...</span>

          {/* LAST PAGE */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            className="size-11 flex items-center justify-center rounded-xl border border-accent-border bg-card-bg hover:bg-dark-bg hover:border-neon-pink transition-all font-bold text-sm text-text-secondary hover:text-neon-pink"
          >
            {totalPages}
          </button>

          {/* NEXT */}
          <button
            onClick={goNext}
            className="size-11 flex items-center justify-center rounded-xl border border-accent-border bg-card-bg hover:bg-dark-bg hover:border-neon-pink transition-all text-text-secondary hover:text-neon-pink"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </button>
        </nav>
      </div>

      {/* FLOAT BUTTON */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-pink-500 rounded-full shadow-lg hover:scale-110 transition">
        💬
      </button>
    </div>
  );
}
