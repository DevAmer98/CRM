"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Projects", href: "/dashboard/navPages/projects" },
  { label: "Clients", href: "/dashboard/navPages/clients" },
  { label: "HR", href: "/dashboard/navPages/HR_page" },
  { label: "Tickets", href: "/dashboard/navPages/tickets" },
  { label: "Tasks", href: "/dashboard/navPages/tasks" },
  { label: "Finance", href: "/dashboard/navPages/finance" },
];

export default function HeaderNavigation() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState(null);


  return (
<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem className="h-full">
      <NavigationMenuLink asChild>
        <Link 
          href='/dashboard'
          className="flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-500 transform hover:scale-105 text-cyan-400 shadow-lg shadow-cyan-400/20"
        >
          Overview 
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
    
    <NavigationMenuItem className="h-full">
      <NavigationMenuLink asChild>
        <Link 
          href='/dashboard/navPages/projects'
          className="flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-500 transform hover:scale-105 text-cyan-400 shadow-lg shadow-cyan-400/20"
        >
          Projects 
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
    
    <NavigationMenuItem className="h-full">
      <NavigationMenuLink asChild>
        <Link 
          href='/dashboard/navPages/clients'
          className="flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-500 transform hover:scale-105 text-cyan-400 shadow-lg shadow-cyan-400/20"
        >
          Clients 
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
    
    <NavigationMenuItem className="h-full">
      <NavigationMenuLink asChild>
        <Link 
          href='/dashboard/navPages/HR_page'
          className="flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-500 transform hover:scale-105 text-cyan-400 shadow-lg shadow-cyan-400/20"
        >
          HR 
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
    
    <NavigationMenuItem className="h-full">
      <NavigationMenuLink asChild>
        <Link 
          href='/dashboard/navPages/tickets'
          className="flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-500 transform hover:scale-105 text-cyan-400 shadow-lg shadow-cyan-400/20"
        >
          Tickets 
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>

     <NavigationMenuItem className="h-full">
      <NavigationMenuLink asChild>
        <Link 
          href='/dashboard/navPages/tasks'
          className="flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-500 transform hover:scale-105 text-cyan-400 shadow-lg shadow-cyan-400/20"
        >
          Tasks 
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
    
    <NavigationMenuItem className="h-full">
      <NavigationMenuLink asChild>
        <Link 
          href='/dashboard/navPages/finance'
          className="flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-500 transform hover:scale-105 text-cyan-400 shadow-lg shadow-cyan-400/20"
        >
          Finance 
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
  );
}