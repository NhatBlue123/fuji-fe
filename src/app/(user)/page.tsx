import { HeroSection } from "@/components/user-component/home/HeroSection";
import { StatsSection } from "@/components/user-component/home/StatsSection";
import { CoursesSection } from "@/components/user-component/home/CoursesSection";
import { FlashcardsSection } from "@/components/user-component/home/FlashcardsSection";
import { JLPTSection } from "@/components/user-component/home/JLPTSection";
import { VoiceChatSection } from "@/components/user-component/home/VoiceChatSection";
import { LearningPathSection } from "@/components/user-component/home/LearningPathSection";
import { CommunitySection } from "@/components/user-component/home/CommunitySection";
import { CTASection } from "@/components/user-component/home/CTASection";

// ✅ Server Component - Static render, no loading needed
export default function HomePage() {
  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth bg-background dark:bg-[#0f172a]">
      <div className="max-w-7xl mx-auto w-full">
        <HeroSection />
        <StatsSection />
        <CoursesSection />
        <FlashcardsSection />
        <JLPTSection />
        <VoiceChatSection />
        <LearningPathSection />
        <CommunitySection />
        <CTASection />
      </div>
    </div>
  );
}
