/*"use client"
import React, { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import styles from '@/app/ui/dashboard/quotations/addQuotation/addQuotation.module.css'; // Replace 'path-to-your-styles-module' with the actual path

const QuotationTable = () => {
  const [rows, setRows] = useState([{ id: 1, number: 1 }]);

  const addRow = () => {
    const newRow = { id: rows.length + 1, number: rows.length + 1 };
    setRows([...rows, newRow]);
  };

  const deleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    const updatedRowsWithNumbers = updatedRows.map((row, i) => ({ ...row, number: i + 1 }));
    setRows(updatedRowsWithNumbers);
  };

  const handleRowInputChange = (index, fieldName, value) => {
    const updatedRows = rows.map((row, i) => (i === index ? { ...row, [fieldName]: value } : row));
    setRows(updatedRows);
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <p className={styles.title}>Products</p>
        <table className={styles.table}>
          <thead>
            <tr>
              <td>Number</td>
              <td>Product Code</td>
              <td>Unit Price</td>
              <td>Unit</td>
              <td>Qty</td>
              <td>Description</td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={styles.row}>
                <td>
                  <input
                    className={`${styles.input} ${styles.numberInput}`}
                    type="text"
                    value={row.number}
                    readOnly
                  />
                </td>
                <td>
                  <input
                    className={styles.input1}
                    placeholder={row.productCode}
                    value={row.productCode}
                    onChange={(e) => handleRowInputChange(index, 'productCode', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className={styles.input1}
                    placeholder={row.unitPrice}
                    value={row.unitPrice}
                    onChange={(e) => handleRowInputChange(index, 'unitPrice', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className={styles.input1}
                    placeholder={row.unit}
                    value={row.unit}
                    onChange={(e) => handleRowInputChange(index, 'unit', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className={styles.input1}
                    placeholder={row.qty}
                    value={row.qty}
                    onChange={(e) => handleRowInputChange(index, 'qty', e.target.value)}
                  />
                </td>
                <td>
                  <textarea
                    className={`${styles.input1} ${styles.textarea}`}
                    placeholder={row.description}
                    value={row.description}
                    onChange={(e) => handleRowInputChange(index, 'description', e.target.value)}
                  ></textarea>
                </td>
                <td>
                  {index === rows.length - 1 ? (
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.addButton}`}
                      onClick={addRow}
                    >
                      <FaPlus />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                      onClick={() => deleteRow(index)}
                    >
                      <FaTrash />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationTable;
*/