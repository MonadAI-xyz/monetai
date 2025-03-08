"use client";

import Link from 'next/link';
import React from 'react';

import { ConnectWalletButton } from './wallet';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
// import { Separator } from '@/components/ui/separator';
// import {
//   SidebarTrigger,
// } from '@/components/ui/sidebar';

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
    href: '#',
  },
  {
    title: 'Lending',
    href: '#',
  },
];

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="w-full flex items-center gap-2 px-4">
        {/* <SidebarTrigger className="-ml-1" />
        <Separator
          className="mr-2 data-[orientation=vertical]:h-4"
          orientation="vertical"
        /> */}
        <NavigationMenu>
          <NavigationMenuList>
            {menuItems.map((item, index) => (
              <NavigationMenuItem key={index}>
                <Link legacyBehavior passHref href={item.href}>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {item.title}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className='ml-auto'>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  )
}
