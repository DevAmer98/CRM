'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import styles from './attendanceTable.module.css';

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBack(dateKey, days) {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() - days);
  return toDateKey(d);
}

export default function AttendanceTable() {
  const today = toDateKey(new Date());
  const [date, setDate] = useState(today);
  const [fromDate, setFromDate] = useState(daysBack(today, 29));
  const [toDate, setToDate] = useState(today);
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    totalPresent: 0,
    averageAttendance: 0,
    rows: [],
    trend: [],
    departments: []
  });

  const fetchAttendance = async ({ selectedDate, from, to }) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ date: selectedDate, from, to });
      const res = await fetch(`/api/attendance/summary?${params.toString()}`, {
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error(`Failed to load attendance (${res.status})`);
      }

      const payload = await res.json();
      setData({
        totalPresent: payload.totalPresent || 0,
        averageAttendance: payload.averageAttendance || 0,
        rows: Array.isArray(payload.rows) ? payload.rows : [],
        trend: Array.isArray(payload.trend) ? payload.trend : [],
        departments: Array.isArray(payload.departments) ? payload.departments : []
      });
    } catch (err) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance({ selectedDate: date, from: fromDate, to: toDate });
  }, [date, fromDate, toDate]);

  useEffect(() => {
    const source = new EventSource('/api/attendance/stream');
    const onAttendance = () => {
      fetchAttendance({ selectedDate: date, from: fromDate, to: toDate });
    };
    source.addEventListener('attendance', onAttendance);

    return () => {
      source.removeEventListener('attendance', onAttendance);
      source.close();
    };
  }, [date, fromDate, toDate]);

  useEffect(() => {
    if (selectedDepartment === 'All') return;
    if (!data.departments.includes(selectedDepartment)) {
      setSelectedDepartment('All');
    }
  }, [data.departments, selectedDepartment]);

  const filteredRows = useMemo(() => {
    if (selectedDepartment === 'All') return data.rows;
    return data.rows.filter(row => row.department === selectedDepartment);
  }, [data.rows, selectedDepartment]);

  const hasRows = useMemo(() => filteredRows.length > 0, [filteredRows]);

  const insights = useMemo(() => {
    const parseToHour = value => {
      if (!value || typeof value !== 'string') return null;
      const timePart = value.split(' ')[1];
      if (!timePart) return null;
      const [h, m] = timePart.split(':').map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
      return h + m / 60;
    };

    const formatHour = value => {
      if (!Number.isFinite(value)) return '-';
      const totalMinutes = Math.max(0, Math.min(24 * 60 - 1, Math.round(value * 60)));
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };

    const rowsWithHours = (filteredRows || [])
      .map(row => {
        const firstHour = parseToHour(row.firstIn);
        const leaveHour = parseToHour(row.lastOut);
        return { ...row, firstHour, leaveHour };
      })
      .filter(row => Number.isFinite(row.firstHour) && Number.isFinite(row.leaveHour));

    const hourlyMap = {};
    for (let h = 0; h < 24; h += 1) {
      hourlyMap[h] = { hour: `${String(h).padStart(2, '0')}:00`, arrivals: 0, leaving: 0 };
    }
    rowsWithHours.forEach(row => {
      const firstH = Math.floor(row.firstHour);
      const leaveH = Math.floor(row.leaveHour);
      if (hourlyMap[firstH]) hourlyMap[firstH].arrivals += 1;
      if (hourlyMap[leaveH]) hourlyMap[leaveH].leaving += 1;
    });

    const hourlyChart = Object.values(hourlyMap).filter(x => x.arrivals > 0 || x.leaving > 0);
    const employeeChart = rowsWithHours
      .slice()
      .sort((a, b) => a.firstHour - b.firstHour)
      .slice(0, 10)
      .map(row => ({
        employee: row.personName,
        firstHour: Number(row.firstHour.toFixed(2)),
        leaveHour: Number(row.leaveHour.toFixed(2))
      }));

    const earliest = rowsWithHours.length
      ? formatHour(Math.min(...rowsWithHours.map(r => r.firstHour)))
      : '-';
    const latest = rowsWithHours.length
      ? formatHour(Math.max(...rowsWithHours.map(r => r.leaveHour)))
      : '-';

    return { hourlyChart, employeeChart, earliest, latest, formatHour };
  }, [filteredRows]);

  const trendChart = useMemo(
    () =>
      (data.trend || []).map(item => ({
        date: item.date,
        count: item.count
      })),
    [data.trend]
  );

  const handleDateChange = value => {
    setDate(value);
    setToDate(value);
    setFromDate(daysBack(value, 29));
  };

  const handleDownloadExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const params = new URLSearchParams({
        date,
        from: fromDate,
        to: toDate,
        includeRangeRows: '1'
      });

      const res = await fetch(`/api/attendance/summary?${params.toString()}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(`Failed to load range export data (${res.status})`);
      const payload = await res.json();

      const sourceRows = Array.isArray(payload.rangeRows)
        ? payload.rangeRows
        : (data.rows || []).map(row => ({ ...row, date }));
      const exportRows = sourceRows;

      const detailRows = exportRows.map(row => ({
        Date: row.date || '',
        Employee: row.personName || '',
        'First Attendance': row.firstIn || '',
        Leaving: row.lastOut || ''
      }));

      const workbook = XLSX.utils.book_new();
      const detailsSheet = XLSX.utils.json_to_sheet(
        detailRows.length
          ? detailRows
          : [
              {
                Date: '',
                Employee: '',
                'First Attendance': '',
                Leaving: ''
              }
            ]
      );
      const summarySheet = XLSX.utils.json_to_sheet([
        { Metric: 'Selected Date', Value: payload.date || date },
        { Metric: 'Exported Rows', Value: exportRows.length },
        { Metric: 'Average Attendance (Range)', Value: payload.averageAttendance || 0 },
        { Metric: 'Trend From', Value: payload.from || fromDate },
        { Metric: 'Trend To', Value: payload.to || toDate }
      ]);
      const trendSheet = XLSX.utils.json_to_sheet(
        Array.isArray(payload.trend) && payload.trend.length
          ? payload.trend.map(item => ({
              Date: item.date,
              Attendance: item.count
            }))
          : [{ Date: '', Attendance: '' }]
      );

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Attendance');
      XLSX.utils.book_append_sheet(workbook, trendSheet, 'Trend');
      const exportName =
        (payload.from || fromDate) === (payload.to || toDate)
          ? `attendance-report-${payload.from || fromDate}.xlsx`
          : `attendance-report-${payload.from || fromDate}-to-${payload.to || toDate}.xlsx`;
      XLSX.writeFile(workbook, exportName);
    } catch (err) {
      setError(err.message || 'Failed to download Excel');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topbar}>
        <div className={styles.headline}>
          <h1 className={styles.title}>Attendance</h1>
          <p className={styles.subtitle}>Daily first in and leaving with visual trends and reporting</p>
        </div>

        <div className={styles.actions}>
          <label className={styles.dateWrap}>
            <span>Date</span>
            <input
              className={styles.dateInput}
              type="date"
              value={date}
              onChange={e => handleDateChange(e.target.value)}
            />
          </label>

          <label className={styles.dateWrap}>
            <span>Trend From</span>
            <input
              className={styles.dateInput}
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </label>

          <label className={styles.dateWrap}>
            <span>Trend To</span>
            <input
              className={styles.dateInput}
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </label>

          <label className={styles.dateWrap}>
            <span>Department</span>
            <select
              className={styles.selectInput}
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
            >
              <option value="All">All Departments</option>
              {data.departments.map(dep => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </label>

          <button className={styles.downloadButton} onClick={handleDownloadExcel} type="button">
            Download Excel
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Displayed Attendance</p>
          <p className={styles.statValue}>{filteredRows.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Average Attendance (Range)</p>
          <p className={styles.statValue}>{data.averageAttendance}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Earliest Arrival</p>
          <p className={styles.statValue}>{insights.earliest}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Latest Leaving</p>
          <p className={styles.statValue}>{insights.latest}</p>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.loading}>Loading attendance...</p> : null}

      {!loading && !error ? (
        <div className={styles.contentGrid}>
          <div className={`${styles.chartCard} ${styles.trendCard}`}>
            <h3 className={styles.chartTitle}>Attendance Trend</h3>
            <div className={styles.chartWrap}>
              {trendChart.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#9db0db', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#9db0db', fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Attendance"
                      stroke="#60a5fa"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={styles.empty}>No trend data in selected range.</p>
              )}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Arrivals vs Leaving by Hour</h3>
            <div className={styles.chartWrap}>
              {insights.hourlyChart.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={insights.hourlyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="hour" tick={{ fill: '#9db0db', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#9db0db', fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="arrivals" name="Arrivals" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="leaving" name="Leaving" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className={styles.empty}>No chart data for selected filters.</p>
              )}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>First Attendance vs Leaving (Top 10)</h3>
            <div className={styles.chartWrap}>
              {insights.employeeChart.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={insights.employeeChart} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      type="number"
                      domain={[0, 24]}
                      tick={{ fill: '#9db0db', fontSize: 11 }}
                      tickFormatter={value => insights.formatHour(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="employee"
                      width={120}
                      tick={{ fill: '#9db0db', fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value, name) => [insights.formatHour(value), name]}
                      labelFormatter={label => `Employee: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="firstHour" name="First Attendance" fill="#2dd4bf" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="leaveHour" name="Leaving" fill="#a78bfa" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className={styles.empty}>No employee timeline data.</p>
              )}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>First Attendance</th>
                  <th>Leaving</th>
                </tr>
              </thead>
              <tbody>
                {hasRows ? (
                  filteredRows.map(row => (
                    <tr key={`${row.personName}-${row.firstIn}-${row.lastOut}`}>
                      <td>{row.personName}</td>
                      <td>{row.department || 'Unassigned'}</td>
                      <td>{row.firstIn || '-'}</td>
                      <td>{row.lastOut || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.empty}>
                      No attendance records for this date and filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
