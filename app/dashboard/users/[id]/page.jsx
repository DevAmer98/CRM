import React from 'react';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { fetchUser } from '@/app/lib/data';
import Edit from '@/app/ui/forms/user/Edit';

const SingleUserPage = async ({ params }) => {
  const { id } = params;

  // Log the ID to verify it's correct
  console.log('User ID from URL:', id);

  try {
    const userDocument = await fetchUser(id);
    const user = JSON.parse(JSON.stringify(userDocument.toObject())); // Convert to plain object

    // Log the user object to verify it's correct
    console.log('Fetched User:', user);

    return (
      <div className={styles.container}>
        <Edit user={{ ...user, id: user._id }} /> {/* Map _id to id */}
      </div>
    );
  } catch (err) {
    console.error('Error in SingleUserPage:', err);
    return <div>Error loading user data.</div>;
  }
};

export default SingleUserPage;