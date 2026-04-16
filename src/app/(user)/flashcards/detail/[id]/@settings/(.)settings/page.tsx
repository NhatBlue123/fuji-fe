"use client";

import { useTranslation } from "react-i18next";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import FlashcardSettings from "@/components/user-component/flashcard/FlashcardSettings";

export default function FlashcardSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();

  return (
    <Dialog open={true} onOpenChange={() => router.back()}>
      <DialogContent className="max-w-6xl w-full h-[85vh] p-0 flex flex-col overflow-hidden bg-[#0B1120] border-white/10 [&>button]:hidden">
        <DialogTitle className="sr-only">
          {t("auto.___settings_page_1")}
        </DialogTitle>
        <FlashcardSettings
          id={id}
          isModal={true}
          onClose={() => router.back()}
        />
      </DialogContent>
    </Dialog>
  );
}
