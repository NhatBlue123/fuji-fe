import type { Metadata } from "next";
import { fetchPublicFlashcard } from "@/lib/publicFlashcardApi";
import {
  buildFlashcardDetailHref,
  buildFlashcardSlug,
  extractTrailingId,
} from "@/lib/flashcardSeo";

const BASE_URL = "https://fuji.io.vn";
const DEFAULT_OG_IMAGE = "/images/og-image.jpg";

export const revalidate = 3600;

interface LayoutProps {
  children: React.ReactNode;
  settings: React.ReactNode;
  params: Promise<{ slug: string }>;
}

function resolvePublicImageUrl(url: string | null | undefined) {
  if (!url) return `${BASE_URL}${DEFAULT_OG_IMAGE}`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const flashcard = await fetchPublicFlashcard(extractTrailingId(slug));

  if (!flashcard) {
    return {
      title: "Từ vựng tiếng Nhật | FUJI",
      robots: { index: false, follow: false },
    };
  }

  const level = flashcard.level ? ` ${flashcard.level}` : "";
  const title = `Từ vựng${level}: ${flashcard.name} | FUJI`;
  const description =
    flashcard.description?.slice(0, 160) ||
    `Học bộ từ vựng tiếng Nhật${level} ${flashcard.name} với flashcard, luyện ghi nhớ và bài tập trên FUJI.`;
  const canonical = `${BASE_URL}${buildFlashcardDetailHref(flashcard)}`;
  const ogImage = {
    url: resolvePublicImageUrl(flashcard.thumbnailUrl),
    width: 1200,
    height: 630,
    alt: flashcard.name,
  };

  return {
    title: title.length > 60 ? `${title.slice(0, 57)}...` : title,
    description,
    keywords: [
      `tu vung ${flashcard.level ?? "tieng nhat"}`,
      `từ vựng ${flashcard.level ?? "tiếng Nhật"}`,
      flashcard.name,
      "flashcard tiếng Nhật",
      "học từ vựng tiếng Nhật",
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: "vi_VN",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export async function generateStaticParams() {
  const flashcards = await import("@/lib/publicFlashcardApi").then((mod) =>
    mod.fetchPublicFlashcards({ limit: 1000 }),
  );

  return flashcards.map((flashcard) => ({
    slug: buildFlashcardSlug(flashcard),
  }));
}

export default function Layout({
  children,
  settings,
  params,
}: LayoutProps) {
  void params;
  return (
    <>
      <FlashcardJsonLd params={params} />
      {children}
      {settings}
    </>
  );
}

async function FlashcardJsonLd({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const flashcard = await fetchPublicFlashcard(extractTrailingId(slug));
  if (!flashcard) return null;

  const canonical = `${BASE_URL}${buildFlashcardDetailHref(flashcard)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: flashcard.name,
    description:
      flashcard.description ||
      `Bộ từ vựng tiếng Nhật ${flashcard.level ?? ""} trên FUJI`,
    url: canonical,
    inLanguage: ["vi", "ja"],
    educationalLevel: flashcard.level,
    learningResourceType: "Flashcard",
    keywords: `tu-vung-${String(flashcard.level ?? "tieng-nhat").toLowerCase()}, ${buildFlashcardSlug(flashcard)}`,
    provider: {
      "@type": "EducationalOrganization",
      name: "FUJI",
      url: BASE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
