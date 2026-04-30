import FlashcardsPageClient from "@/components/user-component/flashcard/FlashcardsPageClient";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function FlashcardsPage() {
  return <FlashcardsPageClient />;
}
