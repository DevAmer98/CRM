'use client';
import { useEffect, useState } from 'react';
import { ListTodoIcon } from 'lucide-react';
import { getLeaveRequests } from '@/app/lib/actions'; // 👈 your adjusted action
import styles from './table.module.css';
import Pagination from '../pagination/pagination';

const REQUESTS_PER_PAGE = 5;

const StatusBadge = ({ status }) => {
  const statusClass = {
    Pending: styles.statusPending,
    Approved: styles.statusDone,
    Rejected: styles.statusRejected,
  }[status] || styles.statusDefault;

  return (
    <span className={`${styles.statusBase} ${statusClass}`}>
      {status}
    </span>
  );
};

const RequestTable = () => {
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const requests = await getLeaveRequests();
        setLeaveRequests(requests || []);
      } catch (err) {
        console.error("[DEBUG] getLeaveRequests fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const paginatedRequests = leaveRequests.slice(
    (currentPage - 1) * REQUESTS_PER_PAGE,
    currentPage * REQUESTS_PER_PAGE
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>My Leave Requests</h2>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className={styles.loadingCell}>
                    <div className={styles.spinner}></div>
                    <p>Loading leave requests...</p>
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.emptyCell}>
                    <div className={styles.emptyContent}>
                      <ListTodoIcon className={styles.emptyIcon} />
                      <p>No leave requests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id}>
                    <td>#{req.id.slice(-6)}</td>
                    <td>{req.leaveType}</td>
                    <td>{req.startDate}</td>
                    <td>{req.endDate}</td>
                    <td><StatusBadge status={req.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && leaveRequests.length > REQUESTS_PER_PAGE && (
          <div className={styles.pagination}>
            <Pagination
              count={leaveRequests.length}
              itemsPerPage={REQUESTS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestTable;
