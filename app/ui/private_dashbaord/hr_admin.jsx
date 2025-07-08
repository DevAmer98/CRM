"use client";
import React, { useEffect, useState } from "react";
import styles from "../dashboard/main/main.module.css";
import TaskTable from "../dashboard/table/TaskTable";
import { getTasks } from "@/app/lib/actions";
import TicketTable from "../dashboard/table/TicketTable";
import { useSession } from "next-auth/react";



 


const HR_AdminPage = () => {
   const { data: session, status } = useSession();
console.log("Session data:", session);


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
  const data = await getTasks();
  setTasks(data || []);
  setLoadingTasks(false);
};

useEffect(() => {
  reloadTasks();
}, []);

  useEffect(() => {
    getTasks().then(data => {
      setTasks(data || []);
    });
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
  
   
 
  const [shifts, setShifts] = useState([
    { id: 1, employee: "John Smith", position: "Manager", shift: "Morning", time: "8:00 AM - 4:00 PM", status: "scheduled", department: "Sales" },
    { id: 2, employee: "Sarah Johnson", position: "Developer", shift: "Day", time: "9:00 AM - 5:00 PM", status: "active", department: "IT" },
    { id: 3, employee: "Mike Chen", position: "Support", shift: "Evening", time: "2:00 PM - 10:00 PM", status: "scheduled", department: "Customer Service" },
    { id: 4, employee: "Lisa Rodriguez", position: "Designer", shift: "Morning", time: "8:30 AM - 4:30 PM", status: "active", department: "Design" },
    { id: 5, employee: "David Wilson", position: "Analyst", shift: "Night", time: "10:00 PM - 6:00 AM", status: "scheduled", department: "Operations" }
  ]);

  const [currentShifts, setCurrentShifts] = useState([
    { employee: "Sarah Johnson", position: "Developer", timeLeft: "3h 45m", status: "active" },
    { employee: "Lisa Rodriguez", position: "Designer", timeLeft: "2h 15m", status: "active" },
    { employee: "Tom Anderson", position: "QA Tester", timeLeft: "1h 30m", status: "break" },
    { employee: "Emma Davis", position: "Project Manager", timeLeft: "4h 20m", status: "active" }
  ]);

  const [birthdaysToday] = useState([
  { name: "Emily Stone", position: "UX Designer" },
  { name: "Carlos Rivera", position: "Sales Lead" }
]);

  const pendingTasks = tasks.filter(task => task.status !== 'done');
  const doneTasks = tasks.filter(task => task.status === 'done');



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

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
<div className={styles.cardHeader}></div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Projects Card */}
  <div className={styles.taskItem}>
    {(() => {
      const deptShifts = shifts.filter(s => s.department === "My Task");
      const activeCount = deptShifts.filter(s => s.status === "active").length;
      return (
        <>
          <div className={styles.taskContent}>
            <div className={styles.taskDetails}>
              <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                Tasks
              </p>
              <p className={styles.taskStatus}>
                {pendingTasks.length} Pending • {doneTasks.length} Done
              </p>
            </div>
          </div>
          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.legendDotRed}`}></div>
      <span className={styles.legendText}>{pendingTasks.length}</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.legendDotBlue}`}></div>
      <span className={styles.legendText}>{doneTasks.length}</span>
            </div>
          </div>
        </>
      );
    })()} 
  </div>

  <div className={styles.taskItem}>
    {(() => {
      const deptShifts = shifts.filter(s => s.department === "My Task");
      const activeCount = deptShifts.filter(s => s.status === "active").length;
      return (
        <>
          <div className={styles.taskContent}>
            <div className={styles.taskDetails}>
              <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                Tickets
              </p>
              <p className={styles.taskStatus}>
                {pendingTasks.length} Pending • {doneTasks.length} Done
              </p>
            </div>
          </div>
          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.legendDotRed}`}></div>
      <span className={styles.legendText}>{pendingTasks.length}</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.legendDotBlue}`}></div>
      <span className={styles.legendText}>{doneTasks.length}</span>
            </div>
          </div>
        </>
      );
    })()} 
  </div>
</div>
      </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<TaskTable tasks={tasks} loading={loadingTasks} reloadTasks={reloadTasks} />
<TicketTable tasks={tasks} loading={loadingTasks} reloadTasks={reloadTasks} />
</div>
    </div>
  );
};

export default HR_AdminPage;