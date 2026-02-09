"use client";
import React, { useEffect, useState } from "react";
import styles from "../main/main.module.css";
import Card from "../../hr_dashboard/card/card";
import HeaderNavigation from "@/components/ui/HeaderNavigation";
 

const HR = () => {

  const [hrSummary, setHrSummary] = useState({
    employeeCount: null,
    departmentCount: null,
    pendingLeaves: null
  });
    const [attendanceSummary, setAttendanceSummary] = useState({
      totalPresent: 0,
      averageAttendance: 0
    });
    const [attendanceRows, setAttendanceRows] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    

    useEffect(() => {

      
      const fetchCounts = async () => {
        try {
          const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
          console.log(process.env.NEXT_PUBLIC_API_URL);
          const attendancePromise = fetch(`${domain}/api/attendance/summary`, { cache: 'no-store' })
            .then(async res => (res.ok ? res.json() : null))
            .catch(() => null);

          const [employeeRes, departmentRes, leavesRes, attendanceData, departmentsRes] = await Promise.all([
            fetch(`${domain}/api/allEmployeeCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/alldepartmentsCount`, { cache: 'no-store' }),
            fetch(`${domain}/api/leaves/pending-count`, { cache: 'no-store' }),
            attendancePromise,
            fetch(`${domain}/api/allDepartments`, { cache: 'no-store' })
          ]);
    
          // Check core dashboard APIs first
          if (!employeeRes.ok || !departmentRes.ok || !leavesRes.ok || !departmentsRes.ok) {
            throw new Error('HTTP error when fetching counts');
          }
    
          // Parse JSON for all responses
          const [employeeData, departmentData, leavesData, departmentsData] = await Promise.all([
            employeeRes.json(),
            departmentRes.json(),
            leavesRes.json(),
            departmentsRes.json()
          ]);
    
          // Set all counts
          setHrSummary({
            employeeCount: employeeData.count,
            departmentCount: departmentData.count,
            pendingLeaves: leavesData.count
          });
          setAttendanceSummary({
            totalPresent: attendanceData?.totalPresent || 0,
            averageAttendance: attendanceData?.averageAttendance || 0
          });
          setAttendanceRows(Array.isArray(attendanceData?.rows) ? attendanceData.rows : []);
          setDepartments(Array.isArray(departmentsData) ? departmentsData : []);

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
      const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const refreshAttendance = async () => {
        try {
          const res = await fetch(`${domain}/api/attendance/summary`, { cache: 'no-store' });
          if (!res.ok) return;
          const attendanceData = await res.json();
          setAttendanceSummary({
            totalPresent: attendanceData?.totalPresent || 0,
            averageAttendance: attendanceData?.averageAttendance || 0
          });
          setAttendanceRows(Array.isArray(attendanceData?.rows) ? attendanceData.rows : []);
        } catch (e) {
          // Keep previous values on transient network errors
        }
      };

      const source = new EventSource(`/api/attendance/stream`);
      const onAttendance = () => refreshAttendance();
      source.addEventListener('attendance', onAttendance);
      return () => {
        source.removeEventListener('attendance', onAttendance);
        source.close();
      };
    }, []);
  

    
   

  const formatTime = (value) => {
    if (!value) return "—";
    return value;
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
            {hrSummary.pendingLeaves !== null ? (
              <Card
                key="total-users-card"
                title="Pending Leaves"
                number={hrSummary.pendingLeaves}
                detailText="Awaiting approval"
              />
            ) : (
              <p>Loading Projects...</p>
            )}
            {hrSummary.employeeCount !== null ? (
              <Card
                key="total-client-card"
                title="Employees"
                number={hrSummary.employeeCount}
                detailText={`${hrSummary.employeeCount} active employees`}
              />
            ) : (
              <p>Loading Projects...</p>
            )}
             {hrSummary.departmentCount !== null ? (
             <Card
                key="departments-card"
                title="Departments"
                number={hrSummary.departmentCount}
                detailText={`${hrSummary.departmentCount} active departments`}
              />
            ) : (
              <p>Loading Projects...</p>
            )}
             {attendanceSummary.totalPresent !== null ? (
              <Card
                key="today-attendance-card"
                title="Today Attendance"
                number={attendanceSummary.totalPresent}
                detailText={`${attendanceSummary.totalPresent} employees checked in`}
              />
            ) : (
              <p>Loading Projects...</p>
            )}
             {attendanceSummary.averageAttendance !== null ? (
              <Card
                key="average-attendance-card"
                title="Average Attendance"
                number={attendanceSummary.averageAttendance}
                detailText={`7-day average attendance`}
              />
            ) : (
              <p>Loading Projects...</p>
            )}
           
             
          </div>
        </div>
      </div> 

      
 
      <div className={styles.bossGrid}>
      {/* Main Content Grid */}
      <div className={styles.taskGrid}>
        {/* Current Active Shifts */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Today&apos;s Attendance</h3>
            <span className={styles.cardIcon}>🕘</span>
          </div>
          <div className={styles.taskList}>
            {attendanceRows.map((row, index) => (
              <div key={`${row.employeeId || row.personName}-${index}`} className={styles.taskItem}>
                <div className={styles.taskContent}>
                  <div className={`${styles.iconContainer} ${styles.iconBlue}`} style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {row.personName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.taskDetails}>
                    <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                      {row.personName}
                    </p> 
                    <p className={styles.taskStatus}>
                      {row.department} • In {formatTime(row.firstIn)}
                    </p>
                  </div>
                </div>
                <span className={styles.taskStatus}>
                  Out {formatTime(row.lastOut)}
                </span>
              </div>
            ))}
            {attendanceRows.length === 0 && (
              <p className={styles.taskStatus}>No attendance records yet.</p>
            )}
          </div>
        </div>

        {/* Department Overview */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Department Coverage</h3>
            <span className={styles.cardIcon}>🏢</span>
          </div>
          <div className={styles.taskList}>
            {departments.map((dept) => {
              const employeeCount = Array.isArray(dept.employees) ? dept.employees.length : 0;
              const managerName = dept.directManager?.name || "Unassigned";
              const managerCount = dept.directManager ? 1 : 0;
              return (
                <div key={dept._id || dept.name} className={styles.taskItem}>
                  <div className={styles.taskContent}>
                    <div className={styles.taskDetails}>
                      <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                        {dept.name}
                      </p>
                      <p className={styles.taskStatus}>
                        Manager: {managerName}
                      </p>
                    </div>
                  </div>
                  <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                      <div className={`${styles.legendDot} ${styles.legendDotGreen}`}></div>
                      <span className={styles.legendText}>{employeeCount}</span>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={`${styles.legendDot} ${styles.legendDotBlue}`}></div>
                      <span className={styles.legendText}>{managerCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {departments.length === 0 && (
              <p className={styles.taskStatus}>No departments found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default HR;
