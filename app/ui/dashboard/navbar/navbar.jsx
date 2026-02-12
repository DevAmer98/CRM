"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./navbar.module.css";
import { CirclePlus, MessageSquare, Power, UserRound, Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import TaskForm from "../../forms/task/task";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getTaskById, getTasks, getTickets, getTaskReplyNotifications } from "@/app/lib/actions";
import DialogCss from "../dialog/dialog";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";


const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [replyTasks, setReplyTasks] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalError, setApprovalError] = useState("");
  const [leaveCount, setLeaveCount] = useState(0);
  const [leaveError, setLeaveError] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const plusMenuRef = useRef(null);
  const plusButtonRef = useRef(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const isApprovalViewer = [
    "admin",
    "superadmin",
    "super_admin",
    "hradmin",
    "hr_admin",
    "salesadmin",
    "sales_admin",
  ].includes((session?.user?.role || "").toLowerCase());
  const isHrDashboard = pathname?.startsWith("/hr_dashboard");

  useEffect(() => {
    let isMounted = true;
    if (!session?.user?.id) {
      setTasks([]);
      setTickets([]);
      setReplyTasks([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        const [taskData, ticketData, replyData] = await Promise.all([
          getTasks(),
          getTickets(),
          getTaskReplyNotifications(),
        ]);
        if (!isMounted) return;
        setTasks(taskData || []);
        setTickets(ticketData || []);
        setReplyTasks(replyData || []);
      } catch (err) {
        console.error("Failed to refresh message notifications:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    const handleRefresh = () => fetchMessages();
    if (typeof window !== "undefined") {
      window.addEventListener("message-badge-refresh", handleRefresh);
    }
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("message-badge-refresh", handleRefresh);
      }
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (soundEnabled) return;
    const enableSound = () => setSoundEnabled(true);
    window.addEventListener("pointerdown", enableSound, { once: true });
    window.addEventListener("keydown", enableSound, { once: true });
    return () => {
      window.removeEventListener("pointerdown", enableSound);
      window.removeEventListener("keydown", enableSound);
    };
  }, [soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) return;
    prevMessageCountRef.current = messageCount;
  }, [soundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const context = audioContextRef.current;
      if (context.state === "suspended") {
        context.resume();
      }
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.45);
    } catch (error) {
      console.error("Notification sound failed:", error);
    }
  }, []);

  useEffect(() => {
    if (!showPlusMenu) return;
    const handleClickOutside = event => {
      const target = event.target;
      if (!target) return;
      if (plusMenuRef.current?.contains(target)) return;
      if (plusButtonRef.current?.contains(target)) return;
      setShowPlusMenu(false);
    };

    const handleEscape = event => {
      if (event.key === "Escape") {
        setShowPlusMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showPlusMenu]);

  useEffect(() => {
    if (!isApprovalViewer || isHrDashboard) {
      setPendingApprovals([]);
      setApprovalError("");
      return;
    }
    let isMounted = true;

    const fetchApprovals = async () => {
      try {
        const response = await fetch("/api/approvalNotifications", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load approval notifications.");
        }
        const data = await response.json();
        if (isMounted) {
          setPendingApprovals(Array.isArray(data) ? data : []);
          setApprovalError("");
        }
      } catch (error) {
        console.error("Error fetching approval notifications:", error);
        if (isMounted) {
          setApprovalError(error?.message || "Failed to load approval notifications.");
        }
      }
    };

    fetchApprovals();
    const interval = setInterval(fetchApprovals, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isApprovalViewer, isHrDashboard]);

  useEffect(() => {
    if (!isHrDashboard) {
      setLeaveCount(0);
      setLeaveError("");
      return;
    }
    let isMounted = true;
    const fetchLeaves = async () => {
      try {
        const res = await fetch("/api/leaves/pending-count", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load leave requests.");
        }
        const data = await res.json();
        if (isMounted) {
          setLeaveCount(data?.count || 0);
          setLeaveError("");
        }
      } catch (error) {
        console.error("Error fetching leave requests:", error);
        if (isMounted) {
          setLeaveError(error?.message || "Failed to load leave requests.");
        }
      }
    };

    fetchLeaves();
    const interval = setInterval(fetchLeaves, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isHrDashboard]);

  // Account editing moved to /dashboard/profile

  const openDialog = async (taskOrId) => {
    setDialogLoading(true);
    setShowDialog(true);

    const taskId = typeof taskOrId === 'object' ? taskOrId.id : taskOrId;

    try {
      const fullTask = await getTaskById(taskId);
      setSelectedTask(fullTask);
    } catch {
      setSelectedTask(
        typeof taskOrId === 'object'
          ? { ...taskOrId, description: 'Failed to load description.' }
          : { id: taskId, title: 'Unknown Task', description: 'Failed to load description.' }
      );
    } finally {
      setDialogLoading(false);
    }
  };

  const getCurrentPageName = () => {
    const pageName = pathname.split("/").pop();
    if (!pageName) return "Dashboard"; // Default for root path

    return pageName
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const pendingTasks = tasks.filter(task => task.status !== 'done');
  const pendingTickets = tickets.filter(ticket => ticket.status !== 'done');
  const messageCount = pendingTasks.length + pendingTickets.length + replyTasks.length;
  const hasMessageNotifications = messageCount > 0;
  const approvalCount = pendingApprovals.length;
  const hasApprovals = approvalCount > 0;

  useEffect(() => {
    const prev = prevMessageCountRef.current;
    if (soundEnabled && messageCount > prev) {
      playNotificationSound();
    }
    prevMessageCountRef.current = messageCount;
  }, [messageCount, soundEnabled, playNotificationSound]);

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        {/* Left: Page Title */}
        <div className="text-center text-xl font-semibold text-[var(--textSoft)] pb-4 border-b border-[var(--input-border)]/30">
          {getCurrentPageName()}
        </div>

        {/* Right: Menu */}
        <div className={styles.menu}>
          <div className={styles.icons}>
            {/* Plus Icon Dropdown */}
            <div className="relative" ref={plusMenuRef}>
              <button
                ref={plusButtonRef}
                className={styles.plusButton}
                onClick={() => setShowPlusMenu(!showPlusMenu)}
              >
                <CirclePlus size={23} />
              </button>

           {showPlusMenu && (
  <div
    className={styles.plusMenu}
  >
    <div className={styles.plusMenuList}>
      <button
        className={styles.plusMenuItem}
        onClick={() => {
          setShowPlusMenu(false);
          setShowTaskDialog(true);
        }}
      >
        <CirclePlus className="w-4 h-4" style={{ color: "var(--primary)" }} />
        <span>Create Task</span>
      </button>

    </div>
  </div>
)}

            </div>

            {/* Messages Link (Tasks + Tickets) */}
            <div className="relative">
              <Link
                href={isHrDashboard ? "/hr_dashboard/private" : "/dashboard/private"}
                aria-label="Open private dashboard"
              >
                <span className={`${styles.messageIconButton} ${styles.iconButtonAligned}`}>
                  <MessageSquare className="text-[var(--textSoft)]" />
                  {hasMessageNotifications && (
                    <span className={styles.navBadge}>
                      {messageCount}
                    </span>
                  )}
                </span>
              </Link>
            </div>

            {/* Notifications Dropdown (Approvals) */}
            {isApprovalViewer && !isHrDashboard && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBellDropdown(!showBellDropdown);
                    setShowMessageDropdown(false);
                  }}
                >
                  <Bell className="text-[var(--textSoft)]" />
                  {hasApprovals && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {approvalCount}
                    </span>
                  )}
                </button>

                {showBellDropdown && (
                  <div className={styles.dropdown}>
                    {pendingApprovals.length > 0 && (
                      <>
                        <div className={styles.dropdownHeader}>
                          <span>Pending Approvals</span>
                        </div>
                        <ul className={styles.dropdownList}>
                          {pendingApprovals.map((approval) => (
                            <li key={approval.id} className={styles.dropdownItem}>
                              <Link
                                href={`/dashboard/approves/${approval.id}`}
                                className="flex flex-col gap-1 text-sm"
                                onClick={() => setShowBellDropdown(false)}
                              >
                                <span className="font-medium text-[var(--text)]">
                                  {approval.quotationId || "Quotation"}
                                </span>
                                <span className="text-xs text-[var(--textSoft)]">
                                  {approval.clientName}
                                  {approval.projectName ? ` • ${approval.projectName}` : ""}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {!hasApprovals && !approvalError && (
                      <div className={styles.dropdownEmpty}>You're all caught up!</div>
                    )}
                    {approvalError && (
                      <div className={styles.dropdownEmpty}>{approvalError}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isHrDashboard && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBellDropdown(!showBellDropdown);
                    setShowMessageDropdown(false);
                  }}
                >
                  <Bell className="text-[var(--textSoft)]" />
                  {leaveCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {leaveCount}
                    </span>
                  )}
                </button>

                {showBellDropdown && (
                  <div className={styles.dropdown}>
                    {leaveCount > 0 && (
                      <>
                        <div className={styles.dropdownHeader}>
                          <span>Pending Leave Requests</span>
                        </div>
                        <ul className={styles.dropdownList}>
                          <li className={styles.dropdownItem}>
                            <Link
                              href="/hr_dashboard/leaves"
                              className="flex flex-col gap-1 text-sm"
                              onClick={() => setShowBellDropdown(false)}
                            >
                              <span className="font-medium text-[var(--text)]">
                                {leaveCount} pending request{leaveCount === 1 ? "" : "s"}
                              </span>
                              <span className="text-xs text-[var(--textSoft)]">
                                Review in Leave Requests
                              </span>
                            </Link>
                          </li>
                        </ul>
                      </>
                    )}

                    {leaveCount === 0 && !leaveError && (
                      <div className={styles.dropdownEmpty}>You're all caught up!</div>
                    )}
                    {leaveError && (
                      <div className={styles.dropdownEmpty}>{leaveError}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Link
              href="/dashboard/profile"
              className="text-[var(--textSoft)] hover:text-[var(--primary)] transition-colors relative -translate-y-1"
              title="Account"
            >
              <UserRound />
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[var(--textSoft)] hover:text-[var(--primary)] transition-colors relative -translate-y-1"
              title="Logout"
            >
              <Power />
            </button>

          </div>
        </div>
      </div>

      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent
          className="w-[95vw] sm:max-w-md p-6 overflow-hidden"
          style={{
            backgroundColor: "var(--bgSoft)",
            border: "1px solid var(--border)",
            borderRadius: "var(--border-radius)",
            boxShadow: "var(--shadow-lg)",
            color: "var(--text)",
          }}
        >
          <DialogTitle className="text-2xl font-semibold text-center mb-4" style={{ color: "var(--textSoft)" }}>
            Create a Task
          </DialogTitle>
          <TaskForm />
        </DialogContent>
      </Dialog>

      <DialogCss
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
        setTasks={setTasks}
        setShowDropdown={setShowMessageDropdown}
      />
    </div>
  );
};

export default Navbar;
