'use client'
import React, { useState } from 'react';
import { deleteDepartmnet } from '@/app/lib/actions';
import styles from '@/app/ui/hr_dashboard/employees/employees.module.css';

const DeleteDepartment = ({ departmentId, departmentName}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState('');


    const handleDelete = async (event) => {
        event.preventDefault();
        if (!departmentId) {
            setDeleteStatus('Invalid Department ID');
            return;
        }
    
        if (window.confirm(`Are you sure you want to delete ${departmentName}?`)) {
            setIsDeleting(true);
    
            const formData = new FormData();
            formData.append('id', departmentId);
    
            try {
                await deleteDepartmnet(formData);
                setDeleteStatus(`${departmentName} deleted successfully!`);
                setIsDeleting(false);
            } catch (error) {
                console.error('Delete error:', error);
                setDeleteStatus(`Failed to delete ${departmentName}!`);
                setIsDeleting(false);
            }
        }
    };


    return (
        <div>
            <form onSubmit={handleDelete}>
                <input type='hidden' name='id' value={departmentId} />
                <button 
                    type="submit" 
                    className={`${styles.button} ${styles.delete}`} 
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </form>
        </div>
    );
};

export default DeleteDepartment;
