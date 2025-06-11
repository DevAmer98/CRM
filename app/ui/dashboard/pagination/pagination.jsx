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
import React, { useState, useCallback, useMemo } from 'react';
import styles from './pagination.module.css';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const Pagination = ({ 
  count, 
  itemsPerPage = 10, 
  maxVisible = 5,
  showFirstLast = true,
  showPreviousNext = true,
  onPageChange,
  loading = false,
  className = '',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const currentPage = parseInt(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(count / itemsPerPage);

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Memoize params to avoid recreating on every render
  const params = useMemo(() => new URLSearchParams(searchParams), [searchParams]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages || loading) return;
    
    params.set("page", newPage.toString());
    replace(`${pathname}?${params}`);
    
    // Optional callback for additional handling
    if (onPageChange) {
      onPageChange(newPage);
    }
  }, [currentPage, totalPages, loading, params, pathname, replace, onPageChange]);

  const getVisiblePages = useCallback(() => {
    const pages = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisible / 2);
      
      if (currentPage <= halfVisible + 1) {
        // Near the beginning
        for (let i = 1; i <= maxVisible - 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - halfVisible) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - (maxVisible - 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages, maxVisible]);

  const visiblePages = useMemo(() => getVisiblePages(), [getVisiblePages]);

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) return null;

  const containerClasses = [
    styles.container,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  return (
    <nav 
      className={containerClasses}
      role="navigation"
      aria-label="Pagination navigation"
    >
      {/* First page button */}
      {showFirstLast && currentPage > 2 && (
        <button
          className={`${styles.button} ${styles.navButton}`}
          onClick={() => handlePageChange(1)}
          disabled={loading}
          aria-label="Go to first page"
          title="First page"
        >
          ««
        </button>
      )}

      {/* Previous button */}
      {showPreviousNext && (
        <button
          className={`${styles.button} ${styles.navButton}`}
          disabled={!hasPrev || loading}
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Go to previous page"
          title="Previous page"
        >
          ‹ Previous
        </button>
      )}

      {/* Page numbers */}
      {visiblePages.map((page, index) => (
        page === '...' ? (
          <span 
            key={`ellipsis-${index}`} 
            className={styles.ellipsis}
            aria-label="More pages"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            className={`${styles.button} ${page === currentPage ? styles.active : ''}`}
            onClick={() => handlePageChange(page)}
            disabled={page === currentPage || loading}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            title={`Page ${page}`}
          >
            {page}
          </button>
        )
      ))}

      {/* Next button */}
      {showPreviousNext && (
        <button
          className={`${styles.button} ${styles.navButton}`}
          disabled={!hasNext || loading}
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Go to next page"
          title="Next page"
        >
          Next ›
        </button>
      )}

      {/* Last page button */}
      {showFirstLast && currentPage < totalPages - 1 && (
        <button
          className={`${styles.button} ${styles.navButton}`}
          onClick={() => handlePageChange(totalPages)}
          disabled={loading}
          aria-label="Go to last page"
          title="Last page"
        >
          »»
        </button>
      )}
    </nav>
  );
};

// Optional: Page info component to show current page information
export const PaginationInfo = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage,
  startItem,
  endItem 
}) => {
  const start = startItem || ((currentPage - 1) * itemsPerPage) + 1;
  const end = endItem || Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={styles.paginationInfo}>
      <span>
        Showing {start}-{end} of {totalItems} results
      </span>
    </div>
  );
};

export default Pagination;