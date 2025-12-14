"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./navbar.module.css";
import { Bell, CirclePlus, MessageSquare, Power, Search, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import TaskForm from "../../forms/task/task";
import TicketForm from "../../forms/ticket/ticket";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTaskById, getTasks } from "@/app/lib/actions";
import DialogCss from "../dialog/dialog";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";


const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalError, setApprovalError] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    getTasks().then(data => {
      setTasks(data || []);
    });
  }, []);

  useEffect(() => {
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
  }, []);

  const fetchAccountDetails = useCallback(async () => {
    setAccountLoading(true);
    setAccountError("");
    try {
      const response = await fetch("/api/account", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load account details.");
      }

      setAccountData(payload.user);
      setAccountForm(prev => ({
        ...prev,
        username: payload.user?.username || "",
        email: payload.user?.email || "",
        phone: payload.user?.phone || "",
        address: payload.user?.address || "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      setAccountError(error?.message || "Unable to load your account.");
    } finally {
      setAccountLoading(false);
    }
  }, []);

  const handleAccountOpenChange = useCallback(
    open => {
      setShowAccountDialog(open);
      if (open) {
        fetchAccountDetails();
      } else {
        setAccountMessage("");
        setAccountError("");
        setAccountForm(prev => ({
          ...prev,
          newPassword: "",
          confirmPassword: "",
        }));
      }
    },
    [fetchAccountDetails]
  );

  const handleAccountFieldChange = (field, value) => {
    setAccountForm(prev => ({
      ...prev,
      [field]: value,
    }));
    if (accountError) setAccountError("");
    if (accountMessage) setAccountMessage("");
  };

  const handleAccountSubmit = async event => {
    event.preventDefault();
    setAccountError("");
    setAccountMessage("");

    if (!accountForm.username.trim()) {
      setAccountError("Username is required.");
      return;
    }

    if (!accountForm.email.trim()) {
      setAccountError("Email is required.");
      return;
    }

    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      setAccountError("New passwords do not match.");
      return;
    }

    const payload = {
      username: accountForm.username.trim(),
      email: accountForm.email.trim(),
      phone: accountForm.phone || "",
      address: accountForm.address || "",
    };

    if (accountForm.newPassword) {
      payload.password = accountForm.newPassword;
    }

    setAccountSaving(true);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update account.");
      }

      setAccountData(data.user);
      setAccountMessage("Account updated successfully.");
      setAccountForm(prev => ({
        ...prev,
        username: data.user?.username || prev.username,
        email: data.user?.email || prev.email,
        phone: data.user?.phone || "",
        address: data.user?.address || "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      setAccountError(error?.message || "Unable to update account.");
    } finally {
      setAccountSaving(false);
    }
  };

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
  const notificationCount = pendingTasks.length + pendingApprovals.length;
  const hasNotifications = notificationCount > 0;

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        {/* Left: Page Title */}
        <div className="text-center text-xl font-semibold text-[var(--textSoft)] pb-4 border-b border-[var(--input-border)]/30">
          {getCurrentPageName()}
        </div>

        {/* Right: Menu */}
        <div className={styles.menu}>
          <div className={styles.search}>
            <Search />
            <input
              type="text"
              placeholder="Search..."
              className={styles.input}
            />
          </div>

          <div className={styles.icons}>
            {/* Plus Icon Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 text-[var(--primary)] hover:underline"
                onClick={() => setShowPlusMenu(!showPlusMenu)}
              >
                <CirclePlus size={20} />
              </button>

           {showPlusMenu && (
  <div
    className="absolute right-0 mt-2 min-w-48 z-50 animate-fade-in"
    style={{
      backgroundColor: "var(--bgSoft)",
      border: "1px solid var(--border)",
      borderRadius: "var(--border-radius)",
      boxShadow: "var(--shadow-md)",
    }}
  >
    <div className="py-1 flex flex-col">
      <Dialog>
        <DialogTrigger asChild>
          <button
            className="w-full flex items-center gap-2 text-sm px-4 py-3 transition-colors"
            style={{
              color: "var(--textSoft)",
              borderTopLeftRadius: "var(--border-radius)",
              borderTopRightRadius: "var(--border-radius)",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--input-background)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <CirclePlus className="w-4 h-4" style={{ color: "var(--primary)" }} />
            <span>Create Task</span>
          </button>
        </DialogTrigger>
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

      <Dialog>
        <DialogTrigger asChild>
          <button
            className="w-full flex items-center gap-2 text-sm px-4 py-3 transition-colors"
            style={{
              color: "var(--textSoft)",
              borderBottomLeftRadius: "var(--border-radius)",
              borderBottomRightRadius: "var(--border-radius)",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--input-background)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <CirclePlus className="w-4 h-4" style={{ color: "var(--primary)" }} />
            <span>Create Ticket</span>
          </button>
        </DialogTrigger>
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
            Create a Ticket
          </DialogTitle>
          <TicketForm />
        </DialogContent>
      </Dialog>
    </div>
  </div>
)}

            </div>

            {/* Messages Icon */}
            <MessageSquare />

            {/* Notifications Dropdown */}
            <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)}>
                <Bell className="text-[var(--textSoft)]" />
                {hasNotifications && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>

              {showDropdown && (
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
                              onClick={() => setShowDropdown(false)}
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

                  {pendingTasks.length > 0 && (
                    <>
                      <div className={styles.dropdownHeader}>
                        <span>New Tasks</span>
                      </div>
                      <ul className={styles.dropdownList}>
                        {pendingTasks.map(task => (
                          <li
                            key={task.id}
                            className={styles.dropdownItem}
                            onClick={() => openDialog(task)}
                          >
                            {task.title}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {!hasNotifications && !approvalError && (
                    <div className={styles.dropdownEmpty}>You're all caught up!</div>
                  )}
                  {approvalError && (
                    <div className={styles.dropdownEmpty}>{approvalError}</div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => handleAccountOpenChange(true)}
              className="text-[var(--textSoft)] hover:text-[var(--primary)] transition-colors relative -translate-y-1"
              title="Account"
            >
              <UserRound />
            </button>

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

      <Dialog open={showAccountDialog} onOpenChange={handleAccountOpenChange}>
        <DialogContent className={styles.accountDialogContent}>
          <div className={styles.accountDialog}>
            <div className={styles.accountHeader}>
              <div className={styles.accountHeaderTop}>
                <div className={styles.accountHeaderInfo}>
                  <DialogTitle className={styles.accountTitle}>Account Settings</DialogTitle>
                  {session?.user?.role && (
                    <p className={styles.accountRole}>Role · {session.user.role}</p>
                  )}
                </div>
                {accountData?.email && <span className={styles.accountBadge}>{accountData.email}</span>}
              </div>
              {accountData?.updatedAt && (
                <p className={styles.accountMeta}>
                  Last updated{" "}
                  {new Date(accountData.updatedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className={styles.accountBody}>
              {accountError && <p className={`${styles.accountAlert} ${styles.accountAlertError}`}>{accountError}</p>}
              {accountMessage && (
                <p className={`${styles.accountAlert} ${styles.accountAlertSuccess}`}>{accountMessage}</p>
              )}

              {accountLoading ? (
                <div className={styles.accountLoading}>Loading your account…</div>
              ) : accountData ? (
                <form onSubmit={handleAccountSubmit} className={styles.accountForm}>
                  <div className={styles.accountGrid}>
                    <section className={`${styles.accountCard} ${styles.accountCardProfile}`}>
                      <div className={styles.accountCardHeading}>
                        <p className={styles.accountCardTitle}>Profile</p>
                        <p className={styles.accountCardSubtitle}>Basic account information</p>
                      </div>
                      <div className={styles.accountFields}>
                        <div className={styles.accountTwoColumn}>
                          {[
                            { label: "Username", type: "text", field: "username" },
                            { label: "Email", type: "email", field: "email" },
                          ].map(item => (
                            <label key={item.field} className={styles.accountLabel}>
                              <span>{item.label}</span>
                              <input
                                type={item.type}
                                value={accountForm[item.field]}
                                onChange={e => handleAccountFieldChange(item.field, e.target.value)}
                                className={styles.accountInput}
                              />
                            </label>
                          ))}
                        </div>
                        <label className={styles.accountLabel}>
                          <span>Phone</span>
                          <input
                            type="tel"
                            value={accountForm.phone}
                            onChange={e => handleAccountFieldChange("phone", e.target.value)}
                            className={styles.accountInput}
                          />
                        </label>
                        <label className={`${styles.accountLabel} ${styles.accountLabelTextarea}`}>
                          <span>Address</span>
                          <textarea
                            value={accountForm.address}
                            onChange={e => handleAccountFieldChange("address", e.target.value)}
                            rows={3}
                            className={`${styles.accountInput} ${styles.accountTextarea}`}
                          />
                        </label>
                      </div>
                    </section>

                    <section className={`${styles.accountCard} ${styles.accountCardSecurity}`}>
                      <div className={styles.accountCardHeading}>
                        <p className={styles.accountCardTitle}>Security</p>
                        <p className={styles.accountCardSubtitle}>Update your password</p>
                      </div>
                      <div className={styles.accountFieldsColumn}>
                        <div className={styles.accountTwoColumn}>
                          {[
                            { label: "New Password", field: "newPassword" },
                            { label: "Confirm Password", field: "confirmPassword" },
                          ].map(item => (
                            <label key={item.field} className={styles.accountLabel}>
                              <span>{item.label}</span>
                              <input
                                type="password"
                                value={accountForm[item.field]}
                                onChange={e => handleAccountFieldChange(item.field, e.target.value)}
                                className={styles.accountInput}
                              />
                            </label>
                          ))}
                        </div>
                        <p className={styles.accountNote}>
                          Leave both password fields empty if you do not want to update your password.
                        </p>
                      </div>
                    </section>
                  </div>

                  <div className={styles.accountFooter}>
                    <button
                      type="button"
                      onClick={() => handleAccountOpenChange(false)}
                      className={`${styles.accountButton} ${styles.accountButtonGhost}`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`${styles.accountButton} ${styles.accountButtonPrimary}`}
                      disabled={accountSaving}
                    >
                      {accountSaving ? "Saving changes…" : "Save changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.accountLoadError}>
                  <p>We couldn't load your account details.</p>
                  <button onClick={fetchAccountDetails}>Try again</button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DialogCss
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
        setTasks={setTasks}
        setShowDropdown={setShowDropdown}
      />
    </div>
  );
};

export default Navbar;
