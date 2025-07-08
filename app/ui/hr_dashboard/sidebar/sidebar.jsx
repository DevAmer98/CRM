"use client"; 
import React from 'react';
import MenuLinks from "./menuLinks/menuLinks";
import styles from "./sidebar.module.css";
import { signOut } from "next-auth/react";
import { ROLES } from '@/app/lib/role';
import { BadgePlus, BriefcaseBusiness, Building2, CalendarCheck, CalendarClock, CalendarHeart, Clock, FileChartColumn, LayoutDashboard, LogOut, Sparkles, UsersRound } from 'lucide-react';


const menuItems = [
  {
    title: "Pages",
    list: [
          {
       title: "Dashboard", 
       icon: <LayoutDashboard />,
       roles: [ROLES.HR_ADMIN],
       children: [
         {
           title: "Private Dahboard", 
           path: "/hr_dashboard/private",
       roles: [ROLES.HR_ADMIN],
         },
         {
           title: "Advanced Dahboard",
           path: "/hr_dashboard",
           roles: [ROLES.HR_ADMIN]
         },
       ],
     },
      { 
        title: "Employees", 
        path: "/hr_dashboard/employees", 
        icon: <UsersRound />,
        roles: [ROLES.HR_ADMIN, ROLES.ADMIN] 
      },
       { 
        title: "Shift Roster",
        path: "/hr_dashboard/shifts",
        icon: < CalendarClock/>,
        roles: [ROLES.HR_ADMIN]
      },
      { 
        title: "Leave Requests",
        path: "/hr_dashboard/leaves",
        icon: <CalendarCheck />,
        roles: [ROLES.HR_ADMIN]
      },
      
      { 
        title: "Attendance",
        path: "/",
        icon: <Clock />,
        roles: [ROLES.HR_ADMIN]
      },
      
      { 
        title: "Department",
        path: "/",
        icon: <Building2 />,
        roles: [ROLES.HR_ADMIN]
      },
      { 
        title: "Appreciation",
        path: "/",
        icon: <Sparkles />,
        roles: [ROLES.HR_ADMIN]
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

const Sidebar = ({ session }) => {
  const user = session?.user;
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
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className={styles.logout}
      >
        <LogOut /> Logout
      </button>
    </div>
  );
};

export default Sidebar;