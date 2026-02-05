export default function JLPTSection() {
  const levels = [
    {
      level: "N5",
      title: "Đề thi thử N5",
      count: "3 đề",
      time: "105 phút/đề",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      icon: "⏱️",
    },
    {
      level: "N4",
      title: "Đề thi thử N4",
      count: "5 đề",
      time: "125 phút/đề",
      color: "text-green-400",
      bg: "bg-green-500/10",
      icon: "📋",
    },
    {
      level: "N3",
      title: "Đề thi thử N3",
      count: "8 đề",
      time: "140 phút/đề",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      icon: "🧠",
    },
    {
      level: "N2",
      title: "Đề thi thử N2",
      count: "10 đề",
      time: "155 phút/đề",
      color: "text-red-400",
      bg: "bg-red-500/10",
      icon: "🏅",
    },
  ];

  return (
    <section className="bg-[#0B1120] py-16 px-6 lg:px-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-4">
            🚩 Luyện thi JLPT thực chiến
          </h2>
          <p className="text-slate-400 mt-2">
            Bộ đề thi sát với thực tế từ N5 đến N1
          </p>
        </div>

        <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold">
          Kho đề thi →
        </a>
      </div>

      {/* Cards - Horizontal */}
      <div
        className="
          flex gap-8 overflow-x-auto pb-4
          scrollbar-hide p-8
        " 
      >
        {levels.map((item, index) => (
          <div
            key={index}
            className="
              relative
              rounded-2xl p-8
              bg-slate-800/50 border border-slate-700
              backdrop-blur-xl
              transition-all duration-300
              hover:-translate-y-2 hover:shadow-xl
            "
          >
            {/* Background icon */}
            <div className="absolute top-4 right-4 text-4xl opacity-10">
              {item.icon}
            </div>

            {/* Level badge */}
            <div
              className={`w-12 h-12 flex items-center justify-center
              rounded-full font-bold text-lg mb-4
              ${item.bg} ${item.color}`}
            >
              {item.level}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-white mb-2">
              {item.title}
            </h3>

            {/* Info */}
            <p className="text-slate-400 text-xl mb-6">
              {item.count} • {item.time}
            </p>

            {/* Button */}
            <button
              className="
                w-full py-2 rounded-full
                border border-slate-600 text-white
                hover:bg-white/10 transition
              "
            >
              Làm bài ngay
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
