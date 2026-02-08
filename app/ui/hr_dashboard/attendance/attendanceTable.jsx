//app/ui/hr_dashboard/attendance/attendanceTable.jsx
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

const LATE_RULES_STORAGE_KEY = 'attendance_late_rules_v1';
const defaultLateRules = [
  { id: 'r1', label: 'Minor delay', fromMinutes: 1, toMinutes: 15, deductionAmount: 0 },
  { id: 'r2', label: 'Late', fromMinutes: 16, toMinutes: 30, deductionAmount: 25 },
  { id: 'r3', label: 'Very late', fromMinutes: 31, toMinutes: 60, deductionAmount: 50 },
  { id: 'r4', label: 'Critical late', fromMinutes: 61, toMinutes: 1000, deductionAmount: 100 }
];

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

function dateRangeKeys(from, to) {
  const result = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    result.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function parseHHMMToMinutes(value) {
  if (!value || typeof value !== 'string') return null;
  const [h, m] = value.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function parseDateTimeToMinutes(value) {
  if (!value || typeof value !== 'string') return null;
  const timePart = value.split(' ')[1];
  if (!timePart) return null;
  const [h, m] = timePart.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function formatMinutes(value) {
  if (!Number.isFinite(value) || value <= 0) return '0m';
  const h = Math.floor(value / 60);
  const m = value % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

function makeUniqueSheetName(name, used) {
  let base = String(name || 'Employee').trim() || 'Employee';
  base = base.replace(/[\[\]\*\?\/\\:]/g, ' ').replace(/'/g, '').trim();
  if (!base) base = 'Employee';
  if (base.length > 31) base = base.slice(0, 31);
  let candidate = base;
  let counter = 1;
  while (used.has(candidate)) {
    const suffix = ` ${counter}`;
    const maxLength = 31 - suffix.length;
    candidate = `${base.slice(0, Math.max(1, maxLength))}${suffix}`;
    counter += 1;
  }
  used.add(candidate);
  return candidate;
}

function normalizeRules(rules) {
  if (!Array.isArray(rules)) return defaultLateRules;
  const cleaned = rules
    .map((rule, index) => ({
      id: rule?.id || `rule-${index}-${Date.now()}`,
      label: String(rule?.label || `Rule ${index + 1}`).trim(),
      fromMinutes: Number(rule?.fromMinutes || 0),
      toMinutes: Number(rule?.toMinutes || 0),
      deductionAmount: Number(rule?.deductionAmount || 0)
    }))
    .filter(rule => Number.isFinite(rule.fromMinutes) && Number.isFinite(rule.toMinutes))
    .sort((a, b) => a.fromMinutes - b.fromMinutes);
  return cleaned.length ? cleaned : defaultLateRules;
}

function evaluateAttendanceRow(row, rules) {
  const scheduled = parseHHMMToMinutes(row.scheduledStart);
  const actual = parseDateTimeToMinutes(row.firstIn);
  if (!Number.isFinite(scheduled) || !Number.isFinite(actual)) {
    return {
      ...row,
      lateMinutes: null,
      lateLabel: 'No shift',
      deductionAmount: 0
    };
  }

  const lateMinutes = Math.max(0, actual - scheduled);
  if (lateMinutes <= 0) {
    return {
      ...row,
      lateMinutes,
      lateLabel: 'On time',
      deductionAmount: 0
    };
  }

  const matchedRule = rules.find(
    rule => lateMinutes >= rule.fromMinutes && lateMinutes <= rule.toMinutes
  );

  return {
    ...row,
    lateMinutes,
    lateLabel: matchedRule?.label || 'Late',
    deductionAmount: matchedRule ? Number(matchedRule.deductionAmount || 0) : 0
  };
}

export default function AttendanceTable() {
  const today = toDateKey(new Date());
  const [date, setDate] = useState(today);
  const [fromDate, setFromDate] = useState(daysBack(today, 29));
  const [toDate, setToDate] = useState(today);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [lateRules, setLateRules] = useState(defaultLateRules);

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LATE_RULES_STORAGE_KEY);
      if (!saved) return;
      setLateRules(normalizeRules(JSON.parse(saved)));
    } catch (err) {
      console.error('Failed to load late rules:', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LATE_RULES_STORAGE_KEY, JSON.stringify(lateRules));
    } catch (err) {
      console.error('Failed to save late rules:', err);
    }
  }, [lateRules]);

  const filteredRows = useMemo(() => {
    if (selectedDepartment === 'All') return data.rows;
    return data.rows.filter(row => row.department === selectedDepartment);
  }, [data.rows, selectedDepartment]);

  const hasRows = useMemo(() => filteredRows.length > 0, [filteredRows]);
  const evaluatedRows = useMemo(
    () => filteredRows.map(row => evaluateAttendanceRow(row, lateRules)),
    [filteredRows, lateRules]
  );

  const lateSummary = useMemo(() => {
    const lateCount = evaluatedRows.filter(row => Number(row.lateMinutes) > 0).length;
    const totalDeduction = evaluatedRows.reduce((sum, row) => sum + Number(row.deductionAmount || 0), 0);
    return { lateCount, totalDeduction };
  }, [evaluatedRows]);

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
      const exportRows = sourceRows.map(row => evaluateAttendanceRow(row, lateRules));

      const attendanceIndex = new Set();
      const exceptionsByEmployee = new Map();

      const ensureEmployeeBucket = (key, info) => {
        if (!exceptionsByEmployee.has(key)) {
          exceptionsByEmployee.set(key, {
            employeeId: info.employeeId || '',
            employeeNo: info.employeeNo || '',
            name: info.name || 'Unknown',
            department: info.department || 'Unassigned',
            lateCount: 0,
            absentCount: 0,
            totalDeduction: 0,
            rows: []
          });
        }
        return exceptionsByEmployee.get(key);
      };

      exportRows.forEach(row => {
        if (row.employeeId && row.date) {
          attendanceIndex.add(`${row.date}::${row.employeeId}`);
        }

        if (!Number.isFinite(row.lateMinutes) || row.lateMinutes <= 0) return;

        const key = row.employeeId || `name:${row.personName || 'Unknown'}`;
        const bucket = ensureEmployeeBucket(key, {
          employeeId: row.employeeId,
          employeeNo: row.employeeNo,
          name: row.personName,
          department: row.department
        });

        bucket.lateCount += 1;
        bucket.totalDeduction += Number(row.deductionAmount || 0);
        bucket.rows.push({
          Date: row.date || '',
          Status: 'Late',
          Department: row.department || 'Unassigned',
          'Scheduled Start': row.scheduledStart || '',
          'First Attendance': row.firstIn || '',
          'Late By': Number.isFinite(row.lateMinutes) ? formatMinutes(row.lateMinutes) : '',
          Deduction: Number(row.deductionAmount || 0).toFixed(2)
        });
      });

      const rangeShifts = Array.isArray(payload.rangeShifts) ? payload.rangeShifts : [];
      const rangeEmployees = Array.isArray(payload.rangeEmployees) ? payload.rangeEmployees : [];
      const rangeFrom = payload.from || fromDate;
      const rangeTo = payload.to || toDate;
      const rangeDates = dateRangeKeys(rangeFrom, rangeTo);

      const attendanceByEmployeeDate = new Map();
      exportRows.forEach(row => {
        if (!row.employeeId || !row.date) return;
        attendanceByEmployeeDate.set(`${row.date}::${row.employeeId}`, row);
      });

      const shiftByEmployeeDate = new Map();
      rangeShifts.forEach(shift => {
        if (!shift.employeeId || !shift.date) return;
        const key = `${shift.date}::${shift.employeeId}`;
        shiftByEmployeeDate.set(key, shift);
        if (attendanceIndex.has(key)) return;

        const bucket = ensureEmployeeBucket(shift.employeeId, {
          employeeId: shift.employeeId,
          employeeNo: shift.employeeNo,
          name: shift.employeeName,
          department: shift.department
        });

        bucket.absentCount += 1;
        bucket.rows.push({
          Date: shift.date || '',
          Status: 'Absent',
          Department: shift.department || 'Unassigned',
          'Scheduled Start': shift.startTime || '',
          'First Attendance': '',
          'Late By': '',
          Deduction: ''
        });
      });

      exceptionsByEmployee.forEach(bucket => {
        bucket.rows.sort((a, b) => String(a.Date).localeCompare(String(b.Date)));
      });

      const perEmployeeDaily = rangeEmployees.map(emp => {
        const rows = rangeDates.map(dateKey => {
          const lookupKey = `${dateKey}::${emp.employeeId}`;
          const attendance = attendanceByEmployeeDate.get(lookupKey);
          if (attendance) {
            return {
              Date: dateKey,
              Status: attendance.lateLabel || 'On time',
              Department: emp.department || 'Unassigned',
              'Scheduled Start': attendance.scheduledStart || '',
              'First Attendance': attendance.firstIn || '',
              Leaving: attendance.lastOut || '',
              'Late By': Number.isFinite(attendance.lateMinutes)
                ? formatMinutes(attendance.lateMinutes)
                : '',
              Deduction: Number(attendance.deductionAmount || 0).toFixed(2)
            };
          }

          const shift = shiftByEmployeeDate.get(lookupKey);
          if (shift) {
            return {
              Date: dateKey,
              Status: 'Absent',
              Department: emp.department || 'Unassigned',
              'Scheduled Start': shift.startTime || '',
              'First Attendance': '',
              Leaving: '',
              'Late By': '',
              Deduction: ''
            };
          }

          return {
            Date: dateKey,
            Status: 'No shift',
            Department: emp.department || 'Unassigned',
            'Scheduled Start': '',
            'First Attendance': '',
            Leaving: '',
            'Late By': '',
            Deduction: ''
          };
        });

        return {
          employeeId: emp.employeeId,
          employeeNo: emp.employeeNo,
          name: emp.name || `Employee ${emp.employeeNo || emp.employeeId}`,
          department: emp.department || 'Unassigned',
          rows
        };
      });

      const detailRows = exportRows.map(row => ({
        Date: row.date || '',
        Employee: row.personName || '',
        'Employee No': row.employeeNo || '',
        Department: row.department || '',
        'Scheduled Start': row.scheduledStart || '',
        'First Attendance': row.firstIn || '',
        Leaving: row.lastOut || '',
        Status: row.lateLabel || '',
        'Late By': Number.isFinite(row.lateMinutes) ? formatMinutes(row.lateMinutes) : '',
        Deduction: Number(row.deductionAmount || 0).toFixed(2)
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
        { Metric: 'Late Employees (Selected Date)', Value: lateSummary.lateCount },
        { Metric: 'Total Deduction (Selected Date)', Value: Number(lateSummary.totalDeduction).toFixed(2) },
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

      const exceptionsSummary = Array.from(exceptionsByEmployee.values()).map(bucket => ({
        Employee: bucket.name,
        'Employee No': bucket.employeeNo,
        Department: bucket.department,
        'Late Count': bucket.lateCount,
        'Absent Count': bucket.absentCount,
        'Total Deduction': bucket.totalDeduction.toFixed(2)
      }));
      const exceptionsSummarySheet = XLSX.utils.json_to_sheet(
        exceptionsSummary.length
          ? exceptionsSummary
          : [
              {
                Employee: '',
                'Employee No': '',
                Department: '',
                'Late Count': '',
                'Absent Count': '',
                'Total Deduction': ''
              }
            ]
      );
      XLSX.utils.book_append_sheet(workbook, exceptionsSummarySheet, 'Late & Absent');

      const usedSheetNames = new Set(['Summary', 'Attendance', 'Trend', 'Late & Absent']);
      perEmployeeDaily.forEach(bucket => {
        const sheet = XLSX.utils.json_to_sheet(
          bucket.rows.length
            ? bucket.rows
            : [{ Date: '', Status: '', Department: '', 'Scheduled Start': '', 'First Attendance': '' }]
        );
        const sheetName = makeUniqueSheetName(bucket.name, usedSheetNames);
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
      });

      const exportName =
        (payload.from || fromDate) === (payload.to || toDate)
          ? `attendance-report-${payload.from || fromDate}.xlsx`
          : `attendance-report-${payload.from || fromDate}-to-${payload.to || toDate}.xlsx`;
      XLSX.writeFile(workbook, exportName);
    } catch (err) {
      setError(err.message || 'Failed to download Excel');
    }
  };

  const addLateRule = () => {
    const maxTo = lateRules.reduce((max, rule) => Math.max(max, Number(rule.toMinutes || 0)), 0);
    const nextFrom = maxTo + 1;
    setLateRules(prev => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        label: `Rule ${prev.length + 1}`,
        fromMinutes: nextFrom,
        toMinutes: nextFrom + 14,
        deductionAmount: 0
      }
    ]);
  };

  const updateRule = (id, field, value) => {
    setLateRules(prev =>
      normalizeRules(
        prev.map(rule =>
          rule.id === id
            ? {
                ...rule,
                [field]:
                  field === 'label'
                    ? value
                    : Number.isFinite(Number(value))
                      ? Number(value)
                      : 0
              }
            : rule
        )
      )
    );
  };

  const removeRule = id => {
    setLateRules(prev => normalizeRules(prev.filter(rule => rule.id !== id)));
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
          <p className={styles.statLabel}>Earliest Arrival</p>
          <p className={styles.statValue}>{insights.earliest}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Latest Leaving</p>
          <p className={styles.statValue}>{insights.latest}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Late Employees</p>
          <p className={styles.statValue}>{lateSummary.lateCount}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Deduction</p>
          <p className={styles.statValue}>{lateSummary.totalDeduction.toFixed(2)}</p>
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

          <div className={styles.policyCard}>
            <div className={styles.policyHead}>
              <h3 className={styles.chartTitle}>Late Policy Rules (Minutes)</h3>
              <button type="button" className={styles.downloadButton} onClick={addLateRule}>
                Add Rule
              </button>
            </div>
            <p className={styles.subtitle}>
              Define late ranges and salary deduction per range. Rules are saved in your browser.
            </p>
            <div className={styles.rulesGrid}>
              <div className={styles.ruleHeaderRow}>
                <span>Rule Name</span>
                <span>From (min)</span>
                <span>To (min)</span>
                <span>Deduction</span>
                <span>Action</span>
              </div>
              {lateRules.map(rule => (
                <div className={styles.ruleRow} key={rule.id}>
                  <input
                    className={styles.ruleInput}
                    value={rule.label}
                    onChange={e => updateRule(rule.id, 'label', e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    className={styles.ruleInput}
                    type="number"
                    min="0"
                    value={rule.fromMinutes}
                    onChange={e => updateRule(rule.id, 'fromMinutes', e.target.value)}
                    placeholder="From"
                  />
                  <input
                    className={styles.ruleInput}
                    type="number"
                    min="0"
                    value={rule.toMinutes}
                    onChange={e => updateRule(rule.id, 'toMinutes', e.target.value)}
                    placeholder="To"
                  />
                  <input
                    className={styles.ruleInput}
                    type="number"
                    min="0"
                    step="0.01"
                    value={rule.deductionAmount}
                    onChange={e => updateRule(rule.id, 'deductionAmount', e.target.value)}
                    placeholder="Deduction"
                  />
                  <button
                    type="button"
                    className={styles.removeRule}
                    onClick={() => removeRule(rule.id)}
                    disabled={lateRules.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Shift Start</th>
                  <th>First Attendance</th>
                  <th>Leaving</th>
                  <th>Status</th>
                  <th>Late By</th>
                  <th>Deduction</th>
                </tr>
              </thead>
              <tbody>
                {hasRows ? (
                  evaluatedRows.map(row => (
                    <tr key={`${row.personName}-${row.firstIn}-${row.lastOut}`}>
                      <td>{row.personName}</td>
                      <td>{row.department || 'Unassigned'}</td>
                      <td>{row.scheduledStart || '-'}</td>
                      <td>{row.firstIn || '-'}</td>
                      <td>{row.lastOut || '-'}</td>
                      <td>{row.lateLabel || '-'}</td>
                      <td>{Number.isFinite(row.lateMinutes) ? formatMinutes(row.lateMinutes) : '-'}</td>
                      <td>{Number(row.deductionAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className={styles.empty}>
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
