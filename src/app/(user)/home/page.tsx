import HeroSection from "./HeroSection";
import StatsSection from "./StatsSection";
import CoursesSection from "./CoursesSection";
import FlashCard from "./FlashCard";
import JLPTSection from "./JLPTSection";
import VoiceChatSection from "./VoiceChatSection";
import LearningPathSection from "./LearningPathSection";
import CommunitySection from "./CommunitySection";
import CTASection from "./CTASection";
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <CoursesSection />
      <FlashCard/>
      <JLPTSection />
      <VoiceChatSection />
      <LearningPathSection />
      <CommunitySection />
      <CTASection />
    </>
  );
}
