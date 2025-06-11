'use client'
import React, { useState } from 'react';
import { deleteSale } from '@/app/lib/actions';
import styles from '@/app/ui/dashboard/clients/clients.module.css';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';

const DeleteSales = ({ salesId, salesName }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState('');

    const handleDelete = async (event) => {
        event.preventDefault();
        if (!salesId) {
            toast.error('Invalid Sales ID', {
                icon: <XCircle className="h-4 w-4" />,
                duration: 3000,
            });            return;
        }

    
        if (window.confirm(`Are you sure you want to delete ${salesName}?`)) {
            setIsDeleting(true);
    
            const formData = new FormData();
            formData.append('id', salesId);
    
            try {
                await deleteSale(formData);
                toast.success(`${salesName} deleted successfully!`, {
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    duration: 3000,
                });
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(`Failed to delete ${salesName}!`, {
                                    icon: <XCircle className="h-4 w-4" />,
                                    duration: 3000,
                                });
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div>
            <form onSubmit={handleDelete}>
                <input type='hidden' name='id' value={salesId} />
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

export default DeleteSales;