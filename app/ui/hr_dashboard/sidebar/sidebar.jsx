import React from 'react';
import MenuLinks from "./menuLinks/menuLinks";
import styles from "./sidebar.module.css";
import { auth, signOut } from "@/app/auth";
import { ROLES } from '@/app/lib/role';
import { FileChartColumn, LayoutDashboard, LogOut, UsersRound } from 'lucide-react';

const menuItems = [
  {
    title: "Pages",
    list: [
      { 
        title: "Dashboard", 
        path: "/dashboard", 
        icon: <LayoutDashboard />,
        roles: [ROLES.ADMIN] 
      },
      { 
        title: "HR_Dashboard", 
        path: "/hr_dashboard", 
        icon: <LayoutDashboard />,
        roles: [ROLES.HR_ADMIN] 
      },
      
      { 
        title: "Employees", 
        path: "/hr_dashboard/employees", 
        icon: <UsersRound />,
        roles: [ROLES.HR_ADMIN,ROLES.ADMIN] 
      },
  
    ],
  },
  {
    title: "Analytics",
    list: [
      { 
        title: "Reports", 
        path: "/dashboard/reports", 
        icon: <FileChartColumn />, 
        roles: [ROLES.HR_ADMIN] 
      },
    ],
  },
];

const Sidebar = async () => {
  const { user } = await auth();

  const userRole = user?.role || ROLES.USER;

  const filteredMenuItems = menuItems.map(category => ({
    title: category.title,
    list: category.list.filter(item => {
      const hasAccess = !item.roles || item.roles.includes(userRole);
      return hasAccess;
    })
  })).filter(category => category.list.length > 0);

  return (
    <div className={styles.container}>
      <div className={styles.user}> 
        <img 
          src={user.img || "/noavatar.png"} 
          alt="" 
          width='50' 
          height='50' 
          className={styles.userImage} 
        />
        <div className={styles.userDetail}>
        <span className={styles.username} title={user.username}>{user.username}</span>
        <span className={styles.userTitle}>{userRole}</span>
        </div>
      </div>
      
      <ul className={styles.list}>
        {filteredMenuItems.map(category => (
          <li key={category.title}>
            <span className={styles.cat}>{category.title}</span>
            {category.list.map(item => (
              <MenuLinks item={item} key={item.title} />
            ))}
          </li>
        ))}
      </ul>
      <form action={async () => {
        "use server"
        await signOut();
      }}>
        <button className={styles.logout}><LogOut /> Logout</button>
      </form>
    </div>
  );
};

export default Sidebar;