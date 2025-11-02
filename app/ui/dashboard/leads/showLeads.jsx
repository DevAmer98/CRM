'use client';

import Link from 'next/link';
import styles from '@/app/ui/dashboard/leads/leads.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Pagination from '@/app/ui/dashboard/pagination/pagination';

const statusClassMap = {
  pending: styles.statusPending,
  contacted: styles.statusContacted,
  'in progress': styles.statusInProgress,
  qualified: styles.statusQualified,
  won: styles.statusWon,
  lost: styles.statusLost,
};

const formatCurrency = (value, currency) => {
  const amount = Number(value || 0);
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: ['SAR', 'USD'].includes(currency) ? currency : 'SAR',
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
};

const formatStatus = (status) => {
  if (!status) return 'Pending';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const buildStatusClass = (status) => {
  if (!status) return `${styles.statusBadge} ${styles.statusPending}`;
  const key = status.toLowerCase();
  const normalized = key.replace(/_/g, ' ');
  const statusClass = statusClassMap[normalized] || statusClassMap[key] || styles.statusPending;
  return `${styles.statusBadge} ${statusClass}`;
};

const renderProducts = (list = []) => {
  if (!Array.isArray(list) || list.length === 0) {
    return '—';
  }
  const trimmed = list.filter(Boolean).map((item) => item.trim()).filter(Boolean);
  if (!trimmed.length) return '—';
  if (trimmed.length <= 2) {
    return trimmed.join(', ');
  }
  return `${trimmed.slice(0, 2).join(', ')} +${trimmed.length - 2} more`;
};

const ShowLeads = ({ leads, count }) => {
  const hasLeads = Array.isArray(leads) && leads.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search leads by name" />
        <div className={styles.topRight}>
          <Link href="/dashboard/quotations/leads/add">
            <button className={styles.addButton}>Add Lead</button>
          </Link>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Agent</th>
              <th>Source</th>
              <th>Category</th>
              <th>Products</th>
              <th>Value</th>
              <th>Follow Up</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {!hasLeads && (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
                  No leads found yet. Create one to get started.
                </td>
              </tr>
            )}
            {hasLeads &&
              leads.map((lead) => (
                <tr key={lead._id}>
                  <td>
                    <div className={styles.nameCell}>{lead.name}</div>
                    {lead.email && <div className={styles.emailCell}>{lead.email}</div>}
                    <div className={styles.leadMeta}>
                      {lead.companyName && <span>{lead.companyName}</span>}
                      {lead.mobile && <span>{lead.mobile}</span>}
                      {lead.officePhoneNumber && <span>{lead.officePhoneNumber}</span>}
                    </div>
                  </td>
                  <td>{lead.agent?.name || '—'}</td>
                  <td>{lead.source || '—'}</td>
                  <td>{lead.category || '—'}</td>
                  <td className={styles.productsCell}>{renderProducts(lead.products)}</td>
                  <td className={styles.valueCell}>{formatCurrency(lead.leadValue, lead.currency)}</td>
                  <td>
                    <span className={lead.allowFollowUp !== false ? styles.followUpYes : styles.followUpNo}>
                      {lead.allowFollowUp !== false ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={buildStatusClass(lead.status)}>{formatStatus(lead.status)}</span>
                  </td>
                  <td>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className={styles.paginationWrapper}>
        <Pagination count={count} />
      </div>
    </div>
  );
};

export default ShowLeads;
