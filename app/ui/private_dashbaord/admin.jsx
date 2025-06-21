"use client";
import React, { useEffect, useState } from "react";
import styles from "../dashboard/main/main.module.css";
import CardWithout from "../../ui/hr_dashboard/card/without";
import CustomPieChart from "../../ui/dashboard/charts/customChart";
import DashedLineChart from "../../ui/dashboard/charts/stnadart";
import TinyBarChart from "../../ui/dashboard/charts/bar";
import DualYAxisBarChart from "../../ui/dashboard/charts/dualYaxis";
import ColorfullPieChart from "../../ui/dashboard/charts/colorfull";
import Card from "../hr_dashboard/card/card";





const AdminPage = () => {
 

  const [counts, setCounts] = useState({
      userCount: null,
      clientCount: null,
      supplierCount: null
    }); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
  
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
  
   
  
   
  const [tasks, setTasks] = useState([
    { id: 1, title: "Review quarterly reports", status: "completed", priority: "high" },
    { id: 2, title: "Team meeting preparation", status: "in-progress", priority: "medium" },
    { id: 3, title: "Update client dashboard", status: "pending", priority: "high" },
    { id: 4, title: "Code review session", status: "in-progress", priority: "low" },
    { id: 5, title: "Design system updates", status: "pending", priority: "medium" }
  ]);

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





  const toggleTaskStatus = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === "completed" ? "pending" : "completed" }
        : task
    ));
  };

  const getTaskIconClass = (status) => {
    switch (status) {
      case "completed": return styles.taskIconCompleted;
      case "in-progress": return styles.taskIconInProgress;
      case "pending": return styles.taskIconPending;
      default: return "";
    }
  };

  const getTaskIcon = (status) => {
    switch (status) {
      case "completed": return "✅";
      case "in-progress": return "🔄";
      case "pending": return "⏳";
      default: return "📝";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high": return styles.priorityHigh;
      case "medium": return styles.priorityMedium;
      case "low": return styles.priorityLow;
      default: return "";
    }
  };

  const getTaskStatusClass = (status) => {
    switch (status) {
      case "completed": return styles.taskIconCompleted;
      case "in-progress": return styles.taskIconInProgress;
      case "pending": return styles.taskIconPending;
      default: return "";
    }
  };

  const getShiftStatusClass = (status) => {
    switch (status) {
      case "active": return `${styles.priorityLow}`;
      case "scheduled": return `${styles.priorityMedium}`;
      case "break": return `${styles.priorityHigh}`;
      case "ended": return `${styles.priorityBadge}`;
      default: return styles.priorityBadge;
    }
  };

  const getShiftTypeColor = (shift) => {
    switch (shift) {
      case "Morning": return styles.legendDotBlue;
      case "Day": return styles.legendDotGreen;
      case "Evening": return styles.legendDotYellow;
      case "Night": return styles.legendDotRed;
      default: return styles.legendDot;
    }
  };

  const activeShiftsCount = currentShifts.filter(s => s.status === "active").length;
  const onBreakCount = currentShifts.filter(s => s.status === "break").length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Hi, Ahmad</h1>
        <p className={styles.headerSubtitle}>
          Welcome back! Here's what's happening today.
        </p>
      </div>
      <div className={styles.wrapper}>
        <div className={styles.main}>
        
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        
     

       
      </div>
      <div className={styles.bossGrid}>
 
  
   <div className={styles.taskGrid}>
     
      
     {/* Tasks Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Recent Tasks</h3>
            <span className={styles.cardIcon}>📅</span>
          </div>
          <div className={styles.taskList}>
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`${styles.taskItem} ${task.status === "completed" ? styles.taskItemCompleted : ""}`}
                onClick={() => toggleTaskStatus(task.id)}
              >
                <div className={styles.taskContent}>
                  <span className={`${styles.taskIcon} ${getTaskIconClass(task.status)}`}>
                    {getTaskIcon(task.status)}
                  </span>
                  <div className={styles.taskDetails}>
                    <p className={`${styles.taskTitle} ${task.status === "completed" ? styles.taskTitleCompleted : styles.taskTitleActive}`}>
                      {task.title}
                    </p>
                    <p className={`${styles.taskStatus} ${getTaskStatusClass(task.status)}`}>
                      {task.status.replace("-", " ")}
                    </p>
                  </div>
                </div>
                <span className={`${styles.priorityBadge} ${getPriorityClass(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.taskCard}>
          <div className={styles.statCardContent}>
            <div className={styles.statCardText}>
              <p className={styles.statCardLabel}>Active Tasks</p>
              <p className={styles.statCardValue}>
                {tasks.filter(t => t.status !== "completed").length}
              </p>
              <p className={`${styles.statCardChange} ${styles.statCardChangeOrange}`}>
                {tasks.filter(t => t.status === "completed").length} completed
              </p>
            </div>
            <div className={`${styles.iconContainer} ${styles.iconPurple}`}>
              ⚡
            </div>
          </div>
        </div>

</div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
       


        {/*Birthday card */}

<div className={styles.card}>
  <div className={styles.cardHeader}>
    <h3 className={styles.cardTitle}>🎂 Birthdays Today</h3>
    <span className={styles.iconBirthday}>🎉</span>
  </div>
  <div className={styles.taskList}>
    {birthdaysToday.map((person, index) => (
      <div key={index} className={styles.taskItem}>
        <div className={styles.taskContent}>
          <div className={`${styles.iconContainer} ${styles.iconPurple}`}>
            {person.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className={styles.taskDetails}>
            <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
              {person.name}
            </p>
            <p className={styles.taskStatus}>
              {person.position}
            </p>
          </div>
        </div>
        <span className={`${styles.priorityBadge} ${styles.priorityLow}`}>
          🎈 Wish!
        </span>
      </div>
    ))}
    {birthdaysToday.length === 0 && (
      <p className={styles.taskStatus}>No birthdays today.</p>
    )}
  </div>
</div>

      </div>
    </div>
    </div>
  );
};

export default AdminPage;