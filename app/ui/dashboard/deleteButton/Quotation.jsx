"use client"
import React, { useState } from 'react';

const DeleteQuotation = ({ quotationId, onDelete }) => {
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        const response = await fetch(`/api/quotation/${quotationId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        alert(data.message); // Display success message from the server
        onDelete(quotationId); // Call the onDelete function to update the UI
      } catch (err) {
        setError(`Deletion failed: ${err.message}`);
        console.error("Deletion error:", err);
      }
    }
  };

  return (
    <button onClick={handleDelete}>
      Delete Quotation
    </button>
  );
};

export default DeleteQuotation;