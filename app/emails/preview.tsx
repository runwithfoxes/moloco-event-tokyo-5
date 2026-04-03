import { readFileSync } from 'fs';
import { join } from 'path';

export function EmailPreview({
  filename,
  title,
  searchParams
}: {
  filename: string;
  title: string;
  searchParams: { name?: string; email?: string; company?: string };
}) {
  const name = searchParams.name || 'Paul';
  const email = searchParams.email || 'paul.dervan@moloco.com';
  const company = searchParams.company || 'Moloco';

  let html = readFileSync(join(process.cwd(), 'emails', filename), 'utf-8');

  // Replace HubSpot personalisation tokens
  html = html.replace(/\{\{contact\.firstname\}\}/g, name);
  html = html.replace(/\{\{contact\.email\}\}/g, email);
  html = html.replace(/\{\{contact\.company\}\}/g, company);
  html = html.replace(/\{\{unsubscribe_link\}\}/g, '#');

  return (
    <div>
      {/* Preview bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: '#1a1a2e',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#60E2B7', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '1.5px' }}>Email preview</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{title}</span>
        </div>
        <a href="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textDecoration: 'none' }}>← Back to system</a>
      </div>
      {/* Email content */}
      <div style={{ paddingTop: '44px' }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
