/*"use client";
import React from 'react'
import styles from './pagination.module.css'
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const Pagination = ({count}) => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const page = searchParams.get("page") || 1;

  const params = new URLSearchParams(searchParams);
  const ITEM_PER_PAGE = 10;
  
  const hasPrev= ITEM_PER_PAGE * (parseInt(page)-1) > 0
  const hasNext= ITEM_PER_PAGE * (parseInt(page)-1) + ITEM_PER_PAGE < count;



  const handleChangePage = (type) => {
    const newPage = type === "prev" ? parseInt(page) - 1 : parseInt(page) + 1;
    params.set("page", newPage);
    replace(`${pathname}?${params}`);
  };
  

  return (
    <div className={styles.container}>
      <button className={styles.button} disabled={!hasPrev} onClick={() => handleChangePage("prev")}>Previous</button>
      <button className={styles.button} disabled={!hasNext} onClick={() => handleChangePage("next")}>Next</button>
    </div>
  );
};

export default Pagination;*/



"use client";
import React from 'react'
import styles from './pagination.module.css'
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const Pagination = ({ count }) => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const page = parseInt(searchParams.get("page")) || 1;

  const params = new URLSearchParams(searchParams);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const handlePageChange = (newPage) => {
    params.set("page", newPage);
    replace(`${pathname}?${params}`);
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        disabled={!hasPrev}
        onClick={() => handlePageChange(page - 1)}
      >
        Previous
      </button>

      {/* Render page numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
        <button
          key={pageNumber}
          className={`${styles.button} ${pageNumber === page ? styles.active : ''}`}
          onClick={() => handlePageChange(pageNumber)}
          disabled={pageNumber === page}
        >
          {pageNumber}
        </button>
      ))}

      <button
        className={styles.button}
        disabled={!hasNext}
        onClick={() => handlePageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
