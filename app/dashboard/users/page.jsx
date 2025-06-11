import React from 'react'
import styles from '@/app/ui/dashboard/users/users.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link from 'next/link';
import Image from 'next/image';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
 import { fetchUsers } from '@/app/lib/data';
import DeleteUser from '@/app/ui/deleteForms/User';
import { ROLES } from '@/app/lib/role';







const UsersPage = async ({searchParams}) => {
  const q = searchParams?.q || "";
  const page = searchParams?.page || 1;
  const {count , users} = await fetchUsers(q, page);


  
  const getRoleLabel = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Admin';
      case ROLES.SALES_ADMIN:
        return 'Sales Admin';
      case ROLES.SALES_PROCUREMENT:
        return 'Sales Procurement';
         case ROLES.DASHBOARD_ADMIN:
          return 'Dashboard Admin';
      case ROLES.USER_PROCUREMENT:
        return 'User Procurement';
        case ROLES.HR_ADMIN:
          return 'HR Admin';
      case ROLES.USER:
      default:
        return 'User';
    }
  } 
  
  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a user..." />
        <Link href='/dashboard/users/add'>
          <button className={styles.addButton}>Add New</button>        
        </Link>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <td>Name</td>
              <td>Email</td>
              <td>Created At</td>
              <td>Role</td>
              <td>Status</td>
              <td>Action</td>
            </tr>
          </thead> 
          <tbody>
  {users.map((user) => (
    <tr key={user.id}>
      <td>
        <div className={styles.user}>{user.username}</div>
      </td>
      <td>{user.email}</td>
      <td>{user.createdAt?.toString().slice(4,16)}</td>
      <td>{getRoleLabel(user.role)}</td>
      <td>{user.isActive ? 'Active' : 'Passive'}</td>
      <td>
        <div className={styles.buttons}>
          <Link href={`/dashboard/users/${user.id}`}>
            <button className={`${styles.button} ${styles.view}`}>View</button>
          </Link>
          <DeleteUser userId={user.id} userName={user.username} />
        </div>
      </td>
    </tr>
  ))}
</tbody>

        </table>
      <Pagination count={count} />
    </div>
  );
};

export default UsersPage