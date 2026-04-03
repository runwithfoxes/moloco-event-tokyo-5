import { EmailPreview } from '../preview';

export default async function Page({ searchParams }: { searchParams: Promise<{ name?: string; email?: string; company?: string }> }) {
  const params = await searchParams;
  return <EmailPreview filename="05-post-event-attended.html" title="Post-Event (Attended)" searchParams={params} />;
}
