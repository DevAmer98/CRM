import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function NavigationMenu({ className, children, viewport = true, ...props }) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(

        "group/navigation-menu relative flex items-center justify-start px-4 py-2 gap-2 w-full max-w-screen-xl mx-auto",
        "bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-md)]",
        "backdrop-blur-sm transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({ className, ...props }) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
"group flex list-none items-center gap-3 px-2",
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuItem({ className, ...props }) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  );
}

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-12 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 " +
    "bg-transparent text-[var(--text)] " +
    "hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] hover:shadow-[var(--shadow-sm)] " +
    "focus:bg-[var(--primary)]/10 focus:text-[var(--primary)] focus:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "data-[state=open]:bg-[var(--primary)]/15 data-[state=open]:text-[var(--primary)] " +
    "data-[state=open]:shadow-[var(--shadow-sm)] " +
    "active:scale-95 select-none"
);

function NavigationMenuTrigger({ className, children, ...props }) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {children}
      {/*<ChevronDownIcon
        className="relative top-[1px] ml-2 size-4 transition-transform duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />*/}
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({ className, ...props }) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "top-0 left-0 w-full p-4 md:absolute md:w-auto md:min-w-[400px]",
        "bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-lg)]",
        "backdrop-blur-sm",
        "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out",
        "data-[motion^=from-]:fade-in-0 data-[motion^=to-]:fade-out-0",
        "data-[motion^=from-]:zoom-in-95 data-[motion^=to-]:zoom-out-95",
        "data-[motion=from-end]:slide-in-from-right-52 data-[motion=to-end]:slide-out-to-right-52",
        "data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-start]:slide-out-to-left-52",
        "group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-2",
        "group-data-[viewport=false]/navigation-menu:overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuViewport({ className, ...props }) {
  return (
    <div className="absolute top-full left-0 isolate z-50 flex justify-center">
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "origin-top-center relative mt-2 overflow-hidden rounded-lg",
          "h-[var(--radix-navigation-menu-viewport-height)] w-full",
          "bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--shadow-lg)]",
          "backdrop-blur-sm",
          "data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0",
          "md:w-[var(--radix-navigation-menu-viewport-width)]",
          className
        )}
        {...props}
      />
    </div>
  );
}

function NavigationMenuLink({ className, ...props }) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "flex flex-col gap-2 rounded-md p-3 text-sm transition-all duration-200 outline-none group cursor-pointer",
        "hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]",
        "focus:bg-[var(--primary)]/10 focus:text-[var(--primary)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
        "data-[active=true]:bg-[var(--primary)]/15 data-[active=true]:text-[var(--primary)]",
        "active:scale-98 select-none",
        "[&_svg:not([class*='text-'])]:text-[var(--text-muted)] [&_svg:not([class*='size-'])]:size-5",
        "group-hover:[&_svg:not([class*='text-'])]:text-[var(--primary)]",
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuIndicator({ className, ...props }) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        "top-full z-[1] flex h-2 items-end justify-center overflow-hidden",
        "data-[state=visible]:animate-in data-[state=visible]:fade-in-0",
        "data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0",
        className
      )}
      {...props}
    >
      <div className="relative top-[70%] h-2 w-2 rotate-45 rounded-tl-sm bg-[var(--primary)] shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
}

// Additional professional component for enhanced navigation items
function NavigationMenuSection({ title, className, children, ...props }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {title && (
        <div className="px-3 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-light)]">
          {title}
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

// Professional navigation item with icon and description
function NavigationMenuItemWithIcon({ icon: Icon, title, description, className, ...props }) {
  return (
    <NavigationMenuLink className={cn("flex-row items-start gap-3", className)} {...props}>
      {Icon && <Icon className="size-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />}
      <div className="flex-1 space-y-1">
        <div className="font-medium text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
          {title}
        </div>
        {description && (
          <div className="text-xs text-[var(--text-muted)] leading-relaxed">
            {description}
          </div>
        )}
      </div>
    </NavigationMenuLink>
  );
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  NavigationMenuSection,
  NavigationMenuItemWithIcon,
  navigationMenuTriggerStyle,
};