import React from 'react';
import styles from '@/app/ui/hr_dashboard/employees/employees.module.css';
import Search from '@/app/ui/hr_dashboard/search/search';
import Link from 'next/link';
import { fetchLeaves } from '@/app/lib/data';
import { Eye } from 'lucide-react';

const LeavesPage = async ({ searchParams }) => {
  const q = searchParams?.q || "";
  const page = searchParams?.page || 1; 
  const { count, leaves } = await fetchLeaves(q, page);



  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a Employee..." />
        <Link href='/dashboard/leaves/add'>
          <button className={styles.addButton}>Add New</button>
        </Link>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <td>Employee Name</td>
            <td>Created At</td>
            <td>Leave Type</td>
            <td>Leave Balance</td>
            <td>Manager Approval</td>
            <td>HR Approval</td>
            <td>Actions</td>
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => {
            // Calculate leave balance from employee contractStartDate
let leaveBalance = 'N/A';
if (leave.employee?.leaveBalance !== undefined) {
  leaveBalance = `${leave.employee.leaveBalance.toFixed(1)} days`;
}

        return (
              <tr key={leave._id}>
                <td>{leave.employee?.name}</td>
                <td>{leave.createdAt?.toString().slice(4,16)}</td>
                <td>{leave.leaveType}</td>
                <td>{leaveBalance}</td>

                <td>
                  {leave.approvals?.admin?.approved ? (
                    <span className={`${styles.approvalBadge} ${styles.approved}`}>
                      Approved by {leave.approvals.admin.approvedBy?.username || 'Unknown'}
                    </span>
                  ) : leave.approvals?.admin?.rejected ? (
                    <span className={`${styles.approvalBadge} ${styles.rejected}`}>
                      Rejected
                    </span>
                  ) : (
                    <span className={`${styles.approvalBadge} ${styles.pending}`}>
                      Pending
                    </span>
                  )}
                </td>

                <td>
                  {leave.approvals?.hrAdmin?.approved ? (
                    <span className={`${styles.approvalBadge} ${styles.approved}`}>
                      Approved
                    </span>
                  ) : leave.approvals?.hrAdmin?.rejected ? (
                    <span className={`${styles.approvalBadge} ${styles.rejected}`}>
                      Rejected
                    </span>
                  ) : (
                    <span className={`${styles.approvalBadge} ${styles.pending}`}>
                      Pending
                    </span>
                  )}
                </td>

                <td>
                  <div className={styles.buttons}>
                    <Link href={`/dashboard/leaves/${leave._id}`}>
                      <button className={styles.eyeButton} title="View Leave Details">
                        <Eye />
                      </button>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeavesPage;
