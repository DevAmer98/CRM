import React, { useEffect } from 'react';
import styles from './dialog.module.css';
import { getTasks, markTaskAsDone } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';

const DialogCss = ({ showDialog, setShowDialog, selectedTask, setSelectedTask, setTasks }) => {
  const router = useRouter()
  const closeDialog = () => {
    setShowDialog(false);
    setSelectedTask(null);
  };


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


  // Optional: close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeDialog();
    };
    if (showDialog) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDialog]);

  if (!showDialog) return null;

  return (
    <div className={styles.dialogOverlay} onClick={closeDialog}>
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside dialog
      >
        <h3 className={styles.title}>📝 Task Details</h3>

        {selectedTask ? (
           <div className={styles.dialogContent}>
                <div><label>Title</label><p>{selectedTask?.title}</p></div>
                <div><label>Status</label><p><StatusBadge status={selectedTask?.status} /></p></div>
                <div><label>Deadline</label><p>{selectedTask?.deadline || '—'}</p></div>
                <div><label>Description</label><p>{selectedTask?.description || 'No description provided.'}</p></div>
              </div>
            
        ) : (
          <div className={styles.dialogContent}>
            <p>Loading task details...</p>
          </div>
        )}

        <div className={styles.dialogActions}>
          {selectedTask?.status !== 'done' && (
            <button
              className={styles.doneBtn}
              onClick={async () => {
  try {
    const updatedTask = await markTaskAsDone(selectedTask.id);
    setSelectedTask((prev) =>
      prev ? { ...prev, status: updatedTask.status } : prev
    );

    const updatedTasks = await getTasks();
    setShowDropdown(false); // ✅ close dropdown so it reopens with updated data

    setTasks(updatedTasks || []); // ✅ update tasks in Navbar client state

    closeDialog(); // optional: close dialog after marking done
  } catch (error) {
    console.error("Failed to mark task as done:", error);
  }
}}

            >
              ✅ Mark as Done
            </button>
          )}
          <button className={styles.closeDialogBtn} onClick={closeDialog}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogCss;
