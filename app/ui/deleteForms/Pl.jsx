'use client'
import React, { useState } from 'react';
import { deletePl } from '@/app/lib/actions';
import styles from '@/app/ui/dashboard/clients/clients.module.css';

const DeletePl = ({ pickListId }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState('');


    const handleDelete = async (event) => {
        event.preventDefault();
        if (!pickListId) {
            setDeleteStatus('Invalid quotation ID');
            return;
        }
    
        if (window.confirm(`Are you sure you want to delete Pick List ${pickListId}?`)) {
            setIsDeleting(true);
    
            const formData = new FormData();
            formData.append('id', pickListId);
    
            try {
                await deletePl(formData);
                setDeleteStatus('pick List deleted successfully!');
                setIsDeleting(false);
            } catch (error) {
                console.error('Delete error:', error);
                setDeleteStatus('Failed to delete pick List!');
                setIsDeleting(false);
            }
        }
    };


    return (
        <div>
            <form onSubmit={handleDelete}>
                <input type='hidden' name='id' value={pickListId} />
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

export default DeletePl;
