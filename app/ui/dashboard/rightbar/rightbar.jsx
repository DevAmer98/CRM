'use client';

import React, { useEffect, useState } from 'react';
import Image from "next/image";
import styles from "./rightbar.module.css";
import {
  MdShoppingCart,
  MdReceipt,
  MdInventory,
  MdTrendingUp,
  MdTrendingDown,
  MdAttachMoney,
  MdPeople,
  MdFormatQuote
} from "react-icons/md";

const Rightbar = () => {
  const [counts, setCounts] = useState({
    quotationCount: 0,
    purchaseCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchStats = async () => {
    try {
      const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const [quotationRes, purchaseRes, quotationStatsRes, purchaseStatsRes] = await Promise.all([
        fetch(`${domain}/api/allQuotations`, { cache: 'no-store' }),
        fetch(`${domain}/api/allPurchase`, { cache: 'no-store' }),
        fetch(`${domain}/api/quotationStats`, { cache: 'no-store' }),
        fetch(`${domain}/api/purchaseStats`, { cache: 'no-store' })

      ]);

      if (!quotationRes.ok || !purchaseRes.ok || !quotationStatsRes.ok || !purchaseStatsRes.ok) {
        throw new Error('HTTP error when fetching counts');
      }

      const [quotationData, purchaseData, quotationStats,purchaseStats ] = await Promise.all([
        quotationRes.json(),
        purchaseRes.json(),
        quotationStatsRes.json(),
        purchaseStatsRes.json()

      ]);

      setCounts({
        quotationCount: quotationData.length,
        purchaseCount: purchaseData.length,
        approvedQuotations: quotationStats.approved,
        notApprovedQuotations: quotationStats.notApproved,
         approvedPurchase: purchaseStats.approved,
        notApprovedPurchase: purchaseStats.notApproved
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  fetchStats();
}, []);

  const stats = {
    quotations: {
      total: counts.quotationCount,
     approved: counts.approvedQuotations,
    pending: counts.notApprovedQuotations,
      rejected: 5,
      trend: 'up',
      percentage: 8.5
    },
    purchaseOrders: {
      total: counts.purchaseCount,
      approved: counts.approvedPurchase,
      pending: counts.notApprovedPurchase,
      trend: 'up',
      percentage: 12.3
    },
    invoices: {
      total: 67,
      paid: 45,
      pending: 18,
      overdue: 4,
      trend: 'down',
      percentage: -3.2
    },
    inventory: {
      total: 1250,
      lowStock: 15,
      outOfStock: 3,
      trend: 'up',
      percentage: 5.7
    },
    revenue: {
      total: 125000,
      thisMonth: 25000,
      trend: 'up',
      percentage: 15.8
    },
    customers: {
      total: 89,
      active: 67,
      new: 5,
      trend: 'up',
      percentage: 6.2
    }
  };

  const StatCard = ({ title, icon: Icon, data, primaryColor }) => (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <div className={styles.statIcon} style={{ backgroundColor: primaryColor }}>
          <Icon />
        </div>
        <div className={styles.statTrend}>
          {data.trend === 'up' ? <MdTrendingUp className={styles.trendUp} /> : <MdTrendingDown className={styles.trendDown} />}
          <span className={data.trend === 'up' ? styles.trendUp : styles.trendDown}>
            {Math.abs(data.percentage)}%
          </span>
        </div>
      </div>
      <h3 className={styles.statTitle}>{title}</h3>
      <div className={styles.statNumber}>{data.total.toLocaleString()}</div>
      <div className={styles.statDetails}>
        {title === 'Quotations' && (
          <>
            <div className={styles.statDetail}>
              <span className={styles.label}>Pending:</span>
              <span className={styles.value}>{data.pending}</span>
            </div>
            <div className={styles.statDetail}>
              <span className={styles.label}>Approved:</span>
              <span className={styles.value}>{data.approved}</span>
            </div>
          </>
        )}
        {title === 'Purchase Orders' && (
          <>
            <div className={styles.statDetail}>
                 <span className={styles.label}>Pending:</span>
              <span className={styles.value}>{data.pending}</span>
            </div>
            <div className={styles.statDetail}>
              <span className={styles.label}>Approved:</span>
              <span className={styles.value}>{data.approved}</span>
            </div>
          </>
        )}
        {/* You can keep other sections as-is */}
      </div>
    </div>
  );

  if (loading) return <div className={styles.container}>Loading stats...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.statsSection}>
        <StatCard title="Quotations" icon={MdFormatQuote} data={stats.quotations} primaryColor="#3b82f6" />
        <StatCard title="Purchase Orders" icon={MdShoppingCart} data={stats.purchaseOrders} primaryColor="#10b981" />
        <StatCard title="Invoices" icon={MdReceipt} data={stats.invoices} primaryColor="#f59e0b" />
        <StatCard title="Inventory" icon={MdInventory} data={stats.inventory} primaryColor="#8b5cf6" />
        <StatCard title="Revenue" icon={MdAttachMoney} data={stats.revenue} primaryColor="#ef4444" />
        <StatCard title="Customers" icon={MdPeople} data={stats.customers} primaryColor="#06b6d4" />
      </div>

      <div className={styles.item}>
        <div className={styles.bgContainer}>
          <Image className={styles.bg} src="/astronaut.png" alt="" fill />
        </div>
        <div className={styles.text}>
          <span className={styles.notification}>💡 Tip</span>
          <h3 className={styles.title}>Monitor your business metrics</h3>
          <span className={styles.subtitle}>Stay on top of your data</span>
          <p className={styles.desc}>
            Track quotations, orders, and revenue in real-time to make informed decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Rightbar;
