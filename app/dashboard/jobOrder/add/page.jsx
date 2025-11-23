"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from '@/app/ui/dashboard/jobOrder/jobOrder.module.css';
import { useRouter } from 'next/navigation';

const VAT_RATE = 0.15;

const createManualProduct = () => ({
  productCode: '',
  description: '',
  qty: '',
  unit: '',
  lineTotal: 0,
});

const numberOrNull = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const deriveQuotationBaseValue = (quotation) => {
  if (!quotation) return null;

  const subtotalAfterDiscount = numberOrNull(
    quotation.subtotalAfterTotalDiscount
  );
  if (subtotalAfterDiscount !== null && subtotalAfterDiscount > 0) {
    return Number(subtotalAfterDiscount.toFixed(2));
  }

  const subtotal = numberOrNull(quotation.subtotal);
  if (subtotal !== null && subtotal > 0) {
    return Number(subtotal.toFixed(2));
  }

  const totalPrice = numberOrNull(quotation.totalPrice);
  if (totalPrice === null || totalPrice <= 0) {
    return null;
  }

  if (quotation.currency === 'SAR') {
    return Number((totalPrice / (1 + VAT_RATE)).toFixed(2));
  }

  return Number(totalPrice.toFixed(2));
};

const AddJobOrderPage = () => {
  const [clientsWithInfo, setClientsWithInfo] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState('');
  const [selectedPO, setSelectedPO] = useState('');
  const [selectedPODate, setSelectedPODate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [value, setValue] = useState('');
  const [useManualProducts, setUseManualProducts] = useState(false);
  const [manualProducts, setManualProducts] = useState([createManualProduct()]);

  const manualProductsTotal = manualProducts.reduce(
    (sum, product) => sum + (Number(product.lineTotal) || 0),
    0
  );

  const numericValue = parseFloat(value);
  const valueWithVAT =
    currency === 'SAR' && !Number.isNaN(numericValue)
      ? (numericValue * (1 + VAT_RATE)).toFixed(2)
      : value;

  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const router = useRouter();

  const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
    disabled,
    searchable = false,
  }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const [search, setSearch] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
      if (!open) return;
      const handleClick = (event) => {
        if (!containerRef.current?.contains(event.target)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const selectedOption = options.find((option) => option.value === value);

    const handleSelect = (optionValue) => {
      onChange(optionValue);
      setOpen(false);
      setSearch('');
    };

    const filteredOptions = searchable
      ? options.filter((option) =>
          option.label.toLowerCase().includes(search.toLowerCase())
        )
      : options;

    useEffect(() => {
      if (open && searchable) {
        inputRef.current?.focus();
      }
    }, [open, searchable]);

    return (
      <div
        className={`${styles.customSelect} ${disabled ? styles.customSelectDisabled : ''}`}
        ref={containerRef}
      >
        <button
          type="button"
          className={styles.customSelectButton}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
        >
          <span>{selectedOption?.label || placeholder}</span>
          <span className={styles.customSelectCaret} />
        </button>
        {open && (
          <div className={styles.customSelectOptions}>
            {searchable && (
              <div className={styles.customSelectSearch}>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                />
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div className={styles.customSelectEmpty}>No options available</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`${styles.customSelectOption} ${
                    option.value === value ? styles.customSelectOptionActive : ''
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchClientsWithQuotations = async () => {
      try {
        const response = await fetch(`${domain}/api/clientWithQuoAndPo`, {
          method: "POST"
        });
        if (response.ok) {
          const data = await response.json();
          const simplifiedData = data.clientsWithQuotations.map(client => ({
            ...client,
            _id: client._id.toString(),
            quotations: client.quotations.map(quotation => ({
              ...quotation,
              _id: quotation._id.toString()
            }))
          }));
          setClientsWithInfo(simplifiedData);
        } else {
          console.error('Failed to fetch clients with quotations');
        }
      } catch (error) {
        console.error('Error fetching clients with quotations:', error);
      }
    };

    fetchClientsWithQuotations();
  }, []);

  const selectedClientData = clientsWithInfo.find(c => c._id === selectedClient);
  const selectedQuotationData = selectedClientData?.quotations.find(q => q._id === selectedQuotation);
  const quotationProducts = selectedQuotationData?.products || [];

  useEffect(() => {
    if (!selectedQuotationData || useManualProducts) {
      return;
    }

    if (selectedQuotationData.currency) {
      setCurrency(selectedQuotationData.currency);
    }

    const derivedBase = deriveQuotationBaseValue(selectedQuotationData);
    if (derivedBase !== null) {
      setValue(derivedBase.toFixed(2));
    }
  }, [selectedQuotationData, useManualProducts]);

  const handleClientChange = (selectedValue) => {
    setSelectedClient(selectedValue);
    setSelectedQuotation('');
    setSelectedPO('');
    setSelectedPODate('');
  };

  const handleQuotationChange = (selectedValue) => {
    setSelectedQuotation(selectedValue);
  };

  const handleManualToggle = (e) => {
    const checked = e.target.checked;
    setUseManualProducts(checked);
    if (checked && manualProducts.length === 0) {
      setManualProducts([createManualProduct()]);
    }
  };

  const handleManualProductChange = (index, field, value) => {
    setManualProducts((prev) =>
      prev.map((product, idx) => {
        if (idx !== index) return product;
        const updated = { ...product, [field]: value };
        if (field === 'qty' || field === 'unit') {
          const qty = field === 'qty' ? value : updated.qty;
          const unit = field === 'unit' ? value : updated.unit;
          const qtyNum = parseFloat(qty) || 0;
          const unitNum = parseFloat(unit) || 0;
          updated.lineTotal = qtyNum * unitNum;
        }
        return updated;
      })
    );
  };

  const addManualProductRow = () => {
    setManualProducts((prev) => [...prev, createManualProduct()]);
  };

  const removeManualProductRow = (index) => {
    setManualProducts((prev) => prev.filter((_, idx) => idx !== index));
  };

  useEffect(() => {
    if (useManualProducts) {
      setValue(manualProductsTotal ? manualProductsTotal.toFixed(2) : '');
    }
  }, [manualProductsTotal, useManualProducts]);

  const handleUploadPO = async (e) => {
    e.preventDefault();

    if (!selectedClient || !value) {
      alert('Client and value are required.');
      return;
    }

    const baseValue = parseFloat(value);
    if (Number.isNaN(baseValue) || baseValue <= 0) {
      alert('Please enter a valid value.');
      return;
    }

    const sanitizedManualProducts = useManualProducts
      ? manualProducts
          .map((product) => {
            const qtyValue =
              product.qty === '' || product.qty === null
                ? null
                : Number(product.qty);
            const unitValue =
              product.unit === '' || product.unit === null
                ? null
                : Number(product.unit);
            const lineTotalValue =
              qtyValue !== null && unitValue !== null ? qtyValue * unitValue : null;

            return {
              productCode: product.productCode?.trim() || '',
              description: product.description?.trim() || '',
              qty: Number.isNaN(qtyValue) ? null : qtyValue,
              unit: Number.isNaN(unitValue) ? null : unitValue,
              unitPrice: Number.isNaN(lineTotalValue) ? null : lineTotalValue,
            };
          })
          .filter(
            (product) =>
              product.productCode ||
              product.description ||
              product.qty !== null ||
              product.unit !== null ||
              product.unitPrice !== null
          )
      : [];

    if (!selectedQuotation && sanitizedManualProducts.length === 0) {
      alert('Select a quotation or enter at least one product manually.');
      return;
    }

    const formData = {
      poNumber: selectedPO || null,
      poDate: selectedPODate || null,
      clientId: selectedClient,
      quotationId: selectedQuotation || null,
      value,
      baseValue,
      currency,
      manualProducts: sanitizedManualProducts,
    };

    try {
      const res = await fetch('/api/jobOrder/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Job order created successfully!');
        setSelectedPO('');
        setSelectedPODate('');
        setValue('');
        router.push('/dashboard/jobOrder');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create job order.');
      }
    } catch (error) {
      console.error('Error uploading PO:', error);
      alert('Server error.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <h1>Create Job Order</h1>
        <p>Capture PO information, optionally link a quotation, and keep products in sync.</p>
      </div>
      <div className={styles.container}>
        <form onSubmit={handleUploadPO} className={styles.form}>
          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h3>Client & Quotation</h3>
              <p>Select the client and link a quotation when available.</p>
            </div>
            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label>Client</label>
                <CustomSelect
                  value={selectedClient}
                  onChange={handleClientChange}
                  options={clientsWithInfo.map((client) => ({
                    value: client._id,
                    label: client.name,
                  }))}
                  placeholder="Select Client"
                  disabled={false}
                  searchable
                />
              </div>
              <div className={styles.field}>
                <label>Quotation (optional)</label>
                <CustomSelect
                  value={selectedQuotation}
                  onChange={handleQuotationChange}
                  disabled={!selectedClient}
                  options={
                    selectedClientData?.quotations.map((quotation) => ({
                      value: quotation._id,
                      label: quotation.quotationId
                        ? quotation.projectName
                          ? `${quotation.quotationId} (${quotation.projectName})`
                          : quotation.quotationId
                        : quotation.projectName || 'Unnamed Quotation',
                    })) || []
                  }
                  placeholder="Select Quotation"
                />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h3>Products</h3>
              <p>Use manual products when a quotation is not available.</p>
            </div>
            <div className={styles.manualToggle}>
              <label>
                <input
                  type="checkbox"
                  checked={useManualProducts}
                  onChange={handleManualToggle}
                />
                Enter products manually
              </label>
              <span>Syncs the value field automatically.</span>
            </div>

            {useManualProducts && (
              <div className={styles.manualProductsShell}>
                <table className={styles.manualProductsTable}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Line Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualProducts.map((product, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            value={product.productCode}
                            onChange={(e) =>
                              handleManualProductChange(index, 'productCode', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            value={product.description}
                            onChange={(e) =>
                              handleManualProductChange(index, 'description', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={product.qty}
                            onChange={(e) =>
                              handleManualProductChange(index, 'qty', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.unit}
                            onChange={(e) =>
                              handleManualProductChange(index, 'unit', e.target.value)
                            }
                          />
                        </td>
                        <td>{Number(product.lineTotal || 0).toFixed(2)}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.removeProductButton}
                            onClick={() => removeManualProductRow(index)}
                            disabled={manualProducts.length === 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.manualProductActions}>
                  <button
                    type="button"
                    className={styles.addProductButton}
                    onClick={addManualProductRow}
                  >
                    Add Product
                  </button>
                </div>
                <div className={styles.manualSummary}>
                  <strong>
                    Manual subtotal: {manualProductsTotal.toFixed(2)} {currency}
                  </strong>
                  <span>The value field updates based on your manual products.</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h3>PO Details</h3>
              <p>Provide the PO reference shared by the client.</p>
            </div>
            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label>PO Number (optional)</label>
                <input
                  type="text"
                  value={selectedPO}
                  onChange={(e) => setSelectedPO(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>PO Date (optional)</label>
                <input
                  type="date"
                  value={selectedPODate}
                  onChange={(e) => setSelectedPODate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h3>Financials</h3>
              <p>Specify currency and the PO value.</p>
            </div>
            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label>Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Value (without VAT)</label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            </div>
            {currency === 'SAR' && value && (
              <div className={styles.vatBox}>
                Value with VAT (15%): SAR {valueWithVAT}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton}>
              Create Job Order
            </button>
          </div>
        </form>

        {quotationProducts.length > 0 && (
          <div className={styles.tableContainer}>
            <h3>Quotation Products</h3>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Description</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {quotationProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{product.productCode || '-'}</td>
                    <td dangerouslySetInnerHTML={{ __html: product.description || '-' }} />
                    <td>{product.qty || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddJobOrderPage;
