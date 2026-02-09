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
    const [latestClients, setLatestClients] = useState([]);
    const [clientSummary, setClientSummary] = useState({
      counts: { clients: 0, leads: 0, newClients: 0, conversionRate: 0 },
      leadStatus: [],
      leadSource: [],
      clientRevenue: []
    });



    

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


          const summaryRes = await fetch(`${domain}/api/overview/clients-summary`, { cache: "no-store" });
          if (!summaryRes.ok) throw new Error("Failed to fetch client summary");
          const summary = await summaryRes.json();
          if (summary?.success) {
            setClientSummary({
              counts: summary.counts || { clients: 0, leads: 0, newClients: 0, conversionRate: 0 },
              leadStatus: summary.leadStatus || [],
              leadSource: summary.leadSource || [],
              clientRevenue: summary.clientRevenue || []
            });
          }

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
      const fetchLatestClients = async () => {
        try {
          const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
          const res = await fetch(`${domain}/api/clients/latest?limit=6`, { cache: "no-store" });
          if (!res.ok) throw new Error("Failed to load latest clients");
          const data = await res.json();
          setLatestClients(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Error fetching latest clients:", err);
        }
      };

      fetchLatestClients();
    }, []);
  

    
   

  const formatCreatedAt = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
  };










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
            {counts.clientCount !== null ? (
              <Card
                key="total-clients-card"
                title="Total Clients"
                number={clientSummary.counts.clients}
                detailText={`${clientSummary.counts.clients} registered clients`}
              />
            ) : (
              <p>Loading...</p>
            )}
            <Card
              key="new-clients-card"
              title="New Clients (30d)"
              number={clientSummary.counts.newClients}
              detailText="Added in the last 30 days"
            />
            <Card
              key="total-leads-card"
              title="Total Leads"
              number={clientSummary.counts.leads}
              detailText={`${clientSummary.counts.leads} in pipeline`}
            />
            <Card
              key="lead-conversion-card"
              title="Lead Conversion"
              number={`${clientSummary.counts.conversionRate}%`}
              detailText="Won / total leads"
            />
           
             
          </div>
        </div>
      </div> 




      
 
      <div className={styles.bossGrid}>
     {clientSummary.clientRevenue.length < 13 ? (
  // Centered layout for small data
  <div className="bg-[var(--bgSoft)] rounded-2xl p-6">
    <h3 className="text-center text-xl font-semibold text-[var(--textSoft)] pb-4 border-b border-[var(--input-border)]/30">
      Client Wise Earnings
    </h3>
    <div className="flex justify-center pt-4">
      <div
        style={{
          width: `${Math.max(800, 90 * clientSummary.clientRevenue.length)}px`,
          minWidth: '700px',
        }}
      >
        <NoPaddingChart data={clientSummary.clientRevenue} />
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
        minWidth: `${90 * clientSummary.clientRevenue.length}px`,
      }}
    >
      <NoPaddingChart data={clientSummary.clientRevenue} />
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
            {latestClients.map((client) => (
              <div key={client.id} className={styles.taskItem}>
                <div className={styles.taskContent}>
                  <div className={`${styles.iconContainer} ${styles.iconBlue}`} style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {client.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.taskDetails}>
                    <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                      {client.name}
                    </p> 
                    <p className={styles.taskStatus}>
                      {client.contactName || client.email || client.phone || "No contact info"}
                    </p>
                  </div>
                </div>
                <span className={styles.taskStatus}>
                  {formatCreatedAt(client.createdAt)}
                </span>
              </div>
            ))}
            {latestClients.length === 0 && (
              <p className={styles.taskStatus}>No recent clients found.</p>
            )}
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
  data={clientSummary.leadStatus}
  colorMap={{
    Pending: '#e74a3b',
     'App in Process': '#f6c23e',
  'App Done': '#1cc88a',
  }}
   />
  <div className={styles.statusLegend}>
    {clientSummary.leadStatus.map((item) => (
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
  <ColorfullPieChart data={clientSummary.leadSource} />
  <div className={styles.statusLegend}>
    {clientSummary.leadSource.map((item) => (
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
