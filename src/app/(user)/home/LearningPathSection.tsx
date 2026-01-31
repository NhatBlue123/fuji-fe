const LearningPathSection = () => {
  const steps = [
    {
      status: 'completed',
      icon: 'check',
      title: 'Bảng chữ cái & Chào hỏi',
      description: 'Đã hoàn thành',
      color: 'blue'
    },
    {
      status: 'current',
      icon: 'play_arrow',
      title: 'Ngữ pháp N5 - Bài 12',
      description: 'Hạn hoàn thành: Hôm nay',
      color: 'secondary'
    },
    {
      status: 'next',
      number: '3',
      title: 'Kanji N5: Số đếm',
      description: 'Tiếp theo',
      color: 'gray'
    },
    {
      status: 'upcoming',
      number: '4',
      title: 'Hội thoại tại nhà hàng',
      description: 'Sắp tới',
      color: 'gray'
    }
  ]

  return (
    <section className="px-6 md:px-12 lg:px-20 " style={{marginTop:"20px"}}>
      <div className="mb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-500">timeline</span>
          Lộ trình học cá nhân hóa
        </h2>
        <p className="text-slate-400 " style={{margin:"20px"}}>Dựa trên mục tiêu JLPT N3 tháng 12/2024 của bạn</p>
      </div>

      <div className="bg-card-bg border border-slate-700/50 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 z-10">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-700 -z-10 transform -translate-y-1/2 rounded-full"></div>
          <div className="hidden md:block absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400 -z-10 transform -translate-y-1/2 rounded-full shadow-[0_0_15px_#3b82f6]" style={{ width: '40%' }}></div>

          {steps.map((step, index) => (
            <div key={index} className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto opacity-100">
              <div className="relative">
                {step.status === 'completed' && (
                  <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/50 z-20">
                    <span className="material-symbols-outlined text-sm">{step.icon}</span>
                  </div>
                )}
                {step.status === 'current' && (
                  <div className="size-12 rounded-full bg-card-bg border-4 border-blue-500 flex items-center justify-center text-blue-400 shadow-[0_0_20px_#3b82f6] z-20">
                    <span className="material-symbols-outlined">{step.icon}</span>
                  </div>
                )}
                {(step.status === 'next' || step.status === 'upcoming') && (
                  <div className="size-10 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-slate-400 z-20">
                    <span className="text-xs font-bold">{step.number}</span>
                  </div>
                )}
                <div className="md:hidden absolute top-10 left-1/2 w-0.5 h-full bg-slate-700 -ml-[1px]"></div>
              </div>
              
              <div className="text-left md:text-center">
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                  step.status === 'completed' ? 'text-blue-400' :
                  step.status === 'current' ? 'text-secondary animate-pulse' :
                  'text-slate-500'
                }`}>
                  {step.description}
                </p>
                <p className={`font-bold ${
                  step.status === 'completed' ? 'text-white text-sm' :
                  step.status === 'current' ? 'text-white text-lg' :
                  'text-slate-200 text-sm'
                }`}>
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LearningPathSection