import { EmailPreview } from '../preview';

export default async function Page({ searchParams }: { searchParams: Promise<{ name?: string; email?: string; company?: string }> }) {
  const params = await searchParams;
  return <EmailPreview filename="06-post-event-noshow.html" title="Post-Event (No-Show)" searchParams={params} />;
}
