'use client'
import React, { useState } from 'react';
import { deleteUser } from '@/app/lib/actions';
import styles from '@/app/ui/dashboard/clients/clients.module.css';
import { XCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DeleteUser = ({ userId, userName }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (event) => {
        event.preventDefault();
        if (!userId) {
            toast.error('Invalid User ID', {
                icon: <XCircle className="h-4 w-4" />,
                duration: 3000,
            });
            return;
        }
    
        if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
            setIsDeleting(true);
    
            const formData = new FormData(); 
            formData.append('id', userId);
    
            try {
                await deleteUser(formData);
                toast.success(`${userName} deleted successfully!`, {
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    duration: 3000,
                });
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(`Failed to delete ${userName}!`, {
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
                <input type='hidden' name='id' value={userId} />
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

export default DeleteUser;