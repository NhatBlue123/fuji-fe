const StatsSection = () => {
  const stats = [
    {
      icon: 'groups',
      value: '10K+',
      label: 'Học viên',
      color: 'blue',
    },
    {
      icon: 'school',
      value: '500+',
      label: 'Khóa học',
      color: 'pink',
    },
    {
      icon: 'verified',
      value: '95%',
      label: 'Tỷ lệ đỗ JLPT',
      color: 'emerald',
    },
    {
      icon: 'cast_for_education',
      value: '50+',
      label: 'Giảng viên',
      color: 'purple',
    },
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/20'
      case 'pink':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/20'
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
      case 'purple':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/20'
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/20'
    }
  }

  return (
    <div className="px-8 md:px-12 lg:px-20 -mt-24 relative z-20">
      <div className="flex grid-rows-4 xl:flex-rows-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-6 rounded-2xl flex items-center gap-6 hover:bg-slate-800/60 transition-colors"
          >
            <div className={`size-32 rounded-full ${getColorClasses(stat.color)} flex items-center justify-center border`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-2xl font-medium text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatsSection