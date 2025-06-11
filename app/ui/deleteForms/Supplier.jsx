'use client'
import React, { useState } from 'react';
import { deleteSupplier } from '@/app/lib/actions';
import styles from '@/app/ui/dashboard/clients/clients.module.css';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';

const DeleteSupplier = ({ supplierId, supplierName }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState('');


    const handleDelete = async (event) => {
        event.preventDefault();
        if (!supplierId) {
            setDeleteStatus('Invalid supplier ID');
            return;
        }
    
        if (window.confirm(`Are you sure you want to delete ${supplierName}?`)) {
            setIsDeleting(true);
    
            const formData = new FormData();
            formData.append('id', supplierId);
    
            try {
                await deleteSupplier(formData);
                toast.success(`${supplierName} deleted successfully!`, {
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    duration: 3000,
                });
                setIsDeleting(false);
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(`Failed to delete ${supplierName}!`, {
                    icon: <XCircle className="h-4 w-4" />,
                    duration: 3000,
                });
                setDeleteStatus(`Failed to delete ${supplierName}!`);
                setIsDeleting(false);
            }
        }
    };


    return (
        <div>
            <form onSubmit={handleDelete}>
                <input type='hidden' name='id' value={supplierId} />
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

export default DeleteSupplier;
