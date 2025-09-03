'use client'
import React, { useState } from 'react';
import { deleteEmployee } from '@/app/lib/actions';
import styles from '@/app/ui/dashboard/clients/clients.module.css';

const DeleteEmployee = ({ employeeId , employeeNmae}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState('');


    const handleDelete = async (event) => {
        event.preventDefault();
        if (!employeeId) {
            setDeleteStatus('Invalid employee ID');
            return;
        }
    
        if (window.confirm(`Are you sure you want to delete ${employeeNmae}?`)) {
            setIsDeleting(true);
    
            const formData = new FormData();
            formData.append('id', employeeId);
    
            try {
                await deleteEmployee(formData);
                setDeleteStatus(`${employeeNmae} deleted successfully!`);
                setIsDeleting(false);
            } catch (error) {
                console.error('Delete error:', error);
                setDeleteStatus(`Failed to delete ${employeeNmae}!`);
                setIsDeleting(false);
            }
        }
    };


    return (
        <div>
            <form onSubmit={handleDelete}>
                <input type='hidden' name='id' value={employeeId} />
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

export default DeleteEmployee;
