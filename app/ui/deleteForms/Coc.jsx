'use client'
import React, { useState } from 'react';
import { deleteCoc} from '@/app/lib/actions';
import styles from '@/app/ui/dashboard/clients/clients.module.css';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';

const DeleteCoc = ({ cocId }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState('');


    const handleDelete = async (event) => {
        event.preventDefault();
       

          if (!cocId) {
            toast.error('Invalid Coc ID', {
                icon: <XCircle className="h-4 w-4" />,
                duration: 3000,
            });
            return;
        }
    
        if (window.confirm(`Are you sure you want to delete Coc ${cocId}?`)) {
            setIsDeleting(true);
    
            const formData = new FormData();
            formData.append('id', cocId);
    
            try {
                setIsDeleting(true);
                await deleteCoc(formData);
                toast.success(`${cocId} deleted successfully!`, {
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    duration: 3000,
                });
            } catch (error) {
                console.error('Delete error:', error);
                 toast.error(`Failed to delete ${cocId}!`, {
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
                <input type='hidden' name='id' value={cocId} />
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

export default DeleteCoc;
