"use client";
import { usePathname } from "next/navigation";
import styles from "./navbar.module.css";
import { Bell, CirclePlus, MessageCircle, MessageSquare, Power, Search } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();

  // Function to format the page name nicely
  const getCurrentPageName = () => {
    const pageName = pathname.split("/").pop();
    if (!pageName) return "Dashboard"; // Default for root path
    
    // Capitalize first letter and replace hyphens/underscores with spaces
    return pageName
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase());
  };





  return (
    <div className="flex items-center justify-between px-6 py-4  border-b border-gray-200">
    {/* Left: Page Title */}

    <div className="text-center text-xl font-semibold text-[var(--textSoft)] pb-4 border-b border-[var(--input-border)]/30">
      {getCurrentPageName()}
    </div> 

    {/* Right: Menu (Styled via CSS module) */}
    <div className={styles.menu}>
      <div className={styles.search}>
        <Search />
        <input
          type="text"
          placeholder="Search..."
          className={styles.input}
        />
      </div>
      <div className={styles.icons}>
        <CirclePlus />
        <MessageSquare />
        <Bell />
        <Power />
      </div>
    </div>
  </div>
  );
};

export default Navbar;