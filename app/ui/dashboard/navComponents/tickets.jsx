//app/ui/dashboard/navComponents/tickets.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import styles from "../main/main.module.css";
import HeaderNavigation from "@/components/ui/HeaderNavigation";
import Card from "../../hr_dashboard/card/card";
import { getAllTicketsDetailed } from "@/app/lib/actions";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const viewFilters = [
  { value: "all", label: "All Tickets" },
  { value: "assigned", label: "Assigned to Me" },
  { value: "created", label: "Created by Me" },
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

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [view, setView] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllTicketsDetailed();
      setTickets(data?.tickets || []);
      setCurrentUserId(data?.currentUserId || "");
      setError("");
    } catch (err) {
      console.error("Failed to load tickets", err);
      setError("Unable to load tickets right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const assignedTickets = useMemo(
    () => tickets.filter((ticket) => ticket.assignedTo?.id === currentUserId),
    [tickets, currentUserId]
  );

  const createdTickets = useMemo(
    () => tickets.filter((ticket) => ticket.createdBy?.id === currentUserId),
    [tickets, currentUserId]
  );

  const completedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "done").length,
    [tickets]
  );

  const statusSummary = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      },
      { pending: 0, "in-progress": 0, done: 0 }
    );
  }, [tickets]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredTickets = useMemo(() => {
    const pool =
      view === "assigned"
        ? assignedTickets
        : view === "created"
        ? createdTickets
        : tickets;

    return pool
      .filter((ticket) => (statusFilter === "all" ? true : ticket.status === statusFilter))
      .filter((ticket) => {
        if (!normalizedSearch) return true;
        const haystack = `${ticket.title} ${ticket.createdBy?.name || ""} ${ticket.assignedTo?.name || ""}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      });
  }, [view, assignedTickets, createdTickets, tickets, statusFilter, normalizedSearch]);

  const latestActivity = useMemo(() => tickets.slice(0, 8), [tickets]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <HeaderNavigation />
      </div>

      <div className={styles.wrapper}>
        <div className={styles.main}>
          <div className={styles.cards}>
            <Card title="All Tickets" number={tickets.length} detailText="Total ticket volume" />
            <Card title="Assigned to Me" number={assignedTickets.length} detailText="Tickets awaiting your action" />
            <Card title="Created by Me" number={createdTickets.length} detailText="Tickets you've opened" />
            <Card title="Completed" number={completedCount} detailText="Resolved this month" />
          </div>
        </div>
      </div>

      <div className={styles.bossGrid}>
        <div className={styles.mainGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Ticket Collaboration</h3>
              <button className={styles.refreshButton} onClick={fetchTickets} aria-label="Refresh tickets">
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
                  placeholder="Search by title or person"
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
                <div className={styles.emptyState}>Loading tickets...</div>
              ) : error ? (
                <div className={styles.errorState}>{error}</div>
              ) : filteredTickets.length === 0 ? (
                <div className={styles.emptyState}>No tickets match the current filters.</div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`${styles.taskItem} ${
                      ticket.status === "done" ? styles.taskItemCompleted : ""
                    }`}
                  >
                    <div className={styles.taskContent}>
                      <div className={styles.taskFlowAvatar}>
                        {ticket.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p
                          className={`${styles.taskTitle} ${
                            ticket.status === "done"
                              ? styles.taskTitleCompleted
                              : styles.taskTitleActive
                          }`}
                        >
                          {ticket.title}
                        </p>
                        <p className={styles.taskStatus}>
                          {`${ticket.createdBy?.name || "Unknown"} → ${ticket.assignedTo?.name || "Unassigned"}`}
                        </p>
                      </div>
                    </div>

                    <div className={styles.taskMeta}>
                      <span className={`${styles.priorityBadge} ${statusBadgeClass(ticket.status)}`}>
                        {statusFilters.find((opt) => opt.value === ticket.status)?.label || ticket.status}
                      </span>
                      <span className={styles.taskDeadline}>Due {ticket.deadline}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Status Insights</h3>
            </div>

            <div className={styles.statusSummaryGrid}>
              {["pending", "in-progress", "done"].map((status) => (
                <div key={status} className={styles.statusSummaryItem}>
                  <span className={`${styles.priorityBadge} ${statusBadgeClass(status)}`}>
                    {statusFilters.find((opt) => opt.value === status)?.label}
                  </span>
                  <strong>{statusSummary[status] || 0}</strong>
                  <small>{status === "done" ? "Resolved" : "Active"}</small>
                </div>
              ))}
              <div className={styles.statusSummaryItem}>
                <span className={`${styles.priorityBadge} ${styles.priorityMedium}`}>Your queue</span>
                <strong>{assignedTickets.length}</strong>
                <small>Assigned to you</small>
              </div>
            </div>

            <div className={styles.timelineList}>
              {latestActivity.length === 0 ? (
                <div className={styles.emptyState}>No ticket activity yet.</div>
              ) : (
                latestActivity.map((ticket) => (
                  <div key={`activity-${ticket.id}`} className={styles.timelineItem}>
                    <div>
                      <p className={styles.timelineTitle}>{ticket.title}</p>
                      <p className={styles.timelineMeta}>
                        {`${ticket.createdBy?.name || "Unknown"} → ${ticket.assignedTo?.name || "Unassigned"}`}
                      </p>
                    </div>
                    <div className={styles.timelineTime}>
                      {formatRelativeTime(ticket.updatedAt || ticket.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Ticket Ledger</h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.taskFlowTable}>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Created By</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">Loading...</td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan="5">No tickets recorded yet.</td>
                  </tr>
                ) : (
                  tickets.slice(0, 12).map((ticket) => (
                    <tr key={`table-${ticket.id}`}>
                      <td>{ticket.title}</td>
                      <td>{ticket.createdBy?.name || "Unknown"}</td>
                      <td>{ticket.assignedTo?.name || "Unassigned"}</td>
                      <td>
                        <span className={`${styles.priorityBadge} ${statusBadgeClass(ticket.status)}`}>
                          {statusFilters.find((opt) => opt.value === ticket.status)?.label || ticket.status}
                        </span>
                      </td>
                      <td>{ticket.deadline}</td>
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

export default Tickets;
