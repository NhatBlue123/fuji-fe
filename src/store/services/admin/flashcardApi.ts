
// src/store/services/flashcardApi.ts
import api from "@/lib/api";
import {
  CreateFlashcardPayload,
  buildFlashcardFormData,
} from "@/types/flashcard";

export const createFlashcard = async (
  payload: CreateFlashcardPayload,
  thumbnail?: File
) => {
  const formData = buildFlashcardFormData(payload, thumbnail);

  const res = await api.post("/flashcards", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.data; // ApiResponse<T>
};

export const importFlashcards = async (file: File, lesson: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lesson", lesson);

  const res = await api.post("/flashcards/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
