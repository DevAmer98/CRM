'use client'
import React, { useState } from 'react';
import { deleteClient } from '@/app/lib/actions';
import styles from '@/app/ui/dashboard/clients/clients.module.css';

const DeleteClient = ({ clientId , clientName}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState('');


    const handleDelete = async (event) => {
        event.preventDefault();
        if (!clientId) {
            setDeleteStatus('Invalid client ID');
            return;
        }
    
        if (window.confirm(`Are you sure you want to delete ${clientName}?`)) {
            setIsDeleting(true);
    
            const formData = new FormData();
            formData.append('id', clientId);
    
            try {
                await deleteClient(formData);
                setDeleteStatus(`${clientName} deleted successfully!`);
                setIsDeleting(false);
            } catch (error) {
                console.error('Delete error:', error);
                setDeleteStatus(`Failed to delete ${clientName}!`);
                setIsDeleting(false);
            }
        }
    };


    return (
        <div>
            <form onSubmit={handleDelete}>
                <input type='hidden' name='id' value={clientId} />
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

export default DeleteClient;
