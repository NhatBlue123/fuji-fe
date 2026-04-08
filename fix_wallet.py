import re

with open('src/app/(user)/profile/wallet/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Chunk 1
c1_target = """        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Wallet Card - Đổi gradient nền sang tông hồng/purle mờ */}
          <Card className="lg:col-span-8 overflow-hidden border-none bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0a0c10] text-white relative shadow-2xl rounded-[2.5rem]">
            {/* Đổi Glow hồng */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Wallet Card - Đổi gradient nền sang tông hồng/purle mờ */}
        <Card className="lg:col-span-8 overflow-hidden border-none bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0a0c10] text-white relative shadow-2xl rounded-[2.5rem]">
          {/* Đổi Glow hồng */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />"""

c1_rep = """        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Wallet Card - Đổi gradient nền sang tông hồng/purle mờ */}
          <Card className="lg:col-span-8 overflow-hidden border-none bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0a0c10] text-white relative shadow-2xl rounded-[2.5rem]">
            {/* Đổi Glow hồng */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />"""

content = content.replace(c1_target, c1_rep)

# Chunk 2
c2_target = """              </div>

        {/* Side Stats */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card Thống kê - Chủ đạo Hồng mờ */}
          <Card className="border-pink-500/20 bg-pink-500/5 dark:bg-pink-500/5 shadow-xl shadow-pink-500/5 group overflow-hidden h-[180px] relative transition-all hover:-translate-y-1 hover:border-pink-500/30 rounded-[2rem]">
            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-pink-500/10 -rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            <CardHeader className="pb-2">
              <CardDescription className="text-pink-500/70 font-black uppercase tracking-[0.2em] text-[10px]">Giao dịch tháng này</CardDescription>
              <CardTitle className="text-5xl font-black text-pink-500 dark:text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">{historyData?.totalElements || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-pink-500 dark:text-pink-400 font-bold text-[10px] uppercase tracking-wider bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-full shadow-inner animate-pulse">
                <ArrowUpRight size={14} /> +12.5% vs tháng trước
              </div>
            </CardContent>
          </Card>

          {/* Side Stats */}
          <div className="lg:col-span-4 space-y-4">"""

c2_rep = """              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Stats */}
        <div className="lg:col-span-4 space-y-4">"""

content = content.replace(c2_target, c2_rep)

# Chunk 3
c3_target = """              </div>
            </div>
          </div>
        </CardHeader>"""

c3_rep = """              </div>
            </div>
        </CardHeader>"""

content = content.replace(c3_target, c3_rep)

# Chunk 4 - Regex replacement
pattern = re.compile(r'<TableBody>\s*\{transactions\.map\(\(tx: Transaction\) => \(\s*<TableRow key=\{tx\.id\} className="hover:bg-muted/20.*?</TableRow>\s*</TableHeader>\s*<TableBody>', re.DOTALL)

content = pattern.sub('<TableBody>', content)

with open('src/app/(user)/profile/wallet/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
