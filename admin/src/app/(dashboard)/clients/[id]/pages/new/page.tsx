import { redirect } from 'next/navigation';

// Redirect /clients/[id]/pages/new → /clients/[id]/pages/_new
// The actual editor lives at [pageId] and treats "_new" as the create flow.
// We use a server redirect so the URL stays clean.
export default async function NewPageRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/clients/${id}/pages/_new`);
}
