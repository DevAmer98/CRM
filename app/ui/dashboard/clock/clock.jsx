'use client';

import React, { useState, useEffect } from 'react';
import Clock from 'react-clock';
import 'react-clock/dist/Clock.css';
import styles from './customTimePicker.module.css';

const CustomTimePicker = ({ label = "Select Time", onChange }) => {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState('AM');
  const [previewDate, setPreviewDate] = useState(new Date());

  useEffect(() => {
    let h = ampm === 'PM' && hour < 12 ? hour + 12 : hour;
    if (ampm === 'AM' && hour === 12) h = 0;

    const newTime = new Date();
    newTime.setHours(h);
    newTime.setMinutes(minute);
    newTime.setSeconds(0);
    setPreviewDate(newTime);
  }, [hour, minute, ampm]);

  const handleSet = () => {
    const selected = previewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    onChange?.(selected);
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.label}>{label}</h3>
      <Clock value={previewDate} className={styles.clock} />
      <div className={styles.time}>
        {`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`}
      </div>

      <div className={styles.selectRow}>
        <select className={styles.select} value={hour} onChange={(e) => setHour(parseInt(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <select className={styles.select} value={minute} onChange={(e) => setMinute(parseInt(e.target.value))}>
          {Array.from({ length: 60 }, (_, i) => i).map((m) => (
            <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
          ))}
        </select>

        <select className={styles.select} value={ampm} onChange={(e) => setAmpm(e.target.value)}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>

      <button className={styles.setButton} onClick={handleSet}>
        Set Time
      </button>
    </div>
  );
};

export default CustomTimePicker;
