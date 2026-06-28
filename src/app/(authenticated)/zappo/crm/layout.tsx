'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@lib/utils/cn';

const tabs = [
  { href: '/zappo/crm/leads', label: 'Leads' },
  { href: '/zappo/crm/vendors', label: 'Vendors' },
  { href: '/zappo/crm/meetings', label: 'Meetings' },
  { href: '/zappo/crm/plans', label: 'Plans' },
  { href: '/zappo/crm/documents', label: 'Documents' },
  { href: '/zappo/crm/users', label: 'Users' },
];

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <div className="border-b border-border px-6">
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                pathname?.startsWith(t.href)
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}