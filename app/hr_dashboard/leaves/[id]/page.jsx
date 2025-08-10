import React from 'react'
import { fetchLeave } from '@/app/lib/data';
import styles from '@/app/ui/dashboard/employees/addEmployee/addEmployee.module.css';
import EditLeave from '@/app/ui/forms/leaves/EditLeave';
import  {auth}  from "@/app/api/auth/[...nextauth]/route"; // replace with your auth util

const SingleLeavePage = async ({ params })  => {
  const { id } = params;
  try {
    const leaveDocument = await fetchLeave(id);
    const leave = JSON.parse(JSON.stringify(leaveDocument.toObject())); 
  // ✅ Get the current logged-in user session with your auth() helper:
  const session = await auth();
  const currentUser = session?.user; // current user info with role, etc.

  if (!currentUser) {
    // Optionally redirect or return an error page if not signed in
    return <div>Please sign in to access this page.</div>;
  }
    

    console.log('Fetched Leave:', leave);

    return (
      <div className={styles.container}>
      <EditLeave leave={{ ...leave, id: leave._id }} currentUser={currentUser} session={session} />
        
      </div>
    );
  } catch (err) {
    console.error('Error in SingleLeavePage:', err);
    return <div>Error loading Leave data.</div>;
  }
}


export default SingleLeavePage