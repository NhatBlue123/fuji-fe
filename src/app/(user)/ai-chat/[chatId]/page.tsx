import AIChatShell from "@/components/user-component/ai/AIChatShell";

type PageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

function parseConversationId(chatId: string) {
  const parsed = Number(chatId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function AIChatConversationPage({ params }: PageProps) {
  const { chatId } = await params;
  const initialConversationId = parseConversationId(chatId);

  return (
    <AIChatShell
      initialConversationId={initialConversationId}
      forceNewDraft={!initialConversationId}
    />
  );
}
