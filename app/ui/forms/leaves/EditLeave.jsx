'use client';
import styles from '@/app/ui/dashboard/employees/addEmployee/addEmployee.module.css';
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { approveLeave, rejectLeave, updateLeave } from '@/app/lib/actions';
import { ROLES } from '@/app/lib/role';

const leaveSchema = z.object({
  id: z.string(),
  employeeId: z.string().min(1, "Employee is required"),
  contactMobile: z.string(),
  leaveType: z.enum(["Annual Leave", "Sick Leave","Unpaid Leave", "Special Leave"], { message: "Leave type is required" }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  addressWhileOnVacation: z.string().optional(),
  exitReentryVisa: z.boolean(),
     reason: z.string().optional(),
}).refine((data) => {
  const needsReason = ["Unpaid Leave", "Sick Leave", "Special Leave"].includes(data.leaveType);
  return !needsReason || (needsReason && data.reason?.trim());
}, {
  path: ["reason"],
  message: "Reason is required for this type of leave"
});

const EditLeave = ({ leave, currentUser,session }) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(leave.employee?._id || '');
  const router = useRouter();
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const showAdminApprove = currentUser?.role === ROLES.ADMIN;
  const showHrApprove = currentUser?.role === ROLES.HR_ADMIN;
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvedAdmin, setApprovedAdmin] = useState(leave?.approvals?.admin?.approved);
  const [approvedHr, setApprovedHr] = useState(leave?.approvals?.hrAdmin?.approved);
  const adminApproval = leave.approvals?.admin || {};
  const hrApproval = leave.approvals?.hrAdmin || {};

  const user = session?.user;
      const userRole = user?.role || ROLES.USER;

  const [exitReentryVisa, setExitReentryVisa] = useState(() => {
    if (leave.exitReentryVisa === true || leave.exitReentryVisa === 'yes') return 'yes';
    if (leave.exitReentryVisa === false || leave.exitReentryVisa === 'no') return 'no';
    return '';
  });


  
    
  useEffect(() => {
    setIsClient(typeof window !== 'undefined');
    fetchEmployees();
  }, []);


  const [formData, setFormData] = useState({
  employeeId: leave.employee?._id || '',
  contactMobile: leave.contactMobile || '',
  leaveType: leave.leaveType || '',
  startDate: leave.startDate || '',
  endDate: leave.endDate || '',
  addressWhileOnVacation: leave.addressWhileOnVacation || '',
 reason: leave.reason || '', // ✅ new field

});

const selectedEmployee = employees.find(emp => emp._id === selectedEmployeeId);

const handleInputChange = (field, value) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};


  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${domain}/api/allEmployees`, { cache: 'no-store', method: 'GET' });
      const data = await response.json();
      setEmployees(data);
      setLoading(false);
    } catch (error) {
      console.error('fetchEmployees error:', error);
      setLoading(false);
    }
  };

  const leaveActions = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const formObj = Object.fromEntries(formData.entries());
    formObj.id = leave._id;
    formObj.exitReentryVisa = exitReentryVisa === 'yes';

    try {
      const validated = leaveSchema.parse(formObj);
      const result = await updateLeave(validated);

      if (result.success) {
        toast.success('Leave updated successfully');

  if (userRole === 'hrAdmin') {
    router.push('/hr_dashboard/leaves');
  } else {
    router.push('/dashboard/leaves');
  }
      } else {
        toast.error(result.message || 'Failed to update leave');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => toast.error(err.message));
      } else {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Edit Leave</h1>
      <form onSubmit={leaveActions}>
        <div className={styles.formSections}>
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Employee</div>
              <select
                name="employeeId"
                className={styles.input}
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="" disabled>Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
                {/* ✅ SHOW LEAVE BALANCE IF EMPLOYEE IS SELECTED */}
                           {selectedEmployee && (
                <div
                  className={styles.infoBox}
                  style={{
                    color: selectedEmployee.leaveBalance < 0 ? '#b91c1c' : '#1e3a8a' // optional: red for negative
                  }}
                >
                  <strong>Current Leave Balance:</strong>{" "}
                  {selectedEmployee.leaveBalance !== undefined
                    ? selectedEmployee.leaveBalance.toFixed(1)
                    : "0.0"}{" "}
                  days
                </div>
              )}
              
                      
            </div>

            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Contact Information</div>
              <div className={styles.inputContainer}>
                <label className={styles.label}>Phone Number</label>
                <input className={styles.input} name="contactMobile" defaultValue={leave.contactMobile} required />
              </div>
              <div className={styles.inputContainer}>
                <label className={styles.label}>Address while on vacation:</label>
                <textarea className={styles.input} name="addressWhileOnVacation" rows="4" defaultValue={leave.addressWhileOnVacation}></textarea>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Leave Details</div>
              <label className={styles.label}>Leave Type:</label>
            <select
  name="leaveType"
  className={styles.input}
  value={formData.leaveType}
  onChange={(e) => handleInputChange("leaveType", e.target.value)}
  required
>
  <option value="">Select Leave Type</option>
  <option value="Annual Leave">Annual Leave</option>
  <option value="Sick Leave">Sick Leave</option>
  <option value="Unpaid Leave">Unpaid Leave</option>
  <option value="Special Leave">Special Leave</option>
</select>

               {["Unpaid Leave", "Sick Leave", "Special Leave"].includes(formData.leaveType) && (
  <div className={styles.formGroup}>
    <label className={styles.label}>Reason:</label>
   <textarea
  className={styles.input}
  name="reason"               // ✅ ADD THIS LINE
  rows="4"
  value={formData.reason}
  onChange={(e) => handleInputChange('reason', e.target.value)}
  required
/>

  </div>
)}

            </div>

            <div className={styles.formGroup}>
              <div className={styles.inputContainer}>
                <label className={styles.label}>Start Date:</label>
                <input className={styles.input} type="date" name="startDate" defaultValue={leave.startDate} required />
              </div>
              <div className={styles.inputContainer}>
                <label className={styles.label}>End Date:</label>
                <input className={styles.input} type="date" name="endDate" defaultValue={leave.endDate} required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Exit and Re-Entry Visa</div>
              <div className={styles.inputRow} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label className={styles.radioLabel}>
                  <input type="radio" name="exitReentryVisa" value="yes" checked={exitReentryVisa === 'yes'} onChange={() => setExitReentryVisa('yes')} />
                  Yes
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="exitReentryVisa" value="no" checked={exitReentryVisa === 'no'} onChange={() => setExitReentryVisa('no')} />
                  No
                </label>
              </div>
            </div>
                        <div className={styles.formGroup}>
                                        <div className={styles.sectionHeader}>Approvals</div>

  {/* Approval Badges */}
    <div className={styles.approvalsContainer}>
  {/* Admin Badge */}
  {adminApproval.approved ? (
    <span className={`${styles.approvalBadge} ${styles.approvedBadge}`}>
      Admin Approved by {adminApproval.approvedBy?.username || 'Unknown'}
    </span>
  ) : adminApproval.rejected ? (
    <span className={`${styles.approvalBadge} ${styles.rejectedBadge}`}>
      Admin Rejected by {adminApproval.rejectedBy?.username || 'Unknown'}
    </span>
  ) : (
    <span className={`${styles.approvalBadge} ${styles.pendingBadge}`}>
      Admin Pending
    </span>
  )}

  {/* HR Badge */}
  {hrApproval.approved ? (
    <span className={`${styles.approvalBadge} ${styles.approvedBadge}`}>
      HR Approved by {hrApproval.approvedBy?.username || 'Unknown'}
    </span>
  ) : hrApproval.rejected ? (
    <span className={`${styles.approvalBadge} ${styles.rejectedBadge}`}>
      HR Rejected by {hrApproval.rejectedBy?.username || 'Unknown'}
    </span>
  ) : (
    <span className={`${styles.approvalBadge} ${styles.pendingBadge}`}>
      HR Pending
    </span>
  )}
</div>
<div className={styles.approvalsActions}>
  {/* Admin Approve/Reject */}
  {showAdminApprove && !adminApproval.approved && !adminApproval.rejected && (
    <>
      <button
        type="button"
        className={`${styles.button} ${styles.approveButton}`}
        onClick={async () => {
          const res = await approveLeave({ leaveId: leave._id, role: 'Admin' });
          if (res.success) {
            toast.success('Leave approved by Admin');
            router.refresh();
          } else {
            toast.error(res.message || 'Approval failed');
          }
        }}
      >
        Approve as Admin
      </button>

      <button
        type="button"
        className={`${styles.button} ${styles.rejectButton}`}
        style={{ backgroundColor: '#e53935' }}
        onClick={() => setShowRejectReason('admin')}
      >
        Reject as Admin
      </button>
    </>
  )}

  {/* HR Approve/Reject */}
  {showHrApprove && adminApproval.approved && !hrApproval.approved && !hrApproval.rejected && (
    <>
      <button
        type="button"
        className={`${styles.button} ${styles.approveButton}`}
        onClick={async () => {
          const res = await approveLeave({ leaveId: leave._id, role: 'HRAdmin' });
          if (res.success) {
            toast.success('Leave approved by HR Admin');
            router.refresh();
          } else {
            toast.error(res.message || 'Approval failed');
          }
        }}
      >
        Approve as HR Admin
      </button>

      <button
        type="button"
        className={`${styles.button} ${styles.rejectButton}`}
        style={{ backgroundColor: '#e53935' }}
        onClick={() => setShowRejectReason('hr')}
      >
        Reject as HR Admin
      </button>
    </>
  )}

  {/* Rejection Reason Form */}
  {(showRejectReason === 'admin' || showRejectReason === 'hr') && (
    <div className={styles.rejectReasonContainer}>
      <textarea
        className={styles.input}
        placeholder="Enter rejection reason..."
        value={rejectionReason}
        onChange={(e) => setRejectionReason(e.target.value)}
        rows={3}
      />
      <button
        type="button"
        className={`${styles.button} ${styles.rejectButton}`}
        style={{ backgroundColor: '#e53935' }}
        onClick={async () => {
          if (!rejectionReason.trim()) {
            toast.error("Rejection reason is required.");
            return;
          }
          const res = await rejectLeave({
            leaveId: leave._id,
            role: showRejectReason === 'admin' ? 'Admin' : 'HRAdmin',
            reason: rejectionReason.trim(),
          });
          if (res.success) {
            toast.success('Leave rejected successfully');
            router.refresh();
          } else {
            toast.error(res.message || 'Rejection failed');
          }
        }}
      >
        Confirm Rejection
      </button>
    </div>
  )}
</div>
</div>
          </div>
        </div>

        <button className={styles.button} type="submit">Update Leave Request</button>
      </form>
    </div>
  );
};

export default EditLeave;
