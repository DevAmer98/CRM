"use client"; 
import React from 'react';
import MenuLinks from "./menuLinks/menuLinks";
import styles from "./sidebar.module.css";
import { signOut } from "next-auth/react";
import { ROLES } from '@/app/lib/role';
import { BriefcaseBusiness, Check, CircleUserRound, DollarSign, FileBadge, FileBox, FileCheck, FileClock, Handshake, LayoutDashboard, ListChecks, LogOut, PackageCheck, ShieldCheck, Shuffle, TicketCheck, UsersRound } from 'lucide-react';

const menuItems = [
  {
    title: "Pages",
    list: [
     {
  title: "Dashboard",
  icon: <LayoutDashboard />,
  roles: [ROLES.ADMIN,ROLES.SALES_ADMIN,ROLES.DASHBOARD_ADMIN,ROLES.USER_PROCUREMENT,ROLES.SALES_USER],
  children: [
    {
      title: "Private Dahboard",
      path: "/dashboard/private",
  roles: [ROLES.ADMIN,ROLES.SALES_ADMIN,ROLES.DASHBOARD_ADMIN,ROLES.USER_PROCUREMENT,ROLES.SALES_USER],
    },
    {
      title: "Advanced Dahboard",
      path: "/dashboard",
      roles: [ROLES.ADMIN]
    },
  ],
},
      {
        title: "HR", 
        path: "/hr_dashboard", 
        icon: <LayoutDashboard /> ,
        roles: [ROLES.ADMIN ,ROLES.HR_ADMIN],
         children: [
         
    {
     title: "Employees", 
      path: "/dashboard/employees", 
      roles: [ROLES.ADMIN]
    },
    { 
        title: "Leave Requests",
      path: "/dashboard/leaves",
      roles: [ROLES.ADMIN]
    },
     {
      title: "Attendance",
      path: "/",
      roles: [ROLES.ADMIN]
    },
     {
      title: "Department",
      path: "/",
      roles: [ROLES.ADMIN]
    },
     {
      title: "Appreciation",
      path: "/",
      roles: [ROLES.ADMIN]
    },
  ], 
      },
       { 
        title: "Work", 
        path: "/dashboard/users", 
        icon: <BriefcaseBusiness />, 
        roles: [ROLES.ADMIN],
        children: [
   
           {
     title: "Contracts", 
          path: "/", 
      roles: [ROLES.ADMIN]
    },
     {
     title: "Projects", 
          path: "/", 
      roles: [ROLES.ADMIN]
    },
    {
      title: "Tasks",
      path: "/",
      roles: [ROLES.ADMIN]
    },
     {
      title: "Timesheet",
      path: "/",
      roles: [ROLES.ADMIN]
    },
  ],  
      },
       { 
        title: "Finance", 
        path: "/dashboard/users", 
        icon: <DollarSign />, 
        roles: [ROLES.ADMIN],
        children: [
   
           {
     title: "Proposal", 
          path: "/", 
      roles: [ROLES.ADMIN]
    },
     {
     title: "Estimates", 
          path: "/", 
      roles: [ROLES.ADMIN]
    },
    {
      title: "Invoices",
      path: "/",
      roles: [ROLES.ADMIN]
    },
     {
      title: "Payments",
      path: "/",
      roles: [ROLES.ADMIN]
    },
     {
      title: "Credit Note",
      path: "/",
      roles: [ROLES.ADMIN]
    },
     {
      title: "Expenses",
      path: "/",
      roles: [ROLES.ADMIN]
    },
     {
      title: "Bank Account ",
      path: "/", 
      roles: [ROLES.ADMIN]
    },
    
  ],  
      },
      { 
        title: "Users", 
        path: "/dashboard/users", 
        icon: <UsersRound />, 
        roles: [ROLES.ADMIN,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Sales Representative", 
        path: "/dashboard/sales", 
        icon: <CircleUserRound />, 
        roles: [ROLES.ADMIN, ROLES.SALES_ADMIN,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Clients", 
        path: "/dashboard/clients", 
        icon: <Handshake />, 
        roles: [ROLES.ADMIN,ROLES.SALES_USER,ROLES.DASHBOARD_ADMIN, ROLES.SALES_ADMIN] 
      },
      { 
        title: "Suppliers", 
        path: "/dashboard/suppliers", 
        icon: <PackageCheck />, 
        roles: [ROLES.ADMIN,ROLES.PROCUREMENT_ADMIN,ROLES.USER_PROCUREMENT,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Quotations", 
        path: "/dashboard/quotations", 
        icon: <FileClock />, 
        roles: [ROLES.ADMIN, ROLES.SALES_ADMIN, ROLES.SALES_USER,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Approve", 
        path: "/dashboard/approve", 
        icon: <Check />, 
        roles: [ROLES.ADMIN,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Quotation Approval", 
        path: "/dashboard/approves", 
        icon: <FileCheck />, 
        roles: [ROLES.SALES_ADMIN,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Purchase Approval", 
        path: "/dashboard/approvePo", 
        icon: <TicketCheck />, 
        roles: [ROLES.PROCUREMENT_ADMIN] 
      },
      { 
        title: "Coc Approval", 
        path: "/dashboard/approveCoc", 
        icon: <FileBadge />, 
        roles: [ROLES.SALES_ADMIN] 
      },
      { 
        title: "Purchase Orders", 
        path: "/dashboard/purchaseOrder", 
        icon: <FileBox />, 
        roles: [ROLES.ADMIN, ROLES.PROCUREMENT_ADMIN,ROLES.USER_PROCUREMENT,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Job Order", 
        path: "/dashboard/jobOrder", 
        icon: <Shuffle />, 
        roles: [ROLES.ADMIN,ROLES.DASHBOARD_ADMIN,ROLES.SALES_USER] 
      },
      { 
        title: "PL&CoC", 
        path: "/dashboard/pl_coc", 
        icon: <ShieldCheck />, 
        roles: [ROLES.ADMIN, ROLES.SALES_ADMIN,ROLES.DASHBOARD_ADMIN,ROLES.SALES_USER] 
      },
       { 
        title: "Picklist", 
        path: "/dashboard/pl_coc/pl", 
        icon: <ListChecks />,
        roles: [ROLES.USER_PROCUREMENT] 
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