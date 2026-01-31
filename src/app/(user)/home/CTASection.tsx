const CTA = () => {
  return (
    <section className="px-6 md:px-12 lg:px-20 mt-20 mb-20">
      <div className="bg-slate-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden border border-slate-700 shadow-2xl">
        <div className="absolute -right-20 -top-20 opacity-5 rotate-12 pointer-events-none">
          {/* <span className="material-symbols-outlined text-[300px] text-white">filter_vintage</span> */}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Bạn đã sẵn sàng chinh phục JLPT?</h2>
          <p className="text-slate-300">Đăng ký ngay hôm nay để nhận ưu đãi 30% cho khóa học Premium đầu tiên.</p>
        </div>
        
        <div className="relative z-10 flex gap-4 w-full md:w-auto">
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all w-full md:w-auto whitespace-nowrap shadow-lg shadow-blue-500/30">
            Đăng ký tư vấn
          </button>
        </div>
      </div>
    </section>
  )
}

export default CTA