"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import styles from "../main/main.module.css";
import HeaderNavigation from "@/components/ui/HeaderNavigation";
import Card from "../../hr_dashboard/card/card";
import { getAllTasksDetailed } from "@/app/lib/actions";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const viewFilters = [
  { value: "all", label: "All Tasks" },
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
];

const statusBadgeClass = (status) => {
  switch (status) {
    case "pending":
      return styles.priorityHigh;
    case "in-progress":
      return styles.priorityMedium;
    case "done":
      return styles.priorityLow;
    default:
      return "";
  }
};

const formatRelativeTime = (isoDate) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [view, setView] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllTasksDetailed();
      setTasks(data?.tasks || []);
      setCurrentUserId(data?.currentUserId || "");
      setError("");
    } catch (err) {
      console.error("Failed to load tasks", err);
      setError("Unable to load tasks right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const sentTasks = useMemo(
    () => tasks.filter((task) => task.createdBy?.id === currentUserId),
    [tasks, currentUserId]
  );

  const receivedTasks = useMemo(
    () => tasks.filter((task) => task.assignedTo?.id === currentUserId),
    [tasks, currentUserId]
  );

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === "done").length,
    [tasks]
  );

  const overdueCount = useMemo(() => {
    const today = new Date();
    return tasks.filter((task) => {
      if (task.status === "done" || !task.deadlineRaw) return false;
      const deadline = new Date(task.deadlineRaw);
      return deadline < today;
    }).length;
  }, [tasks]);

  const statusSummary = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      { pending: 0, "in-progress": 0, done: 0 }
    );
  }, [tasks]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (view === "sent") return task.createdBy?.id === currentUserId;
        if (view === "received") return task.assignedTo?.id === currentUserId;
        return true;
      })
      .filter((task) => (statusFilter === "all" ? true : task.status === statusFilter))
      .filter((task) => {
        if (!normalizedSearch) return true;
        const haystack = `${task.title} ${task.createdBy?.name || ""} ${task.assignedTo?.name || ""}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      });
  }, [tasks, view, currentUserId, statusFilter, normalizedSearch]);

  const latestActivity = useMemo(() => tasks.slice(0, 8), [tasks]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <HeaderNavigation />
      </div>

      <div className={styles.wrapper}>
        <div className={styles.main}>
          <div className={styles.cards}>
            <Card title="All Tasks" number={tasks.length} detailText="Total tracked assignments" />
            <Card title="Sent Tasks" number={sentTasks.length} detailText="Tasks you assigned" />
            <Card title="Received Tasks" number={receivedTasks.length} detailText="Tasks awaiting you" />
            <Card title="Completed Tasks" number={completedCount} detailText="Marked as done" />
          </div>
        </div>
      </div>

      <div className={styles.bossGrid}>
        <div className={styles.mainGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Task Collaboration</h3>
              <button className={styles.refreshButton} onClick={fetchTasks} aria-label="Refresh tasks">
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
            </div>

            <div className={styles.controlsRow}>
              <div className={styles.segmentedControl}>
                {viewFilters.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.segmentedButton} ${
                      view === option.value ? styles.segmentedButtonActive : ""
                    }`}
                    onClick={() => setView(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className={styles.searchWrapper}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by title or user"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </label>
            </div>

            <div className={styles.statusFilterRow}>
              {statusFilters.map((option) => (
                <button
                  key={option.value}
                  className={`${styles.statusChip} ${
                    statusFilter === option.value ? styles.statusChipActive : ""
                  }`}
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className={styles.taskList}>
              {loading ? (
                <div className={styles.emptyState}>Loading tasks...</div>
              ) : error ? (
                <div className={styles.errorState}>{error}</div>
              ) : filteredTasks.length === 0 ? (
                <div className={styles.emptyState}>No tasks match the current filters.</div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`${styles.taskItem} ${task.status === "done" ? styles.taskItemCompleted : ""}`}
                  >
                    <div className={styles.taskContent}>
                      <div className={styles.taskFlowAvatar}>{task.title.charAt(0).toUpperCase()}</div>
                      <div>
                        <p
                          className={`${styles.taskTitle} ${
                            task.status === "done" ? styles.taskTitleCompleted : styles.taskTitleActive
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className={styles.taskStatus}>
                          {`${task.createdBy?.name || "Unknown"} → ${task.assignedTo?.name || "Unassigned"}`}
                        </p>
                      </div>
                    </div>

                    <div className={styles.taskMeta}>
                      <span className={`${styles.priorityBadge} ${statusBadgeClass(task.status)}`}>
                        {statusFilters.find((opt) => opt.value === task.status)?.label || task.status}
                      </span>
                      <span className={styles.taskDeadline}>Due {task.deadline}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Team Pulse</h3>
            </div>

            <div className={styles.statusSummaryGrid}>
              {["pending", "in-progress", "done"].map((status) => (
                <div key={status} className={styles.statusSummaryItem}>
                  <span className={`${styles.priorityBadge} ${statusBadgeClass(status)}`}>
                    {statusFilters.find((opt) => opt.value === status)?.label}
                  </span>
                  <strong>{statusSummary[status] || 0}</strong>
                  <small>{status === "done" ? "Completed" : "Active"}</small>
                </div>
              ))}
              <div className={styles.statusSummaryItem}>
                <span className={`${styles.priorityBadge} ${styles.priorityHigh}`}>Overdue</span>
                <strong>{overdueCount}</strong>
                <small>Needs attention</small>
              </div>
            </div>

            <div className={styles.timelineList}>
              {latestActivity.length === 0 ? (
                <div className={styles.emptyState}>No task activity yet.</div>
              ) : (
                latestActivity.map((task) => (
                  <div key={`activity-${task.id}`} className={styles.timelineItem}>
                    <div>
                      <p className={styles.timelineTitle}>{task.title}</p>
                      <p className={styles.timelineMeta}>
                        {`${task.createdBy?.name || "Unknown"} → ${task.assignedTo?.name || "Unassigned"}`}
                      </p>
                    </div>
                    <div className={styles.timelineTime}>
                      {formatRelativeTime(task.updatedAt || task.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>All Task Transfers</h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.taskFlowTable}>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">Loading...</td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan="5">No tasks recorded yet.</td>
                  </tr>
                ) : (
                  tasks.slice(0, 12).map((task) => (
                    <tr key={`table-${task.id}`}>
                      <td>{task.title}</td>
                      <td>{task.createdBy?.name || "Unknown"}</td>
                      <td>{task.assignedTo?.name || "Unassigned"}</td>
                      <td>
                        <span className={`${styles.priorityBadge} ${statusBadgeClass(task.status)}`}>
                          {statusFilters.find((opt) => opt.value === task.status)?.label || task.status}
                        </span>
                      </td>
                      <td>{task.deadline}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
