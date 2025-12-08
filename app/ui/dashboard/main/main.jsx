"use client";
import React, { useEffect, useState } from "react";
import styles from "./main.module.css";
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
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
 

const Main = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [counts, setCounts] = useState({
      userCount: null,
      clientCount: null,
      supplierCount: null
    }); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roleStats, setRoleStats] = useState([]);
    const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const [showMasterCongrats, setShowMasterCongrats] = useState(false);
    const [hrRedirecting, setHrRedirecting] = useState(false);






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

    useEffect(() => {
      if (status !== "authenticated") return;
      const username = (session?.user?.username || "").toLowerCase();
      const celebratedUsers = ["masteradmin", "lama.zahrani"];
      if (!celebratedUsers.includes(username)) return;

      if (typeof window !== "undefined") {
        const storageKey = `congratsShown:${username}`;
        const alreadyShown = sessionStorage.getItem(storageKey);
        if (!alreadyShown) {
          setShowMasterCongrats(true);
          sessionStorage.setItem(storageKey, "true");
        }
      }
    }, [session, status]);

    useEffect(() => {
      if (status !== "authenticated") return;
      const role = (session?.user?.role || "").toLowerCase();
      if (role === "hradmin") {
        setHrRedirecting(true);
        router.replace("/hr_dashboard");
      } else {
        setHrRedirecting(false);
      }
    }, [session, status, router]);
  

    
   

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
/*
  const getShiftTypeColor = (shift) => {
    switch (shift) {
      case "Morning": return styles.legendDotBlue;
      case "Day": return styles.legendDotGreen;
      case "Evening": return styles.legendDotYellow;
      case "Night": return styles.legendDotRed;
      default: return styles.legendDot;
    }
  };

*/


  const getShiftTypeColor = (shift) => {
    switch (shift) {
      case "Admin": return styles.legendDotBlue;
      case "Sales Admin": return styles.legendDotGreen;
      case "Procurement Admin": return styles.legendDotYellow;
      case "Procurement User": return styles.legendDotRed;
      case "HR": return styles.legendDotRed;
      case "Sales User": return styles.legendDotCyan;
      case "HR": return styles.legendDotRed;
      case "HR": return styles.legendDotRed;

      default: return styles.legendDot;
    }
  }; 

  const activeShiftsCount = currentShifts.filter(s => s.status === "active").length;
  const onBreakCount = currentShifts.filter(s => s.status === "break").length;

  if (hrRedirecting) {
    return (
      <div className={styles.container}>
        <div className={styles.redirectNotice}>
          Redirecting you to the HR dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {showMasterCongrats && (
        <div className={styles.congratsOverlay}>
          <div className={styles.congratsCard}>
            <h2 className={styles.congratsTitle}>
              Great work, {(session?.user?.username || "Leader").split("@")[0]}!
            </h2>
            <p className={styles.congratsText}>
              Thanks for pushing the team forward every day. Keep up the amazing momentum!
            </p>
            <button
              type="button"
              className={styles.congratsButton}
              onClick={() => setShowMasterCongrats(false)}
            >
              Let&apos;s get back to it
            </button>
          </div>
        </div>
      )}
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
                title="Total Users"
                number={counts.userCount}
                detailText={`${counts.userCount} registered users`}
              />
            ) : (
              <p>Loading users count...</p>
            )}
            {counts.clientCount !== null ? (
              <Card
                key="total-client-card"
                title="Total Clients"
                number={counts.clientCount}
                detailText={`${counts.clientCount} registered clients`}
              />
            ) : (
              <p>Loading Clients count...</p>
            )}
            {counts.supplierCount !== null ? (
              <Card
                key="total-suppliers-card"
                title="Total Suppliers"
                number={counts.supplierCount}
                detailText={`${counts.supplierCount} registered suppliers`}
              />
            ) : (
              <p>Loading Suppliers count...</p>
            )}
             {counts.supplierCount !== null ? (
              <CardWithout
                key="total-suppliers-card"
                title="Total Revenue"
                number='1,200.00'
              />
            ) : (
              <p>Loading Total...</p>
            )}
             {counts.employeeCount !== null ? (
              <Card
                key="total-employees-card"
                title="Total Employees"
                number={counts.supplierCount}
                detailText={`${counts.supplierCount} registered employees`}
              />
            ) : (
              <p>Loading Employees count...</p>
            )}
             {counts.supplierCount !== null ? (
              <Card
                key="total-quotations-card"
                title="Total Quotations"
                number={counts.supplierCount}
                detailText={`${counts.supplierCount} registered quotations`}
              />
            ) : (
              <p>Loading Quotations count...</p>
            )}
             {counts.supplierCount !== null ? (
              <Card
                key="total-purchasees-card"
                title="Total Purchase Orders"
                number={counts.supplierCount}
                detailText={`${counts.supplierCount} registered orders`}
              />
            ) : (
              <p>Loading Purchase orders count...</p>
            )}
             
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        
        <div className={styles.statCard}>
          <div className={styles.statCardContent}>

            
            <div className={styles.statCardText}>
              <p className={styles.statCardLabel}>Total Revenue</p>
              <p className={styles.statCardValue}>$45,231</p>
              <p className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
                +12% from last month
              </p>
            </div>
            <div className={`${styles.iconContainer} ${styles.iconGreen}`}>
              💰
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardContent}>
            <div className={styles.statCardText}>
              <p className={styles.statCardLabel}>Active Shifts</p>
              <p className={styles.statCardValue}>{activeShiftsCount}</p>
              <p className={`${styles.statCardChange} ${styles.statCardChangeBlue}`}>
                {onBreakCount} on break
              </p>
            </div>
            <div className={`${styles.iconContainer} ${styles.iconBlue}`}>
              👥
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardContent}>
            <div className={styles.statCardText}>
              <p className={styles.statCardLabel}>Scheduled Today</p>
              <p className={styles.statCardValue}>{shifts.length}</p>
              <p className={`${styles.statCardChange} ${styles.statCardChangeOrange}`}>
                Across all departments
              </p>
            </div>
            <div className={`${styles.iconContainer} ${styles.iconOrange}`}>
              📅
            </div>
          </div>
        </div>
      </div>
 
      <div className={styles.bossGrid}>
      
          <div className={styles.card}>

    <DashedLineChart />
   </div>
         <div className={styles.taskGrid}>
      <div className={styles.card}>
    <TinyBarChart />
      </div>
        
     <div className={styles.card}>

    <CustomPieChart />
</div>


     <div className={styles.card}>
      <DualYAxisBarChart />
</div>

</div>

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

        {/* Today's Shift Schedule */}
        <div className={styles.shiftCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Today's Schedule</h3>
            <span className={styles.cardIcon}>📋</span>
          </div>
          <div className={styles.taskList}>
            {shifts.map((shift) => (
              <div key={shift.id} className={styles.taskItem}>
                <div className={styles.taskContent}>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${getShiftTypeColor(shift.shift)}`}></div>
                  </div>
                  <div className={styles.taskDetails}>
                    <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                      {shift.employee}
                    </p>
                    <p className={styles.taskStatus}>
                      {shift.position} • {shift.department}
                    </p>
                    <p className={styles.taskStatus}>
                      {shift.shift} Shift: {shift.time}
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

      

        {/* Shift Summary Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Users</h3>
            <span className={styles.cardIcon}>📊</span>
          </div>
           <ColorfullPieChart data={roleStats} />
          <div className={styles.statusLegend}>
  {roleStats.map((role, index) => (
    <div key={role.role} className={styles.statusLegendItem}>
      <div className={styles.statusLegendLabel}>
        <div className={`${styles.legendDot} ${getLegendColor(index)}`}></div>
        <span className={styles.statusLegendText}>
          {formatRoleName(role.role)}
        </span>
      </div>
      <span className={styles.statusLegendValue}>
        {role.count}
      </span>
    </div>
  ))}
</div>
        </div>
        {/*Birthday card */}
        {/*

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
*/}


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

export default Main;
