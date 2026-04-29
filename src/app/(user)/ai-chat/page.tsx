import AIChatShell from "@/components/user-component/ai/AIChatShell";
import AuthGuard from "@/components/auth/AuthGuard";

type ResolvedSearchParams = {
  new?: string | string[];
};

type PageProps = {
  searchParams?: Promise<ResolvedSearchParams>;
};

function isForceNewDraft(searchParams?: ResolvedSearchParams) {
  const raw = searchParams?.new;
  if (Array.isArray(raw)) {
    return raw.includes("1") || raw.includes("true");
  }
  return raw === "1" || raw === "true";
}

export default async function AIChatPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return (
    <AuthGuard redirectTo="/login?redirect=/ai-chat">
      <AIChatShell forceNewDraft={isForceNewDraft(resolvedSearchParams)} />
    </AuthGuard>
  );
}
