'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DeleteQuotation from '@/app/ui/dashboard/deleteButton/Quotation';
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';
import { fetchQuotations } from '@/app/lib/data';
import Pagination from '@/app/ui/dashboard/pagination/pagination'; // Assuming this is a generic component

const QuotationList = () => {
  const [quotations, setQuotations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchQuotations(searchQuery, currentPage);
        setQuotations(data.quotations);
        setTotalPages(data.totalPages); // Assuming your API provides this info
      } catch (error) {
        setError('Failed to fetch data');
        console.error('Fetching quotations failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, currentPage]);

  const handleDelete = (quotationId) => {
    setQuotations(quotations.filter(quotation => quotation.id !== quotationId));
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <input 
        type="text" 
        value={searchQuery} 
        onChange={handleSearchChange} 
        placeholder="Search quotations..." 
      />
      <table className={styles.table}>
        <thead>
          <tr>
            <td>Client Name</td>
            <td>Project Name</td>
            <td>Quotation Number</td>
            <td>Project Location Address</td>
            <td>Created At</td>
            <td>Updated At</td>
          </tr>
        </thead>
        <tbody>
          {quotations.map((quotation) => (
            <tr key={quotation.id}>
              <td>{quotation.client?.name || 'No client name'}</td>
              <td>{quotation.projectName}</td>
              <td>{quotation.quotationId}</td>
              <td>{quotation.projectLA}</td>
              <td>{quotation.createdAt?.toString().slice(4, 16)}</td>
              <td>{quotation.updatedAt?.toString().slice(4, 16)}</td>
              <td>
                <div className={styles.buttons}>
                  <Link href={`/dashboard/quotations/${quotation.id}`}>
                    <button className={`${styles.button} ${styles.view}`}>View</button>
                  </Link>
                  <DeleteQuotation quotationId={quotation.id} onDelete={handleDelete} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default QuotationList;
