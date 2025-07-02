'use client';
import { useEffect, useState } from 'react';
import { ListTodoIcon } from 'lucide-react';
import styles from './table.module.css';
import Pagination from '../pagination/pagination';
import { getAssignedTickets, getTicketById, getTickets, markTicketAsDone } from '@/app/lib/actions';

const TICKETS_PER_PAGE = 5; 
const SUMMARY_TICKETS_PER_PAGE = 5; 


const StatusBadge = ({ status }) => {
  const statusClass = {
    pending: styles.statusPending,
    'in-progress': styles.statusInProgress,
    done: styles.statusDone,
  }[status] || styles.statusDefault;

  return (
    <span className={`${styles.statusBase} ${statusClass}`}>
      {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
};

const TicketTable = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending'
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [currentSummaryPage, setCurrentSummaryPage] = useState(1);
  const [mode, setMode] = useState('all'); // 'all' | 'pending' | 'assigned'
  const [assignedTickets, setAssignedTickets] = useState([]);  




    const activeTickets = mode === 'assigned' ? assignedTickets : tickets;
  
    useEffect(() => {
      setLoading(true);
      setTickets([]);
      setAssignedTickets([]);
   
      if (mode === 'assigned') {
        getAssignedTickets()
          .then(data => setAssignedTickets(data || []))
          .catch(err => console.error("[DEBUG] AssignedTickets fetch error:", err))
          .finally(() => setLoading(false));
      } else {
        getTickets()
          .then(data => setTickets(data || []))
          .catch(err => console.error("[DEBUG] getTicket fetch error:", err))
          .finally(() => setLoading(false));
      }
    }, [mode]);


 
   
    const paginatedSummaryTickets = activeTickets.slice(
      (currentSummaryPage - 1) * SUMMARY_TICKETS_PER_PAGE,
      currentSummaryPage * SUMMARY_TICKETS_PER_PAGE
    );

    const filteredTickets = activeTickets.filter(ticket =>
  filter === 'all' ? true : ticket.status === 'pending'
);

const paginatedTicket = filteredTickets.slice(
  (currentPage - 1) * TICKETS_PER_PAGE,
  currentPage * TICKETS_PER_PAGE
);




  const openDialog = async (ticket) => {
    setDialogLoading(true);
    setShowDialog(true);
    try {
      const fullTicket = await getTicketById(ticket.id);
      setSelectedTicket(fullTicket);
    } catch {
      setSelectedTicket({ ...ticket, description: 'Failed to load description.' });
    } finally {
      setDialogLoading(false);
    }
  };

  const closeDialog = () => {
    setShowDialog(false);
    setSelectedTicket(null);
  };

  useEffect(() => {
    getTickets().then(data => {
      setTickets(data || []);
      setLoading(false);
    });
  }, []);



  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tickets</h2>
           <div className={styles.filterButtons}>
    <button
              className={`${styles.filterBtn} ${mode === 'all' && filter === 'all' ? styles.activeFilter : ''}`}
              onClick={() => { setMode('all'); setFilter('all'); setCurrentPage(1); }}
            >
              All
            </button>

            <button
              className={`${styles.filterBtn} ${mode === 'all' && filter === 'pending' ? styles.activeFilter : ''}`}
              onClick={() => { setMode('all'); setFilter('pending'); setCurrentPage(1); }}
            >
              Pending
            </button>

            <button
              className={`${styles.filterBtn} ${mode === 'assigned' ? styles.activeFilter : ''}`}
              onClick={() => { setMode('assigned'); setFilter('all'); setCurrentPage(1); }}
            >
              Assigned Tickets
            </button> 
  </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Task</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className={styles.loadingCell}>
                    <div className={styles.spinner}></div>
                    <p>Loading Tickets...</p>
                  </td>
                </tr>
              ) : paginatedTicket.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.emptyCell}>
                   <div className={styles.emptyContent}>
      <ListTodoIcon className={styles.emptyIcon} />
      <p>No tickets found</p>
    </div>
                  </td>
                </tr>
              ) : (
                paginatedTicket.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>#{ticket.id.slice(-6)}</td>
                    <td>{ticket.title}</td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td>{ticket.deadline || '—'}</td>
                    <td>
                      <button className={styles.showBtn} onClick={() => openDialog(ticket)}>Show</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */} 
      {!loading && filteredTickets.length > TICKETS_PER_PAGE && (
  <div className={styles.pagination}>
    <Pagination 
      count={filteredTickets.length}
      itemsPerPage={TICKETS_PER_PAGE}
      onPageChange={setCurrentPage}
    />
  </div>
)}

      </div>

      {showDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <button onClick={closeDialog} className={styles.closeBtn}>×</button>
            <h3 className={styles.title}>📝 Ticket Details</h3>

            {dialogLoading ? (
              <div className={styles.dialogLoading}>Loading...</div>
            ) : (
              <div className={styles.dialogContent}>
                <div><label>Title</label><p>{selectedTicket?.title}</p></div>
                <div><label>Status</label><p><StatusBadge status={selectedTicket?.status} /></p></div>
                <div><label>Deadline</label><p>{selectedTicket?.deadline || '—'}</p></div>
                <div><label>Description</label><p>{selectedTicket?.description || 'No description provided.'}</p></div>
                    {mode === 'assigned' && (
                  <>
                    <div><label>Created By</label><p>{selectedTicket?.createdBy || 'Unknown'}</p></div>
                    <div><label>Assigned To</label><p>{selectedTicket?.assignedTo || 'Unassigned'}</p></div>
                  </>
                )}
              </div>
            )}

            <div className={styles.dialogActions}>
      {selectedTicket?.status !== 'done' && mode !== 'assigned' && (

    <button
      className={styles.doneBtn}
      onClick={async () => {
        try {
          const updatedTicket = await markTicketAsDone(selectedTicket.id);

          setSelectedTicket(prev => prev ? { ...prev, status: updatedTicket.status } : prev);

          setTickets(prevTickets =>
            prevTickets.map(ticket =>
              ticket.id === selectedTicket.id
                ? { ...ticket, status: updatedTicket.status }
                : ticket
            )
          );
        } catch (error) {
          console.error("Failed to mark ticket as done:", error);
        }
      }}
    >
      
      ✅ Mark as Done
    </button>
  )} 
  <button className={styles.closeDialogBtn} onClick={closeDialog}>Close</button>
</div>

          </div>
        </div>
      )}

       {showSummaryDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <button onClick={() => setShowSummaryDialog(false)} className={styles.closeBtn}>×</button>
            <h3 className={styles.title}>📋 Assigned Ticket Summary</h3>

            <div className={styles.dialogContent}>
              {activeTickets.length === 0 ? (
                <p>No tickets available.</p>
              ) : (
                <table className={styles.summaryTable}>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Title</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSummaryTickets.map(ticket => (
                      <tr key={ticket.id}>
                        <td>#{ticket.id.slice(-6)}</td>
                        <td>{ticket.title}</td>
                        <td>{ticket.assignedTo}</td>
                        <td><StatusBadge status={ticket.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {activeTickets.length > SUMMARY_TICKETS_PER_PAGE && (
              <div className={styles.pagination}>
                <Pagination
                  count={activeTickets.length}
                  itemsPerPage={SUMMARY_TICKETS_PER_PAGE}
                  onPageChange={setCurrentSummaryPage}
                />
              </div>
            )}

            <div className={styles.dialogActions}>
              <button className={styles.closeDialogBtn} onClick={() => setShowSummaryDialog(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTable;
