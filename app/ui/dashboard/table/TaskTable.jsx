'use client';
import { useEffect, useState } from 'react';
import { ListTodoIcon } from 'lucide-react';
import { getTaskById, getTasks, getAssignedTasks, markTaskAsDone, markTaskAsInProgress } from '@/app/lib/actions';
import styles from './table.module.css';
import Pagination from '../pagination/pagination';

const TASKS_PER_PAGE = 5;
const SUMMARY_TASKS_PER_PAGE = 5;

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

const TaskTable = () => {
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [currentSummaryPage, setCurrentSummaryPage] = useState(1);
  const [mode, setMode] = useState('all'); // 'all' | 'pending' | 'assigned'
  const [tasks, setTasks] = useState([]);          // unassigned tasks you created
  const [assignedTasks, setAssignedTasks] = useState([]);  // tasks you assigned to others

  const activeTasks = mode === 'assigned' ? assignedTasks : tasks;

  useEffect(() => {
    setLoading(true);
    setTasks([]);
    setAssignedTasks([]);

    if (mode === 'assigned') {
      getAssignedTasks()
        .then(data => setAssignedTasks(data || []))
        .catch(err => console.error("[DEBUG] AssignedTasks fetch error:", err))
        .finally(() => setLoading(false));
    } else {
      getTasks()
        .then(data => setTasks(data || []))
        .catch(err => console.error("[DEBUG] getTasks fetch error:", err))
        .finally(() => setLoading(false));
    }
  }, [mode]);


  const validFilters = ['all', 'pending', 'in-progress', 'done'];
const appliedFilter = validFilters.includes(filter) ? filter : 'all';

const filteredTasks = activeTasks.filter(task =>
  appliedFilter === 'all' ? true : task.status === appliedFilter
);




  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * TASKS_PER_PAGE,
    currentPage * TASKS_PER_PAGE
  );

  const paginatedSummaryTasks = activeTasks.slice(
    (currentSummaryPage - 1) * SUMMARY_TASKS_PER_PAGE,
    currentSummaryPage * SUMMARY_TASKS_PER_PAGE
  );

  const openDialog = async (task) => {
    setDialogLoading(true);
    setShowDialog(true);
    try {
      const fullTask = await getTaskById(task.id);
      setSelectedTask(fullTask);
    } catch {
      setSelectedTask({ ...task, description: 'Failed to load description.' });
    } finally {
      setDialogLoading(false);
    }
  };

  const closeDialog = () => {
    setShowDialog(false);
    setSelectedTask(null);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tasks</h2>
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
              className={`${styles.filterBtn} ${mode === 'all' && filter === 'in-progress' ? styles.activeFilter : ''}`}
              onClick={() => { setMode('all'); setFilter('in-progress'); setCurrentPage(1); }}
            >
              In Progress
            </button>

            <button
              className={`${styles.filterBtn} ${mode === 'assigned' ? styles.activeFilter : ''}`}
              onClick={() => { setMode('assigned'); setFilter('all'); setCurrentPage(1); }}
            >
              Assigned Tasks
            </button> 
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className={styles.loadingCell}>
                    <div className={styles.spinner}></div>
                    <p>Loading tasks...</p>
                  </td>
                </tr>
              ) : paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.emptyCell}>
                    <div className={styles.emptyContent}>
                      <ListTodoIcon className={styles.emptyIcon} />
                      <p>No tasks found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task) => (
                  <tr key={task.id}>
                    <td>#{task.id.slice(-6)}</td>
                    <td>{task.title}</td>
                    <td><StatusBadge status={task.status} /></td>
                    <td>{task.deadline || '—'}</td>
                    <td>
                      <button className={styles.showBtn} onClick={() => openDialog(task)}>Show</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredTasks.length > TASKS_PER_PAGE && (
          <div className={styles.pagination}>
            <Pagination
              count={filteredTasks.length}
              itemsPerPage={TASKS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {showDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <button onClick={closeDialog} className={styles.closeBtn}>×</button>
            <h3 className={styles.title}>📝 Task Details</h3>

            {dialogLoading ? (
              <div className={styles.dialogLoading}>Loading...</div>
            ) : (
              <div className={styles.dialogContent}>
                <div><label>Title</label><p>{selectedTask?.title}</p></div>
                <div><label>Status</label><p><StatusBadge status={selectedTask?.status} /></p></div>
                <div><label>Deadline</label><p>{selectedTask?.deadline || '—'}</p></div>
                <div><label>Description</label><p>{selectedTask?.description || 'No description provided.'}</p></div>
                {mode === 'assigned' && (
                  <>
                    <div><label>Created By</label><p>{selectedTask?.createdBy || 'Unknown'}</p></div>
                    <div><label>Assigned To</label><p>{selectedTask?.assignedTo || 'Unassigned'}</p></div>
                  </>
                )}
              </div>
            )}

    <div className={styles.dialogActions}>
  {selectedTask?.status !== 'done' && mode !== 'assigned' && (
    <button
      className={styles.doneBtn}
      onClick={async () => {
        try {
          const updatedTask = await markTaskAsDone(selectedTask.id);
          setSelectedTask(prev => prev ? { ...prev, status: updatedTask.status } : prev);
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task.id === selectedTask.id
                ? { ...task, status: updatedTask.status }
                : task
            )
          );
        } catch (error) {
          console.error("Failed to mark task as done:", error);
        }
      }}
    >
      ✅ Mark as Done
    </button>
  )}

 {selectedTask?.status === 'pending' && mode !== 'assigned' && (
  <button
    className={styles.inProgressBtn}
    onClick={async () => {
      try {
        const updatedTask = await markTaskAsInProgress(selectedTask.id);
        setSelectedTask(prev => prev ? { ...prev, status: updatedTask.status } : prev);
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === selectedTask.id
              ? { ...task, status: updatedTask.status }
              : task
          )
        );
      } catch (error) {
        console.error("Failed to mark task as in progress:", error);
      }
    }}
  >
    Mark as In Progress
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
            <h3 className={styles.title}>📋 Assigned Tasks Summary</h3>

            <div className={styles.dialogContent}>
              {activeTasks.length === 0 ? (
                <p>No tasks available.</p>
              ) : (
                <table className={styles.summaryTable}>
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Title</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSummaryTasks.map(task => (
                      <tr key={task.id}>
                        <td>#{task.id.slice(-6)}</td>
                        <td>{task.title}</td>
                        <td>{task.assignedTo}</td>
                        <td><StatusBadge status={task.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {activeTasks.length > SUMMARY_TASKS_PER_PAGE && (
              <div className={styles.pagination}>
                <Pagination
                  count={activeTasks.length}
                  itemsPerPage={SUMMARY_TASKS_PER_PAGE}
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

export default TaskTable;
