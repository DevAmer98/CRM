//app/ui/private_dashbaord/admin.jsx
"use client";
import React, { useEffect, useState } from "react";
import styles from "../dashboard/main/main.module.css";
import { getLeaveRequests, getAssignedTasksDetailed, getCreatedTasksDetailed, getCreatorReplyTasksDetailed } from "@/app/lib/actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RequestTable from "../dashboard/table/RequestsTable";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";






const AdminPage = () => {
   const { data: session, status } = useSession();
   const router = useRouter()
   const [requests, setRequests] = useState([]);
const [loadingRequests, setLoadingRequests] = useState(true);
const [selectedTask, setSelectedTask] = useState(null);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [replyMessage, setReplyMessage] = useState("");
const [replyLoading, setReplyLoading] = useState(false);
const [replyTasks, setReplyTasks] = useState([]);

const reloadRequests = async () => {
  setLoadingRequests(true);
  const data = await getLeaveRequests();
  setRequests(data || []);
  setLoadingRequests(false);
}; 

useEffect(() => {
  reloadRequests();
}, []);

  const [counts, setCounts] = useState({
      userCount: null,
      clientCount: null,
      supplierCount: null
    }); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    

const reloadTasks = async () => {
  setLoadingTasks(true);
  try {
    const [assigned, created, needsReply] = await Promise.all([
      getAssignedTasksDetailed(),
      getCreatedTasksDetailed(),
      getCreatorReplyTasksDetailed(),
    ]);
    const merged = new Map();
    (assigned || []).forEach(task => merged.set(task.id, task));
    (created || []).forEach(task => merged.set(task.id, task));
    const replyIds = new Set((needsReply || []).map(task => task.id));
    const mergedTasks = Array.from(merged.values()).filter(task => !replyIds.has(task.id));
    setTasks(mergedTasks);
    setReplyTasks(needsReply || []);
  } catch (error) {
    console.error("Failed to load tasks:", error);
    setTasks([]);
    setReplyTasks([]);
  } finally {
    setLoadingTasks(false);
  }
};

useEffect(() => {
  reloadTasks();
}, []);

useEffect(() => {
  const handleRefresh = () => reloadTasks();
  if (typeof window !== "undefined") {
    window.addEventListener("message-badge-refresh", handleRefresh);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("message-badge-refresh", handleRefresh);
    }
  };
}, []);

useEffect(() => {
  const interval = setInterval(() => {
    reloadTasks();
  }, 5000);
  return () => clearInterval(interval);
}, []);

    
  
    useEffect(() => {
      const fetchCounts = async () => {
        try {
          const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
          console.log(process.env.NEXT_PUBLIC_API_URL);
          const [userRes, clientRes, supplierRes] = await Promise.all([
            fetch(`${domain}/api/allUsersCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/allClientsCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/allSuppliersCount`, { cache: 'no-store' })
          ]);
    
          // Check if all responses are OK
          if (!userRes.ok || !clientRes.ok || !supplierRes.ok) {
            throw new Error('HTTP error when fetching counts');
          }
    
          // Parse JSON for all responses
          const [userData, clientData, supplierData] = await Promise.all([
            userRes.json(),
            clientRes.json(),
            supplierRes.json()
          ]);
    
          // Set all counts
          setCounts({
            userCount: userData.count,
            clientCount: clientData.count,
            supplierCount: supplierData.count
          });
        } catch (error) {
          console.error("Error fetching counts:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
    
      fetchCounts();
    }, []);
  
   
 
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const doneTasks = tasks.filter(task => task.status === 'done');

  const [dragOver, setDragOver] = useState(null);

  const updateTaskStatus = async (taskId, status) => {
    try {
      const res = await fetch(`/api/task/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("message-badge-refresh"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (event, taskId, sourceKey) => {
    event.dataTransfer.setData("text/plain", taskId);
    event.dataTransfer.setData("task-source", sourceKey);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (event, status) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    const sourceKey = event.dataTransfer.getData("task-source");
    if (!taskId) return;
    setDragOver(null);
    updateTaskStatus(taskId, status);
    if (sourceKey === "needs-reply") {
      setReplyTasks((prev) => prev.filter((task) => task.id !== taskId));
      setTasks((prev) => {
        const existing = prev.find((task) => task.id === taskId);
        if (existing) {
          return prev.map((task) =>
            task.id === taskId ? { ...task, status } : task
          );
        }
        const moved = replyTasks.find((task) => task.id === taskId);
        return moved ? [{ ...moved, status }, ...prev] : prev;
      });
    }
  };

  const openTask = async (task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleReplySubmit = async () => {
    if (!selectedTask || !replyMessage.trim()) return;
    setReplyLoading(true);
    try {
      const res = await fetch(`/api/task/${selectedTask.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add reply");
      const now = new Date().toISOString();
      const newComment = {
        id: `local-${now}`,
        message: replyMessage.trim(),
        createdAt: now,
        author: { id: session?.user?.id || "", name: "You" },
      };
      setSelectedTask((prev) =>
        prev
          ? { ...prev, comments: [...(prev.comments || []), newComment] }
          : prev
      );
      setReplyMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setReplyLoading(false);
    }
  };



  return (
    <div className={styles.container}>

      
      {/* Header */}
      <div className={styles.header}>
         <h1 className={styles.headerTitle}>
          {status === "loading"
            ? "Loading..."
            : session?.user?.username
            ? `Hi, ${session.user.username}`
            : "Hi"}
        </h1>        <p className={styles.headerSubtitle}>
          Welcome back! Here's what's happening today.
        </p>
      </div>
      <div className={styles.wrapper}>
        <div className={styles.main}>
        
        </div>
      </div>

      <div className={styles.kanbanBoard}>
        {[
          { key: "needs-reply", title: "Needs Response", list: replyTasks, draggable: true },
          { key: "pending", title: "Pending", list: pendingTasks, draggable: true },
          { key: "in-progress", title: "In Progress", list: inProgressTasks, draggable: true },
          { key: "done", title: "Done", list: doneTasks, draggable: true },
        ].map((column) => (
          <div
            key={column.key}
            className={`${styles.kanbanLane} ${dragOver === column.key ? styles.kanbanLaneActive : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(column.key);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(event) => column.draggable && handleDrop(event, column.key)}
          >
            <div className={styles.kanbanHeader}>
              <h3>{column.title}</h3>
              <span className={styles.kanbanCount}>{column.list.length}</span>
            </div>
            <div className={styles.kanbanLaneBody}>
              <div className={styles.kanbanList}>
                {column.list.map((task) => (
                  <div
                    key={task.id}
                    className={styles.kanbanCard}
                    draggable={column.draggable}
                    onDragStart={(event) => column.draggable && handleDragStart(event, task.id, column.key)}
                  >
                    <div className={styles.kanbanCardTitle}>{task.title}</div>
                    <div className={styles.kanbanCardMeta}>
                      <span>
                        {column.key === "needs-reply"
                          ? `Assigned to ${task.assignedTo?.name || "Unassigned"}`
                          : task.assignedTo?.id && session?.user?.id && task.assignedTo.id === session.user.id
                            ? "Assigned to you"
                            : `Assigned to ${task.assignedTo?.name || "Unassigned"}`}
                      </span>
                      <span>{task.deadline || "—"}</span>
                    </div>
                    <button
                      className={styles.kanbanViewButton}
                      onClick={() => openTask(task)}
                    >
                      View details
                    </button>
                  </div>
                ))}
                {column.list.length === 0 && (
                  <div className={styles.kanbanEmpty}>No tasks</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="w-[95vw] sm:max-w-lg p-0 overflow-hidden"
          style={{
            backgroundColor: "var(--bgSoft)",
            border: "1px solid var(--border)",
            borderRadius: "var(--border-radius)",
            boxShadow: "var(--shadow-lg)",
            color: "var(--text)",
          }}
        >
          <div className={styles.dialogHeader}>
            <div>
              <DialogTitle className={styles.dialogTitle}>
                {selectedTask?.title || "Task Details"}
              </DialogTitle>
              <p className={styles.dialogSubtitle}>
                {selectedTask?.createdBy?.name || "Unknown"} → {selectedTask?.assignedTo?.name || "Unassigned"}
              </p>
            </div>
            <span className={`${styles.priorityBadge} ${selectedTask?.status === "pending"
              ? styles.priorityHigh
              : selectedTask?.status === "in-progress"
                ? styles.priorityMedium
                : styles.priorityLow
            }`}>
              {selectedTask?.status || "—"}
            </span>
          </div>
          <div className={styles.dialogBody}>
            <div className={styles.dialogGrid}>
              <div>
                <span className={styles.dialogLabel}>Assigned By</span>
                <div className={styles.dialogValue}>{selectedTask?.createdBy?.name || "Unknown"}</div>
              </div>
              <div>
                <span className={styles.dialogLabel}>Assigned To</span>
                <div className={styles.dialogValue}>{selectedTask?.assignedTo?.name || "Unassigned"}</div>
              </div>
              <div>
                <span className={styles.dialogLabel}>Deadline</span>
                <div className={styles.dialogValue}>{selectedTask?.deadline || "—"}</div>
              </div>
            </div>
            <div className={styles.dialogSection}>
              <span className={styles.dialogLabel}>Description</span>
              <p>{selectedTask?.description || "No description provided."}</p>
            </div>
            <div className={styles.dialogSection}>
              <span className={styles.dialogLabel}>Replies</span>
              <div className={styles.replyThread}>
                {(selectedTask?.comments || []).length === 0 ? (
                  <p className={styles.dialogMuted}>No replies yet.</p>
                ) : (
                  (selectedTask?.comments || []).map((comment) => (
                    <div key={comment.id} className={styles.replyItem}>
                      <div className={styles.replyMeta}>
                        <span className={styles.replyAuthor}>{comment.author?.name || "Unknown"}</span>
                        <span className={styles.replyTime}>
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "—"}
                        </span>
                      </div>
                      <p className={styles.replyMessage}>{comment.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className={styles.replyComposer}>
                <textarea
                  className={styles.replyInput}
                  rows={3}
                  placeholder="Write a reply or note..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
                <button
                  className={styles.replyButton}
                  onClick={handleReplySubmit}
                  disabled={replyLoading || !replyMessage.trim()}
                >
                  {replyLoading ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
