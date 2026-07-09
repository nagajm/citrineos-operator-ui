// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Logo } from '@lib/client/components/title';
import { cn } from '@lib/utils/cn';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  EvCharger,
  Handshake,
  HelpCircle,
  Home,
  MapPin,
  Receipt,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@lib/client/components/ui/button';
import { sidebarIconSize } from '@lib/client/styles/icon';
import { ThemeToggle } from '@lib/client/components/theme-toggle';
import { LogoutButton } from '@lib/client/components/logout-button';
import { useTranslate } from '@refinedev/core';
import { Permission, roleHasPermission } from '@lib/utils/admin-permissions';

export enum MenuSection {
  OVERVIEW = 'overview',
  LOCATIONS = 'locations',
  CHARGING_STATIONS = 'charging-stations',
  AUTHORIZATIONS = 'authorizations',
  TRANSACTIONS = 'transactions',
  TARIFFS = 'tariffs',
  PARTNERS = 'partners',
  ZAPPO_OPERATORS = 'zappo/operators',
  ZAPPO_CRM = 'zappo/crm',
  ZAPPO_USERS = 'zappo/users',
}

export interface MainMenuProps {
  activeSection: MenuSection;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  // Omit for core CitrineOS pages that predate the permission system (Locations,
  // Charging Stations, Transactions, Tariffs, Partners) — those stay visible to
  // everyone logged in. Only the newer Zappo-specific areas are gated, so a role
  // never sees a nav item that just leads to a 403 from the API.
  permission?: Permission;
}

export const MainMenu = ({ activeSection }: MainMenuProps) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const menuRef = useRef<HTMLElement>(null);
  const translate = useTranslate();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mainMenuItems: MenuItem[] = [
    {
      key: `/${MenuSection.OVERVIEW}`,
      label: translate('menu.overview'),
      icon: <Home className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.LOCATIONS}`,
      label: translate('Locations.Locations'),
      icon: <MapPin className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.CHARGING_STATIONS}`,
      label: translate('ChargingStations.ChargingStations'),
      icon: <EvCharger className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.AUTHORIZATIONS}`,
      label: translate('Authorizations.Authorizations'),
      icon: <Clipboard className={sidebarIconSize} />,
      permission: Permission.AuthorizationsManage,
    },
    {
      key: `/${MenuSection.TRANSACTIONS}`,
      label: translate('Transactions.Transactions'),
      icon: <ArrowLeftRight className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.TARIFFS}`,
      label: translate('Tariffs.Tariffs'),
      icon: <Receipt className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.PARTNERS}`,
      label: translate('TenantPartners.TenantPartners'),
      icon: <Handshake className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.ZAPPO_OPERATORS}`,
      label: 'Operators',
      icon: <UserCog className={sidebarIconSize} />,
      permission: Permission.OperatorsManage,
    },
    {
      key: `/${MenuSection.ZAPPO_CRM}`,
      label: 'CRM',
      icon: <Users className={sidebarIconSize} />,
      permission: Permission.CrmManage,
    },
    {
      key: `/${MenuSection.ZAPPO_USERS}`,
      label: 'Users',
      icon: <ShieldCheck className={sidebarIconSize} />,
      permission: Permission.UsersManage,
    },
  ].filter((item) => !item.permission || roleHasPermission(role, item.permission));

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-card transition-all duration-300 z-40 flex flex-col shadow-md',
          collapsed ? 'w-20' : 'w-[272px]',
        )}
        ref={menuRef}
      >
        {/* Logo Section */}
        <div className="min-h-[130px] flex items-center justify-center px-4">
          <Logo collapsed={collapsed} />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-1 px-3">
            {mainMenuItems.map((item) => {
              const isActive = pathname ? pathname.startsWith(item.key) : `/${activeSection}` === item.key;
              return (
                <li key={item.key}>
                  <Link
                    href={item.key}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sm',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground',
                      collapsed && 'justify-center px-2',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Menu - Help Link */}
        <div className="border-t border-border p-3 flex flex-col gap-2 items-center">
          <ThemeToggle expanded={!collapsed} />
          <Link
            href="/help"
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors',
              'hover:bg-accent hover:text-accent-foreground text-muted-foreground',
              pathname?.startsWith('/help') && 'bg-accent text-accent-foreground font-medium',
              collapsed && 'justify-center px-2',
            )}
            title="Help"
          >
            <HelpCircle className={sidebarIconSize} />
            {!collapsed && <span>{translate('menu.help')}</span>}
          </Link>
          <LogoutButton expanded={!collapsed} />
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="link"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-0 right-0 transform translate-x-1/2 translate-y-[110px] size-8 bg-card text-accent-foreground border-transparent rounded-full shadow-md"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className={sidebarIconSize} />
          ) : (
            <ChevronLeft className={sidebarIconSize} />
          )}
        </Button>
      </aside>
    </>
  );
};
