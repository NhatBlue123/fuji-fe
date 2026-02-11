// Mock thumbnail images for flashcards/flashlists without thumbnails.
// Each time a card/list has no thumbnail, a random image from this pool is shown.

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f8?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=400&h=300&fit=crop",
];

// Stable random based on id so the same item always shows the same fallback image
export function getMockImage(id: number | string): string {
  const numericId = typeof id === "string" ? parseInt(id, 10) || 0 : id;
  return MOCK_IMAGES[Math.abs(numericId) % MOCK_IMAGES.length];
}

// Fully random (changes each render)
export function getRandomMockImage(): string {
  return MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)];
}

export { MOCK_IMAGES };
