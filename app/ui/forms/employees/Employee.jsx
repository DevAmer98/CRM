'use client'
import styles from '@/app/ui/dashboard/employees/addEmployee/addEmployee.module.css';
import { addEmployee, addEmployeeWithDualDates } from '@/app/lib/actions'
import React, { useEffect, useState } from 'react'
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation'; 

// Hijri date conversion utilities
const hijriMonths = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

const hijriMonthsEn = [
    'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani',
    'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

// Improved Hijri to Gregorian conversion
const hijriToGregorian = (hijriYear, hijriMonth, hijriDay) => {
    try {
        // More accurate conversion using the Islamic calendar epoch
        const hijriEpoch = new Date('622-07-16');
        const avgHijriYear = 354.367;
        const avgHijriMonth = 29.53;
        
        const totalHijriDays = (hijriYear - 1) * avgHijriYear + 
                              (hijriMonth - 1) * avgHijriMonth + 
                              hijriDay - 1;
        
        const gregorianDate = new Date(hijriEpoch.getTime() + totalHijriDays * 24 * 60 * 60 * 1000);
        return gregorianDate;
    } catch (error) {
        console.error('Error in hijriToGregorian:', error);
        return new Date();
    }
};

// Improved Gregorian to Hijri conversion
const gregorianToHijri = (gregorianDate) => {
    try {
        const hijriEpoch = new Date('622-07-16');
        const daysDiff = Math.floor((gregorianDate - hijriEpoch) / (24 * 60 * 60 * 1000));
        const avgHijriYear = 354.367;
        const avgHijriMonth = 29.53;
        
        const hijriYear = Math.floor(daysDiff / avgHijriYear) + 1;
        const remainingDays = daysDiff - (hijriYear - 1) * avgHijriYear;
        const hijriMonth = Math.min(12, Math.max(1, Math.floor(remainingDays / avgHijriMonth) + 1));
        const hijriDay = Math.min(30, Math.max(1, Math.floor(remainingDays % avgHijriMonth) + 1));
        
        return { 
            year: Math.max(1, hijriYear), 
            month: hijriMonth, 
            day: hijriDay 
        };
    } catch (error) {
        console.error('Error in gregorianToHijri:', error);
        return { year: 1445, month: 1, day: 1 };
    }
};

// Enhanced schema
const employeeSchema = z.object({
    employeeNo: z.string(),	
    name: z.string(),
    contactMobile: z.string(),
    email: z.string().optional(),
    iqamaNo: z.string(),
    iqamaExpirationDate: z.string().optional(),
    iqamaExpirationDateHijri: z.string().optional(),
    passportNo: z.string(),
    passportExpirationDate: z.string().optional(),
    passportExpirationDateHijri: z.string().optional(),
    dateOfBirth: z.string(), 
    dateOfBirthHijri: z.string().optional(),
    jobTitle: z.string(),
    directManager: z.string(),
    contractDuration: z.string().optional(),
    contractStartDate: z.string().optional(),
    contractStartDateHijri: z.string().optional(),
    contractEndDate: z.string().optional(),
    contractEndDateHijri: z.string().optional(),
    dateFormat: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
});

const AddEmployee = () => {
    const [isEmployee, setIsEmployee] = useState(false);
    const router = useRouter();
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFormat, setDateFormat] = useState('gregorian');
    const [formData, setFormData] = useState({
        employeeNo: '',
        name: '',
        contactMobile: '',
        email: '',
        iqamaNo: '',
        passportNo: '',
        jobTitle: '',
        directManager: '',
        contractDuration: ''
    });


    // ⬇️ Add this to your component's state near gregorianDates/hijriDates:
const [dateModes, setDateModes] = useState({
  dateOfBirth: 'hijri',
  iqamaExpirationDate: 'gregorian',
  passportExpirationDate: 'gregorian',
  contractStartDate: 'gregorian',
  contractEndDate: 'gregorian'
});

// ⬇️ Add this function:
const toggleDateMode = (field) => {
  setDateModes(prev => ({
    ...prev,
    [field]: prev[field] === 'hijri' ? 'gregorian' : 'hijri'
  }));
};

    
    // Separate state for dates based on format
    const [gregorianDates, setGregorianDates] = useState({
        dateOfBirth: '',
        iqamaExpirationDate: '',
        passportExpirationDate: '',
        contractStartDate: '',
        contractEndDate: ''
    });
    
    const [hijriDates, setHijriDates] = useState({
        dateOfBirth: { year: '', month: '', day: '' },
        iqamaExpirationDate: { year: '', month: '', day: '' },
        passportExpirationDate: { year: '', month: '', day: '' },
        contractStartDate: { year: '', month: '', day: '' },
        contractEndDate: { year: '', month: '', day: '' }
    });

    const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    useEffect(() => {
        setIsEmployee(typeof window !== 'undefined');
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            const response = await fetch(`${domain}/api/allManagers`, {
                cache: 'no-store', 
                method: 'GET'
            });
            const data = await response.json();
            console.log('fetchManagers: Managers fetched:', data);
            setManagers(data);
            setLoading(false);
        } catch (error) {
            console.error('fetchManagers: Error fetching Managers:', error);
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleGregorianDateChange = (field, value) => {
        setGregorianDates(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleHijriDateChange = (field, type, value) => {
        setHijriDates(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [type]: value
            }
        }));
    };

    const convertHijriToGregorianString = (hijriDate) => {
        if (!hijriDate.year || !hijriDate.month || !hijriDate.day) return '';
        
        const gregorianDate = hijriToGregorian(
            parseInt(hijriDate.year),
            parseInt(hijriDate.month),
            parseInt(hijriDate.day)
        );
        
        return gregorianDate.toISOString().split('T')[0];
    };

    const formatHijriDateString = (hijriDate) => {
        if (!hijriDate.year || !hijriDate.month || !hijriDate.day) return '';
        return `${hijriDate.year}/${String(hijriDate.month).padStart(2, '0')}/${String(hijriDate.day).padStart(2, '0')}`;
    };

    const convertGregorianToHijriString = (gregorianDateString) => {
        if (!gregorianDateString) return '';
        
        const gregorianDate = new Date(gregorianDateString);
        const hijriDate = gregorianToHijri(gregorianDate);
        
        return `${hijriDate.year}/${String(hijriDate.month).padStart(2, '0')}/${String(hijriDate.day).padStart(2, '0')}`;
    };

    const validateRequiredFields = () => {
        if (!formData.employeeNo.trim()) {
            toast.error('Employee number is required');
            return false;
        }
        if (!formData.name.trim()) {
            toast.error('Employee name is required');
            return false;
        }
        if (!formData.contactMobile.trim()) {
            toast.error('Contact mobile is required');
            return false;
        }

        // Validate date of birth based on format
        if (dateFormat === 'gregorian') {
            if (!gregorianDates.dateOfBirth) {
                toast.error('Date of birth is required');
                return false;
            }
        } else {
            if (!hijriDates.dateOfBirth.year || !hijriDates.dateOfBirth.month || !hijriDates.dateOfBirth.day) {
                toast.error('Date of birth is required');
                return false;
            }
        }

        return true;
    };

    const employeeActions = async (event) => {
        event.preventDefault();
        
        if (!validateRequiredFields()) {
            return;
        }

        const dateFields = ['dateOfBirth', 'iqamaExpirationDate', 'passportExpirationDate', 'contractStartDate', 'contractEndDate'];
        const finalFormData = { ...formData, dateFormat };

        try {
            if (dateFormat === 'hijri') {
                // Process Hijri dates
                dateFields.forEach(field => {
                    if (hijriDates[field] && hijriDates[field].year && hijriDates[field].month && hijriDates[field].day) {
                        // Convert to Gregorian for storage
                        const gregorianString = convertHijriToGregorianString(hijriDates[field]);
                        const hijriString = formatHijriDateString(hijriDates[field]);
                        
                        finalFormData[field] = gregorianString;
                        finalFormData[`${field}Hijri`] = hijriString;
                    } else {
                        finalFormData[field] = '';
                        finalFormData[`${field}Hijri`] = '';
                    }
                });
            } else {
                // Process Gregorian dates
                dateFields.forEach(field => {
                    if (gregorianDates[field]) {
                        const hijriString = convertGregorianToHijriString(gregorianDates[field]);
                        
                        finalFormData[field] = gregorianDates[field];
                        finalFormData[`${field}Hijri`] = hijriString;
                    } else {
                        finalFormData[field] = '';
                        finalFormData[`${field}Hijri`] = '';
                    }
                });
            }

            console.log('Final form data before sending:', finalFormData);

            if (isEmployee) { 
                const result = await addEmployee(finalFormData);

                if (result.success) {
                    toast.success('Employee added successfully!');
                    router.push('/hr_dashboard/employees');
                } else {
                    toast.error(result.message || 'Failed to add employee');
                }
            }
        } catch (error) { 
            console.error('Error adding employee:', error);
            if (error instanceof z.ZodError) {
                error.errors.forEach((err) => {
                    toast.error(`${err.path.join('.')}: ${err.message}`);
                });
            } else if (error.message.includes("already exists")) {
                toast.error(error.message);
            } else {
                toast.error(error.message || 'An unexpected error occurred');
            }
        }
    };


    
   // ⬇️ Replace renderDateInput() with this enhanced version:
const renderDateInput = (fieldName, label, required = false) => {
  const currentMode = dateModes[fieldName];

  const convertGregorianToHijriUI = () => {
    const greg = gregorianDates[fieldName];
    if (greg) {
      const { year, month, day } = gregorianToHijri(new Date(greg));
      handleHijriDateChange(fieldName, 'year', year);
      handleHijriDateChange(fieldName, 'month', month);
      handleHijriDateChange(fieldName, 'day', day);
    }
  };

  const convertHijriToGregorianUI = () => {
    const hijri = hijriDates[fieldName];
    if (hijri.year && hijri.month && hijri.day) {
      const g = hijriToGregorian(parseInt(hijri.year), parseInt(hijri.month), parseInt(hijri.day));
      handleGregorianDateChange(fieldName, g.toISOString().split('T')[0]);
    }
  };

  const toggleAndConvert = () => {
    if (currentMode === 'hijri') convertHijriToGregorianUI();
    else convertGregorianToHijriUI();
    toggleDateMode(fieldName);
  };

  return (
    <div className={styles.inputContainer}>
      <label className={styles.label}>{label}:</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {currentMode === 'gregorian' ? (
          <input
            className={styles.input}
            type="date"
            value={gregorianDates[fieldName] || ''}
            onChange={(e) => handleGregorianDateChange(fieldName, e.target.value)}
            required={required}
          />
        ) : (
          <>
            <input
              className={styles.input}
              type="number"
              placeholder="السنة"
              min="1"
              max="2000"
              style={{ width: '80px' }}
              value={hijriDates[fieldName].year || ''}
              onChange={(e) => handleHijriDateChange(fieldName, 'year', e.target.value)}
              required={required}
            />
            <select
              className={styles.input}
              value={hijriDates[fieldName].month || ''}
              onChange={(e) => handleHijriDateChange(fieldName, 'month', e.target.value)}
              required={required}
            >
              <option value="">الشهر</option>
              {hijriMonths.map((month, i) => (
                <option key={i} value={i + 1}>{month}</option>
              ))}
            </select>
            <input
              className={styles.input}
              type="number"
              placeholder="اليوم"
              min="1"
              max="30"
              style={{ width: '70px' }}
              value={hijriDates[fieldName].day || ''}
              onChange={(e) => handleHijriDateChange(fieldName, 'day', e.target.value)}
              required={required}
            />
          </>
        )}

        <button
          type="button"
          className={styles.toggleButton}
          onClick={toggleAndConvert}
        >
          {currentMode === 'hijri' ? '↔ ميلادي' : '↔ هجري'}
        </button>
      </div>
    </div>
  );
};

    const handleDateFormatChange = (newFormat) => {
        setDateFormat(newFormat);
        
        // Clear both date states when switching formats
        setGregorianDates({
            dateOfBirth: '',
            iqamaExpirationDate: '',
            passportExpirationDate: '',
            contractStartDate: '',
            contractEndDate: ''
        });
        
        setHijriDates({
            dateOfBirth: { year: '', month: '', day: '' },
            iqamaExpirationDate: { year: '', month: '', day: '' },
            passportExpirationDate: { year: '', month: '', day: '' },
            contractStartDate: { year: '', month: '', day: '' },
            contractEndDate: { year: '', month: '', day: '' }
        });
    };
    
    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Add New Employee</h1>
            
          

            <form onSubmit={employeeActions}>
                <div className={styles.formSections}>
                    {/* Left Section */}
                    <div className={styles.formSection}>
                        
                        <div className={styles.formGroup}>
                            {/* Employee Information */}
                            <div className={styles.sectionHeader}>Employee Details</div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Employee No:</label>
                                    <input 
                                        className={styles.input} 
                                        type="text" 
                                        value={formData.employeeNo}
                                        onChange={(e) => handleInputChange('employeeNo', e.target.value)}
                                        required 
                                    />
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Employee Name:</label>
                                    <input 
                                        className={styles.input} 
                                        type="text" 
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Employee Phone:</label>
                                    <input 
                                        className={styles.input} 
                                        type="tel" 
                                        value={formData.contactMobile}
                                        onChange={(e) => handleInputChange('contactMobile', e.target.value)}
                                        required 
                                    />
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Email Address:</label>
                                    <input 
                                        className={styles.input} 
                                        type="email" 
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.inputRow}>
                                {renderDateInput('dateOfBirth', 'Date of birth', true)}
                            </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                            {/* Iqama Details */}
                            <div className={styles.sectionHeader}>Iqama Details</div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>ID or Iqama No:</label>
                                    <input 
                                        className={styles.input} 
                                        type="text" 
                                        value={formData.iqamaNo}
                                        onChange={(e) => handleInputChange('iqamaNo', e.target.value)}
                                    />
                                </div>
                                {renderDateInput('iqamaExpirationDate', 'ID or Iqama expiry date')}
                            </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                            {/* Passport Information */}
                            <div className={styles.sectionHeader}>Passport Information</div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Passport No:</label>
                                    <input 
                                        className={styles.input} 
                                        type="text" 
                                        value={formData.passportNo}
                                        onChange={(e) => handleInputChange('passportNo', e.target.value)}
                                    />
                                </div>
                                {renderDateInput('passportExpirationDate', 'Passport expiry date')}
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Section */}
                    <div className={styles.formSection}>
                        
                        <div className={styles.formGroup}>
                            <div className={styles.sectionHeader}>Job Details</div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Job title:</label>
                                    <input 
                                        className={styles.input} 
                                        type="text" 
                                        value={formData.jobTitle}
                                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                                    />
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Direct manager:</label>
                                    <select 
                                        className={styles.input} 
                                        value={formData.directManager}
                                        onChange={(e) => handleInputChange('directManager', e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="">Select Direct Manager</option>
                                        {managers.length > 0 ? (
                                            managers.map((manager) => (
                                                <option key={manager._id} value={manager._id}>
                                                    {manager.username}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Loading managers...</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <div className={styles.sectionHeader}>Contract Information</div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Contract duration:</label>
                                    <input 
                                        className={styles.input} 
                                        type="text" 
                                        value={formData.contractDuration}
                                        onChange={(e) => handleInputChange('contractDuration', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.inputRow}>
                                {renderDateInput('contractStartDate', 'Contract start date')}
                                {renderDateInput('contractEndDate', 'Contract end date')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <button className={styles.button} type="submit">Add Employee</button>
            </form>
        </div>
    );
}

export default AddEmployee