'use client'
import React, { useState } from 'react';
import { deleteQuotation } from '@/app/lib/actions';
import styles from '@/app/ui/dashboard/clients/clients.module.css';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';

const DeleteQuotation = ({ quotationId }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState('');


    const handleDelete = async (event) => {
        event.preventDefault();
        if (!quotationId) {
          toast.error('Invalid Quotation ID', {
                icon: <XCircle className="h-4 w-4" />,
                duration: 3000,
            });            return;
        }
    
        if (window.confirm(`Are you sure you want to delete quotation ${quotationId}?`)) {
            setIsDeleting(true);
    
            const formData = new FormData();
            formData.append('id', quotationId);
    
            try {
                await deleteQuotation(formData);
                toast.success(`${quotationId} deleted successfully!`, {
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    duration: 3000,
                });
            } catch (error) {
                console.error('Delete error:', error);
               toast.error(`Failed to delete ${quotationId}!`, {
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
                <input type='hidden' name='id' value={quotationId} />
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

export default DeleteQuotation;
