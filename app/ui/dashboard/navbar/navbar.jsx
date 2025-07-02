"use client";
import { usePathname } from "next/navigation";
import styles from "./navbar.module.css";
import { Bell, CirclePlus, MessageSquare, Power, Search } from "lucide-react";
import { useEffect, useState } from "react";
import TaskForm from "../../forms/task/task";
import TicketForm from "../../forms/ticket/ticket";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTaskById, getTasks } from "@/app/lib/actions";
import DialogCss from "../dialog/dialog";
import { signOut } from "next-auth/react";


const Navbar = () => {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  useEffect(() => {
    getTasks().then(data => {
      setTasks(data || []);
    });
  }, []);

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
                {pendingTasks.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingTasks.length}
                  </span>
                )}
              </button>

              {showDropdown && pendingTasks.length > 0 && (
                <div className={styles.dropdown}>
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
                </div>
              )}
            </div>

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
