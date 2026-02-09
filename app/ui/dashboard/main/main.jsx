//app/ui/dashboard/main/main.jsx
"use client";
import React, { useEffect, useState } from "react";
import styles from "./main.module.css";
import Card from "../../hr_dashboard/card/card";
import CardWithout from "../../hr_dashboard/card/without";
import DashedLineChart from "../charts/stnadart";
import ColorfullPieChart from "../charts/colorfull";
import StatusPie from "../charts/statusPie";
import TopRankBar from "../charts/topRankBar";
import OpsTrend from "../charts/opsTrend";
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
      supplierCount: null,
      employeeCount: null,
      departmentCount: null,
      managerCount: null,
      quotationCount: null,
      purchaseOrderCount: null,
      pendingLeavesCount: null
    }); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roleStats, setRoleStats] = useState([]);
    const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const [showMasterCongrats, setShowMasterCongrats] = useState(false);
    const [hrRedirecting, setHrRedirecting] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [overviewSummary, setOverviewSummary] = useState({
      quotationStatus: [],
      purchaseOrderStatus: [],
      quotationCurrency: [],
      purchaseOrderCurrency: [],
      topSuppliers: [],
      topClients: []
    });
    const [overviewError, setOverviewError] = useState("");
    const [opsSummary, setOpsSummary] = useState({
      totals: { leads: 0, jobOrders: 0, pickLists: 0, coc: 0 },
      leadStatus: [],
      jobOrderStatus: [],
      monthlyTrend: []
    });
    const [opsError, setOpsError] = useState("");






    useEffect(() => {

      
      const fetchCounts = async () => {
        try {
          const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
          console.log(process.env.NEXT_PUBLIC_API_URL);
          const [
            userRes,
            clientRes,
            supplierRes,
            employeeRes,
            departmentRes,
            managerRes,
            quotationRes,
            purchaseOrderRes,
            leavesRes
          ] = await Promise.all([
            fetch(`${domain}/api/allUsersCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/allClientsCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/allSuppliersCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/allEmployeeCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/alldepartmentsCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/allManagersCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/allQuotationsCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/allPurchaseOrdersCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/leaves/pending-count`, { cache: 'no-store' })
          ]);
    
          // Check if all responses are OK
          if (!userRes.ok || !clientRes.ok || !supplierRes.ok || !employeeRes.ok || !departmentRes.ok || !managerRes.ok || !quotationRes.ok || !purchaseOrderRes.ok || !leavesRes.ok) {
            throw new Error('HTTP error when fetching counts');
          }
    
          // Parse JSON for all responses
          const [
            userData,
            clientData,
            supplierData,
            employeeData,
            departmentData,
            managerData,
            quotationData,
            purchaseOrderData,
            leavesData
          ] = await Promise.all([
            userRes.json(),
            clientRes.json(),
            supplierRes.json(),
            employeeRes.json(),
            departmentRes.json(),
            managerRes.json(),
            quotationRes.json(),
            purchaseOrderRes.json(),
            leavesRes.json()
          ]);
    
          // Set all counts
          setCounts({
            userCount: userData.count,
            clientCount: clientData.count,
            supplierCount: supplierData.count,
            employeeCount: employeeData.count,
            departmentCount: departmentData.count,
            managerCount: managerData.count,
            quotationCount: quotationData.count,
            purchaseOrderCount: purchaseOrderData.count,
            pendingLeavesCount: leavesData.count
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
      const fetchDepartments = async () => {
        try {
          const deptData = await fetch(`${domain}/api/allDepartments`, { cache: "no-store" })
            .then(res => (res.ok ? res.json() : []));
          setDepartments(Array.isArray(deptData) ? deptData : []);
        } catch (err) {
          console.error("Error fetching departments:", err);
        }
      };

      fetchDepartments();
    }, [domain]);

    useEffect(() => {
      const fetchOverview = async () => {
        setOverviewError("");
        try {
          const response = await fetch(`${domain}/api/overview/sales-procurement-summary`, { cache: "no-store" });
          const payload = await response.json();
          if (!response.ok || !payload?.success) {
            throw new Error(payload?.message || "Failed to load overview.");
          }
          setOverviewSummary({
            quotationStatus: payload.quotationStatus || [],
            purchaseOrderStatus: payload.purchaseOrderStatus || [],
            quotationCurrency: payload.quotationCurrency || [],
            purchaseOrderCurrency: payload.purchaseOrderCurrency || [],
            topSuppliers: payload.topSuppliers || [],
            topClients: payload.topClients || []
          });
        } catch (err) {
          setOverviewError(err?.message || "Failed to load overview.");
        } finally {
        }
      };

      fetchOverview();
    }, [domain]);

    useEffect(() => {
      const fetchOps = async () => {
        setOpsError("");
        try {
          const response = await fetch(`${domain}/api/overview/ops-summary`, { cache: "no-store" });
          const payload = await response.json();
          if (!response.ok || !payload?.success) {
            throw new Error(payload?.message || "Failed to load ops summary.");
          }
          setOpsSummary({
            totals: payload.totals || { leads: 0, jobOrders: 0, pickLists: 0, coc: 0 },
            leadStatus: payload.leadStatus || [],
            jobOrderStatus: payload.jobOrderStatus || [],
            monthlyTrend: payload.monthlyTrend || []
          });
        } catch (err) {
          setOpsError(err?.message || "Failed to load ops summary.");
        }
      };

      fetchOps();
    }, [domain]);

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
      <div className={styles.kpiHeader}>
        <div className={styles.kpiRow}>
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
          {counts.quotationCount !== null ? (
            <Card
              key="total-quotations-card"
              title="Total Quotations"
              number={counts.quotationCount}
              detailText={`${counts.quotationCount} registered quotations`}
            />
          ) : (
            <p>Loading Quotations count...</p>
          )}
          {counts.purchaseOrderCount !== null ? (
            <Card
              key="total-purchasees-card"
              title="Total Purchase Orders"
              number={counts.purchaseOrderCount}
              detailText={`${counts.purchaseOrderCount} registered orders`}
            />
          ) : (
            <p>Loading Purchase orders count...</p>
          )}
          {opsSummary.totals?.jobOrders !== null && (
            <Card
              key="total-joborders-card"
              title="Total Job Orders"
              number={opsSummary.totals.jobOrders}
              detailText={`${opsSummary.totals.jobOrders} created job orders`}
            />
          )}
          {opsSummary.totals?.pickLists !== null && (
            <Card
              key="total-picklists-card"
              title="Total Pick Lists"
              number={opsSummary.totals.pickLists}
              detailText={`${opsSummary.totals.pickLists} delivery notes`}
            />
          )}
          {opsSummary.totals?.coc !== null && (
            <Card
              key="total-coc-card"
              title="Total COC"
              number={opsSummary.totals.coc}
              detailText={`${opsSummary.totals.coc} certificates issued`}
            />
          )}
        </div>
      </div>
      <div className={styles.layoutGrid}>
        <div className={styles.leftColumn}>
          <div className={styles.bossGrid}>
            <div className={styles.card}>
              <DashedLineChart />
            </div>
            {overviewError && (
              <div className={styles.card}>
                <p className={styles.taskStatus}>{overviewError}</p>
              </div>
            )}
            <div className={styles.taskGrid}>
              <div className={styles.card}>
                <StatusPie
                  title="Quotation Payments"
                  subtitle="Payment status mix"
                  data={overviewSummary.quotationStatus}
                />
              </div>
              <div className={styles.card}>
                <StatusPie
                  title="Purchase Order Payments"
                  subtitle="Procurement status mix"
                  data={overviewSummary.purchaseOrderStatus}
                />
              </div>
              <div className={styles.card}>
                <TopRankBar
                  title="Top Suppliers"
                  subtitle="By purchase order volume"
                  data={overviewSummary.topSuppliers}
                  valueKey="count"
                />
              </div>
            </div>

            {opsError && (
              <div className={styles.card}>
                <p className={styles.taskStatus}>{opsError}</p>
              </div>
            )}

            <div className={styles.taskGrid}>
              <div className={styles.card}>
                <StatusPie
                  title="Lead Pipeline"
                  subtitle="Status distribution"
                  data={opsSummary.leadStatus}
                />
              </div>
              <div className={styles.card}>
                <StatusPie
                  title="Job Orders"
                  subtitle="Open vs closed"
                  data={opsSummary.jobOrderStatus}
                />
              </div>
              <div className={styles.card}>
                <OpsTrend data={opsSummary.monthlyTrend} />
              </div>
            </div>
          </div>

          <div className={styles.mainGrid}>
            <div className={styles.card}>
              <TopRankBar
                title="Top Clients"
                subtitle="By quotation volume"
                data={overviewSummary.topClients}
                valueKey="count"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Main;
