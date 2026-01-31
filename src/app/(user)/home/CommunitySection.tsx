import { 
  MessageSquare, 
  ThumbsUp, 
  Lightbulb, 
  HelpCircle, 
} from 'lucide-react';
export default function CoursesSection(){
  const posts = [
    {
      type: 'Hỏi đáp N3',
      time: '2 giờ trước',
      title: 'Phân biệt ngữ pháp N3: について và に対して?',
      desc: 'Mọi người ơi, mình đang học N3 mà thấy hai cấu trúc này hơi dễ nhầm lẫn. Có ai có mẹo n...',
      likes: 24,
      comments: 8,
      icon: <HelpCircle className="text-purple-400" />,
      iconBg: 'bg-purple-500/10'
    },
    {
      type: 'Kinh nghiệm thi',
      time: '5 giờ trước',
      title: 'Review đề thi JLPT N2 tháng 7/2024',
      desc: 'Phần đọc hiểu năm nay khá dài nhưng từ vựng không quá khó. Mọi người chú ý phần ngữ...',
      likes: 156,
      comments: 42,
      icon: <Lightbulb className="text-emerald-400" />,
      iconBg: 'bg-emerald-500/10'
    }
  ];

  return (
    <section className="px-6 md:px-12 lg:px-20 mt-24 mb-6">
      <div className="flex justify-between items-end mb-8 mt-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="text-purple-500 w-8 h-8" />
            <h2 className="text-3xl font-bold">Cộng đồng học viên</h2>
          </div>
          <p className="text-gray-500">Thảo luận sôi nổi nhất hôm nay</p>
        </div>
        <button className="px-6 py-2 rounded-full border border-gray-700 text-sm font-medium hover:bg-white/5 transition-colors">
          Tham gia thảo luận
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post, i) => (
          <div key={i} className="bg-[#161b2e] p-8 border border-white/5 hover:border-white/10 transition-all cursor-pointer group" >
            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${post.iconBg}`}>
                {post.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${i === 0 ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {post.type}
                  </span>
                  <span className="text-gray-600 text-[10px]">• {post.time}</span>
                </div>
                <h3 className="text-lg font-bold mb-3 group-hover:text-blue-400 transition-colors">{post.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{post.desc}</p>
                
                <div className="flex items-center gap-6 text-gray-500 text-xs">
                  <div className="flex items-center gap-1.5"><ThumbsUp size={14} /> {post.likes}</div>
                  <div className="flex items-center gap-1.5"><MessageSquare size={14} /> {post.comments} trả lời</div>
                  {i === 0 && (
                    <div className="flex -space-x-2 ml-auto">
                      {[1, 2, 3].map(n => (
                        <div key={n} className="w-6 h-6 rounded-full border-2 border-[#161b2e] bg-gray-700" />
                      ))}
                      <span className="text-[10px] ml-4 self-center text-gray-600">3 người đang thảo luận</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};