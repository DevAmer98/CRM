"use client";
import React, { useEffect, useState } from "react";
import styles from "../main/main.module.css";
import Card from "../../hr_dashboard/card/card";
import CardWithout from "../../hr_dashboard/card/without";
import CustomPieChart from "../charts/customChart";
import DashedLineChart from "../charts/stnadart";
import TinyBarChart from "../charts/bar";
import DualYAxisBarChart from "../charts/dualYaxis";
import ColorfullPieChart from "../charts/colorfull";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import Link from "next/link";
import HeaderNavigation from "@/components/ui/HeaderNavigation";
 

const Totals = () => {

  const [counts, setCounts] = useState({
      userCount: null,
      clientCount: null,
      supplierCount: null
    }); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roleStats, setRoleStats] = useState([]);

    

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


          const roleRes = await fetch(`${domain}/api/userRoleStats`, { cache: 'no-store' });
          if (!roleRes.ok) throw new Error('Failed to fetch role stats');
          const { stats } = await roleRes.json();
          setRoleStats(stats);

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



const getLegendColor = (index) => {
  const colors = [
    styles.legendDotBlue,
    styles.legendDotGreen,
    styles.legendDotYellow,
    styles.legendDotRed,
    styles.legendDotCyan,
    styles.legendDotPurple,
    styles.legendDotOrange,
  ];
  return colors[index % colors.length];
};

const formatRoleName = (role) => {
  return role
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
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



  const getStatusColor = (shift) => {
    switch (shift) {
      case "Not Started": return styles.legendDotBlue;
      case "Completed": return styles.legendDotGreen;
      case "In Progress": return styles.legendDotYellow;
      case "Delayed": return styles.legendDotRed;
      case "On Hold": return styles.legendDotCyan;

      default: return styles.legendDot;
    }
  }; 

  const activeShiftsCount = currentShifts.filter(s => s.status === "active").length;
  const onBreakCount = currentShifts.filter(s => s.status === "break").length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        
    <HeaderNavigation />
    
    </div>
      <div className={styles.wrapper}>
        <div className={styles.main}>
          <div className={styles.cards}>
            {counts.userCount !== null ? (
              <Card
                key="total-users-card"
                title="Total Projects"
                number={counts.userCount}
                detailText={`${counts.userCount} registered projects`}
              />
            ) : (
              <p>Loading Projects...</p>
            )}
            {counts.clientCount !== null ? (
              <Card
                key="total-client-card"
                title="Overdue Projects"
                number={counts.clientCount}
                detailText={`${counts.clientCount} registered overdue projects`}
              />
            ) : (
              <p>Loading Projects...</p>
            )}
           
             
          </div>
        </div>
      </div>

      
 
      <div className={styles.bossGrid}>
      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Current Active Shifts */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Active Shifts</h3>
            <span className={styles.cardIcon}>⏰</span>
          </div>
          <div className={styles.taskList}>
            {currentShifts.map((shift, index) => (
              <div key={index} className={styles.taskItem}>
                <div className={styles.taskContent}>
                  <div className={`${styles.iconContainer} ${styles.iconBlue}`} style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {shift.employee.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={styles.taskDetails}>
                    <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                      {shift.employee}
                    </p> 
                    <p className={styles.taskStatus}>
                      {shift.position} • {shift.timeLeft} left
                    </p>
                  </div>
                </div>
                <span className={getShiftStatusClass(shift.status)}>
                  {shift.status}
                </span>
              </div>
            ))}
          </div>
        </div>


<div className={styles.card}>
  <div className={styles.cardHeader}>
    <h3 className={styles.cardTitle}>Status Wise Projects</h3>
    <span className={styles.cardIcon}>📊</span>
  </div>
  {/* Optional: static chart or image */}
  <ColorfullPieChart data={[
    { role: 'Not Started', count: 5 },
    { role: 'Completed', count: 12 },
    { role: 'In Progress', count: 8 },
    { role: 'Delayed', count: 3 },
    { role: 'On Hold', count: 2 },
  ]} />
  <div className={styles.statusLegend}>
    {[
      { role: 'Not Started', count: 5 },
      { role: 'Completed', count: 12 },
      { role: 'In Progress', count: 8 },
      { role: 'Delayed', count: 3 },
      { role: 'On Hold', count: 2 },
    ].map((item) => (
      <div key={item.role} className={styles.statusLegendItem}>
        <div className={styles.statusLegendLabel}>
          <div className={`${styles.legendDot} ${getStatusColor(item.role)}`}></div>
          <span className={styles.statusLegendText}>{item.role}</span>
        </div>
        <span className={styles.statusLegendValue}>{item.count}</span>
      </div>
    ))}
  </div>
</div>


        {/* Department Overview */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Department Coverage</h3>
            <span className={styles.cardIcon}>🏢</span>
          </div>
          <div className={styles.taskList}>
            {["Sales", "IT", "Customer Service", "Design", "Operations"].map((dept) => {
              const deptShifts = shifts.filter(s => s.department === dept);
              const activeCount = deptShifts.filter(s => s.status === "active").length;
              
              return (
                <div key={dept} className={styles.taskItem}>
                  <div className={styles.taskContent}>
                    <div className={styles.taskDetails}>
                      <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                        {dept}
                      </p>
                      <p className={styles.taskStatus}>
                        {deptShifts.length} scheduled • {activeCount} active
                      </p>
                    </div>
                  </div>
                  <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                      <div className={`${styles.legendDot} ${styles.legendDotGreen}`}></div>
                      <span className={styles.legendText}>{activeCount}</span>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={`${styles.legendDot} ${styles.legendDotBlue}`}></div>
                      <span className={styles.legendText}>{deptShifts.length - activeCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Totals;