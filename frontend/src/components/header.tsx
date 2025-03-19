"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { ConnectWalletButton } from './wallet';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';

interface INavigationMenuItem {
  title: string;
  href: string;
}

// Navigation menu items
const menuItems: INavigationMenuItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Trading',
    href: '/trading',
  },
  {
    title: 'Lending',
    href: '/lending',
  },
  {
    title: 'DAO Governance',
    href: '/dao-governance',
  },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="w-full flex items-center gap-2 px-4">
        <NavigationMenu>
          <NavigationMenuList>
            {menuItems.map((item, index) => {
              const isActive = item.href === pathname;

              return (
                <NavigationMenuItem key={index}>
                  <NavigationMenuLink
                    asChild
                    active={isActive}
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href={item.href}>
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>
        <div className='ml-auto'>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  )
}
