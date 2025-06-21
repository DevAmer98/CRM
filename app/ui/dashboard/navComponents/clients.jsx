"use client";
import React, { useEffect, useState } from "react";
import styles from "../main/main.module.css";
import Card from "../../hr_dashboard/card/card";
import ColorfullPieChart from "../charts/colorfull";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import Link from "next/link";
import NoPaddingChart from "../charts/noPadding";
import { ChartPie, CircleUserRound } from "lucide-react";
import HeaderNavigation from "@/components/ui/HeaderNavigation";
 

const Client = () => {

  const [counts, setCounts] = useState({
      userCount: null,
      clientCount: null,
      supplierCount: null
    }); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roleStats, setRoleStats] = useState([]);


    const chartData = [

  { name: 'Jan', pv: 2400 },
  { name: 'Feb', pv: 1398 },
  { name: 'Mar', pv: 9800 },
  { name: 'Apr', pv: 3908 },
  { name: 'May', pv: 4800 },
  { name: 'Jun', pv: 3800 },
  { name: 'Jul', pv: 4300 },
  { name: 'Aug', pv: 2100 },
  { name: 'Sep', pv: 6700 },
  { name: 'Oct', pv: 5400 },
  { name: 'Nov', pv: 3200 },
  { name: 'Dec', pv: 7800 }

  
];



    

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










  const getStatusColor = (shift) => {
    switch (shift) {
      case "Not Started": return styles.legendDotBlue;
      case "App Done": return styles.legendDotGreen;
      case "App in Process": return styles.legendDotYellow;
      case "Pending": return styles.legendDotRed;
      case "On Hold": return styles.legendDotCyan;

      default: return styles.legendDot;
    }
  }; 


    const getLeadBySourceColor = (shift) => {
    switch (shift) {
      case "Email": return styles.legendDotBlue;
      case "Google": return styles.legendDotGreen;
      case "Facebook": return styles.legendDotYellow;
      case "Friend": return styles.legendDotRed;
      case "Direct Visit": return styles.legendDotCyan;
            case "Tv ad": return styles.legendDotPurple;



      default: return styles.legendDot;
    }
  }; 

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
                title="Total Clients"
                number={counts.userCount}
                detailText={`${counts.userCount} registered clients`}
              />
            ) : (
              <p>Loading...</p>
            )}
            {counts.clientCount !== null ? (
              <Card
                key="total-client-card"
                title="Total Leads"
                number={counts.clientCount}
                detailText={`${counts.clientCount} registered Leads`}
              />
            ) : (
              <p>Loading...</p>
            )}
             {counts.clientCount !== null ? (
              <Card
                key="total-client-card"
                title="Leads Conversions"
                number={counts.clientCount}
                detailText={`${counts.clientCount} registered `}
              />
            ) : (
              <p>Loading...</p>
            )}
             {counts.clientCount !== null ? (
              <Card
                key="total-client-card"
                title="Total Leads"
                number={counts.clientCount}
                detailText={`${counts.clientCount} registered overdue projects`}
              />
            ) : (
              <p>Loading...</p>
            )}
             {counts.clientCount !== null ? (
              <Card
                key="total-client-card"
                title="Contracts Generated"
                number={counts.clientCount}
                detailText={`${counts.clientCount} registered overdue projects`}
              />
            ) : (
              <p>Loading...</p>
            )}
             {counts.clientCount !== null ? (
              <Card
                key="total-client-card"
                title="Contracts Signed"
                number={counts.clientCount}
                detailText={`${counts.clientCount} registered overdue projects`}
              />
            ) : (
              <p>Loading...</p>
            )}
           
             
          </div>
        </div>
      </div> 




      
 
      <div className={styles.bossGrid}>
     {chartData.length < 13 ? (
  // Centered layout for small data
  <div className="bg-[var(--bgSoft)] rounded-2xl p-6">
    <h3 className="text-center text-xl font-semibold text-[var(--textSoft)] pb-4 border-b border-[var(--input-border)]/30">
      Client Wise Earnings
    </h3>
    <div className="flex justify-center pt-4">
      <div
        style={{
          width: `${Math.max(800, 90 * chartData.length)}px`,
          minWidth: '700px',
        }}
      >
        <NoPaddingChart data={chartData} />
      </div>
    </div>
  </div>
) : (
  // Scrollable layout for large data
  <div className="bg-[var(--bgSoft)] rounded-2xl p-6 overflow-x-auto custom-scrollbar">
    <h3 className="text-center text-xl font-semibold text-[var(--textSoft)] pb-4 border-b border-[var(--input-border)]/30 min-w-full">
      Client Wise Earnings
    </h3>
    <div
      className="w-full pt-4"
      style={{
        minWidth: `${90 * chartData.length}px`,
      }}
    >
      <NoPaddingChart data={chartData} />
    </div>
  </div>
)}

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Current Active Shifts */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className="text-xl font-semibold text-[var(--textSoft)] inline-block pb-2 border-b border-[var(--input-border)]/30">
            Latest Clients
            </h3>
            <span className={styles.cardIcon}><CircleUserRound /></span>
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
                <span className="text-blue-600">
                    Show
                </span>
              </div>
            ))}
          </div>
        </div>



<div className={styles.card}>
  <div className={styles.cardHeader}>
    <h3 className="text-xl font-semibold text-[var(--textSoft)] inline-block pb-2 border-b border-[var(--input-border)]/30">
Leads Count By Status
    </h3>
    <span className={styles.cardIcon}><ChartPie/></span>
  </div>
  {/* Optional: static chart or image */}
   <ColorfullPieChart
  data={[
    { role: 'Pending', count: 5 },
    { role: 'App in Process', count: 12 },
    { role: 'App Done', count: 8 },
  ]}
  colorMap={{
    Pending: '#e74a3b',      // red
     'App in Process': '#f6c23e', // yellow
  'App Done': '#1cc88a',       // green
  }}
   />
  <div className={styles.statusLegend}>
    {[
     { role: 'Pending', count: 5 },
    { role: 'App in Process', count: 12 },
    { role: 'App Done', count: 8 },
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

<div className={styles.card}>
  <div className={styles.cardHeader}>
    <h3 className="text-xl font-semibold text-[var(--textSoft)] inline-block pb-2 border-b border-[var(--input-border)]/30">
    Leads Count By Source
    </h3>
    <span className={styles.cardIcon}><ChartPie/></span>
  </div>
  {/* Optional: static chart or image */}
  <ColorfullPieChart data={[
    { role: 'Email', count: 5 },
    { role: 'Google', count: 12 },
    { role: 'Facebook', count: 8 },
    { role: 'Friend', count: 8 },
    { role: 'Direct Visit', count: 8 },
    { role: 'Tv ad', count: 8 },

  ]} />
  <div className={styles.statusLegend}>
    {[
    { role: 'Email', count: 5 },
    { role: 'Google', count: 12 },
    { role: 'Facebook', count: 8 },
    { role: 'Friend', count: 8 },
    { role: 'Direct Visit', count: 8 },
    { role: 'Tv ad', count: 8 },
    ].map((item) => (
      <div key={item.role} className={styles.statusLegendItem}>
        <div className={styles.statusLegendLabel}>
          <div className={`${styles.legendDot} ${getLeadBySourceColor(item.role)}`}></div>
          <span className={styles.statusLegendText}>{item.role}</span>
        </div>
        <span className={styles.statusLegendValue}>{item.count}</span>
      </div>
    ))}
  </div>
</div>
      </div>
    </div>
    </div>
  );
};

export default Client;