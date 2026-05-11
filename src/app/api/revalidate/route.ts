import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-Demand Revalidation API
 * 
 * Frontend-only ISR revalidation endpoint.
 * Called after course/flashcard mutations to refresh ISR pages.
 * 
 * Usage:
 * POST /api/revalidate
 * Body: { type: "course", action: "create|update|delete", id?: number }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, action, id } = body;

    switch (type) {
      case "course":
        await handleCourseRevalidation(action, id);
        break;
      
      case "flashcard":
        await handleFlashcardRevalidation(action, id);
        break;
      
      default:
        return NextResponse.json(
          { error: "Invalid type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Revalidated ${type} ${action}`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[Revalidate] Error:", error);
    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 }
    );
  }
}

async function handleCourseRevalidation(action: string, id?: number) {
  switch (action) {
    case "create":
    case "delete":
      // Revalidate course list page
      revalidatePath("/course");
      break;

    case "update":
      if (id) {
        // Revalidate specific course detail page
        revalidatePath(`/course/[slug]`, "page");
        revalidatePath("/course");
      }
      break;

    case "publish":
    case "unpublish":
      // Revalidate both list and detail
      revalidatePath("/course");
      revalidatePath(`/course/[slug]`, "page");
      break;

    default:
      console.warn(`[Revalidate] Unknown action: ${action}`);
  }
}

async function handleFlashcardRevalidation(action: string, id?: number) {
  switch (action) {
    case "create":
    case "delete":
    case "update":
      // Revalidate flashcard list page
      revalidatePath("/flashcards");
      break;

    default:
      console.warn(`[Revalidate] Unknown action: ${action}`);
  }
}
