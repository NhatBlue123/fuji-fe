export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-fade-in">
            FUJI
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground font-medium">
            富士 - Your Gateway to Japanese
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Start Learning
          </button>
          <button className="px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors">
            View Demo
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
        <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-bold mb-2">Vocabulary</h3>
          <p className="text-muted-foreground">
            Learn essential Japanese words with spaced repetition
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">✍️</div>
          <h3 className="text-xl font-bold mb-2">Writing Practice</h3>
          <p className="text-muted-foreground">
            Master Hiragana, Katakana, and Kanji writing
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-bold mb-2">Grammar</h3>
          <p className="text-muted-foreground">
            Understand Japanese grammar through interactive lessons
          </p>
        </div>
      </div>

      {/* Test Info Box */}
      <div className="mt-24 p-8 rounded-xl bg-muted border border-border">
        <h2 className="text-2xl font-bold mb-4">🧪 Next.js Test Page</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>✅ Next.js 16.1.1 - Running</p>
          <p>✅ React 19.2.3 - Rendering</p>
          <p>✅ Tailwind CSS v4 - Styling</p>
          <p>✅ TypeScript - Type checking</p>
          <p>✅ App Router - Active</p>
        </div>
      </div>
    </div>
  );
}
