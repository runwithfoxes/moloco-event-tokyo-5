import { EmailPreview } from '../preview';

export default async function Page({ searchParams }: { searchParams: Promise<{ name?: string; email?: string; company?: string }> }) {
  const params = await searchParams;
  return <EmailPreview filename="02-agenda-7days.html" title="7-Day Reminder" searchParams={params} />;
}
