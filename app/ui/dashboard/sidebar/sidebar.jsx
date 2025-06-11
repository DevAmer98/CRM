import React from 'react';
import MenuLinks from "./menuLinks/menuLinks";
import styles from "./sidebar.module.css";
import { auth, signOut } from "@/app/auth";
import { ROLES } from '@/app/lib/role';
import { BriefcaseBusiness, Check, FileBadge, FileBox, FileCheck, FileClock, Handshake, LayoutDashboard, LogOut, PackageCheck, ShieldCheck, Shuffle, TicketCheck, UsersRound } from 'lucide-react';

const menuItems = [
  {
    title: "Pages",
    list: [
      { 
        title: "Dashboard", 
        path: "/dashboard", 
        icon: <LayoutDashboard /> ,
        roles: [ROLES.ADMIN ,ROLES.PROCUREMENT_ADMIN,ROLES.SALES_ADMIN,ROLES.SALES_USER,ROLES.USER_PROCUREMENT,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "HR Dashboard", 
        path: "/hr_dashboard", 
        icon: <LayoutDashboard /> ,
        roles: [ROLES.ADMIN ,ROLES.HR_ADMIN] 
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
        icon: <BriefcaseBusiness />, 
        roles: [ROLES.ADMIN, ROLES.SALES_ADMIN,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Clients", 
        path: "/dashboard/clients", 
        icon: <Handshake />, 
        roles: [ROLES.ADMIN,ROLES.SALES_USER,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Suppliers", 
        path: "/dashboard/suppliers", 
        icon: <PackageCheck />, 
        roles: [ROLES.ADMIN,ROLES.PROCUREMENT_ADMIN,ROLES.DASHBOARD_ADMIN] 
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
        roles: [ROLES.PROCUREMENT_ADMIN,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Coc Approval", 
        path: "/dashboard/approveCoc", 
        icon: <FileBadge />, 
        roles: [ROLES.SALES_ADMIN,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Purchase Orders", 
        path: "/dashboard/purchaseOrder", 
        icon: <FileBox />, 
        roles: [ROLES.ADMIN, ROLES.PROCUREMENT_ADMIN,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "Job Order", 
        path: "/dashboard/jobOrder", 
        icon: <Shuffle />, 
        roles: [ROLES.ADMIN,ROLES.DASHBOARD_ADMIN] 
      },
      { 
        title: "PL&CoC", 
        path: "/dashboard/pl_coc", 
        icon: <ShieldCheck />, 
        roles: [ROLES.ADMIN, ROLES.SALES_ADMIN,ROLES.DASHBOARD_ADMIN] 
      },
    ],
  },
 /* {
    title: "Analytics",
    list: [
      { 
        title: "Reports", 
        path: "/dashboard/reports", 
        icon: <MdAnalytics />, 
        roles: [ROLES.ADMIN, ROLES.SALES_ADMIN] 
      },
    ],
  },*/
];

const Sidebar = async () => {

 
const session = await auth();
  const user = session?.user || null;

  if (!user) {
    redirect("/login");
  } 

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