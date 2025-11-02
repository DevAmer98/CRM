'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '@/app/ui/forms/LeadForm.module.css';
import { addLead } from '@/app/lib/actions';
import { z } from 'zod';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const leadSchema = z.object({
  salutation: z.string().optional(),
  name: z.string().trim().min(1, 'Lead name is required'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .optional(),
  agentId: z.string().optional(),
  source: z.string().trim().optional(),
  category: z.string().trim().optional(),
  allowFollowUp: z.boolean(),
  status: z.enum(['Pending', 'Contacted', 'In Progress', 'Qualified', 'Won', 'Lost']),
  currency: z.enum(['SAR', 'USD']),
  leadValue: z.number().min(0, 'Lead value must be zero or higher'),
  note: z.string().optional(),
  companyName: z.string().trim().optional(),
  website: z.string().trim().optional(),
  mobile: z.string().trim().optional(),
  officePhoneNumber: z.string().trim().optional(),
});

const salutationOptions = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
const statusOptions = ['Pending', 'Contacted', 'In Progress', 'Qualified', 'Won', 'Lost'];
const sourceOptions = ['Referral', 'Website', 'Email Campaign', 'Phone Inquiry', 'Walk-in'];
const categoryOptions = ['Product', 'Service', 'Consulting', 'Maintenance'];
const currencyOptions = ['SAR', 'USD'];

const AddLeadForm = () => {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [products, setProducts] = useState([{ id: 1, value: '' }]);
  const [note, setNote] = useState('');
  const [sourceChoice, setSourceChoice] = useState('');
  const [categoryChoice, setCategoryChoice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const apiBase = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    return base && base.length > 0 ? base : '';
  }, []);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const endpoint = apiBase ? `${apiBase}/api/allSales` : '/api/allSales';
        const response = await fetch(endpoint, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Unable to load agents');
        }
        const data = await response.json();
        setAgents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load agents');
      } finally {
        setAgentsLoading(false);
      }
    };

    fetchAgents();
  }, [apiBase]);

  const handleProductChange = (index, value) => {
    setProducts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, value } : item))
    );
  };

  const addProductField = () => {
    setProducts((prev) => [...prev, { id: Date.now(), value: '' }]);
  };

  const removeProductField = (index) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const sourceOption = formData.get('sourceOption')?.toString() || '';
    const categoryOption = formData.get('categoryOption')?.toString() || '';
    const leadValueInput = formData.get('leadValue')?.toString() || '0';
    const emailInput = formData.get('email')?.toString().trim();

    const payload = {
      salutation: formData.get('salutation')?.toString() || undefined,
      name: formData.get('name')?.toString().trim() || '',
      email: emailInput ? emailInput : undefined,
      agentId: formData.get('agentId')?.toString() || undefined,
      source:
        sourceOption === 'custom'
          ? formData.get('sourceCustom')?.toString().trim() || undefined
          : sourceOption || undefined,
      category:
        categoryOption === 'custom'
          ? formData.get('categoryCustom')?.toString().trim() || undefined
          : categoryOption || undefined,
      allowFollowUp: (formData.get('allowFollowUp') || 'yes').toString() === 'yes',
      status: formData.get('status')?.toString() || 'Pending',
      currency: formData.get('currency')?.toString() || 'SAR',
      leadValue: Number(leadValueInput) || 0,
      products: products
        .map((item) => item.value.trim())
        .filter((value) => value.length > 0),
      note,
      companyName: formData.get('companyName')?.toString().trim() || undefined,
      website: formData.get('website')?.toString().trim() || undefined,
      mobile: formData.get('mobile')?.toString().trim() || undefined,
      officePhoneNumber:
        formData.get('officePhoneNumber')?.toString().trim() || undefined,
    };

    try {
      const validated = leadSchema.parse(payload);
      const result = await addLead(validated);
      if (result?.success) {
        toast.success('Lead registered successfully');
        router.push('/dashboard/quotations/leads');
      } else {
        toast.error(result?.message || 'Failed to add lead');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => toast.error(err.message));
      } else {
        toast.error(error?.message || 'Failed to add lead');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Add Lead Info</h1>
        <p className={styles.subtitle}>
          Capture lead details to keep your pipeline organised and actionable.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Lead Details</h2>
            <p className={styles.sectionHint}>
              Basic contact information and pipeline status for this lead.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="salutation">
                Salutation
              </label>
              <select className={styles.select} name="salutation" id="salutation" defaultValue="">
                <option value="">--</option>
                {salutationOptions.map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Lead Name <span className={styles.required}>*</span>
              </label>
              <input
                className={styles.input}
                id="name"
                name="name"
                type="text"
                placeholder="e.g. John Doe"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Lead Email
              </label>
              <input
                className={styles.input}
                id="email"
                name="email"
                type="email"
                placeholder="e.g. johndoe@example.com"
              />
              <span className={styles.meta}>Email will be used to send proposals.</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="agentId">
                Choose Agent
              </label>
              <select
                className={styles.select}
                id="agentId"
                name="agentId"
                defaultValue=""
              >
                <option value="">--</option>
                {agentsLoading && <option value="" disabled>Loading...</option>}
                {!agentsLoading &&
                  agents.map((agent) => (
                    <option key={agent._id || agent.id} value={agent._id || agent.id}>
                      {agent.name || agent.fullName || 'Unnamed agent'}
                    </option>
                  ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="sourceOption">
                Lead Source
              </label>
              <select
                className={styles.select}
                id="sourceOption"
                name="sourceOption"
                value={sourceChoice}
                onChange={(event) => setSourceChoice(event.target.value)}
              >
                <option value="">--</option>
                {sourceOptions.map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
                <option value="custom">Other</option>
              </select>
              {sourceChoice === 'custom' && (
                <input
                  className={styles.input}
                  name="sourceCustom"
                  type="text"
                  placeholder="Enter source"
                />
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="categoryOption">
                Lead Category
              </label>
              <select
                className={styles.select}
                id="categoryOption"
                name="categoryOption"
                value={categoryChoice}
                onChange={(event) => setCategoryChoice(event.target.value)}
              >
                <option value="">--</option>
                {categoryOptions.map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
                <option value="custom">Other</option>
              </select>
              {categoryChoice === 'custom' && (
                <input
                  className={styles.input}
                  name="categoryCustom"
                  type="text"
                  placeholder="Enter category"
                />
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="leadValue">
                Lead Value
              </label>
              <div className={styles.dualField}>
                <select className={styles.select} name="currency" defaultValue="SAR">
                  {currencyOptions.map((option) => (
                    <option value={option} key={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  className={styles.input}
                  id="leadValue"
                  name="leadValue"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="allowFollowUp">
                Allow Follow Up
              </label>
              <select
                className={styles.select}
                id="allowFollowUp"
                name="allowFollowUp"
                defaultValue="yes"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="status">
                Status
              </label>
              <select
                className={styles.select}
                id="status"
                name="status"
                defaultValue="Pending"
              >
                {statusOptions.map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

        

          <div className={styles.field}>
            <label className={styles.label}>Note</label>
            <div className={styles.noteEditor}>
              <ReactQuill theme="snow" value={note} onChange={setNote} />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Company Details</h2>
            <p className={styles.sectionHint}>
              Additional context for the organisation associated with this lead.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="companyName">
                Company Name
              </label>
              <input
                className={styles.input}
                id="companyName"
                name="companyName"
                type="text"
                placeholder="e.g. Acme Corporation"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="website">
                Website
              </label>
              <input
                className={styles.input}
                id="website"
                name="website"
                type="url"
                placeholder="e.g. https://www.example.com"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="mobile">
                Mobile
              </label>
              <input
                className={styles.input}
                id="mobile"
                name="mobile"
                type="tel"
                placeholder="e.g. 1234567890"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="officePhoneNumber">
                Office Phone Number
              </label>
              <input
                className={styles.input}
                id="officePhoneNumber"
                name="officePhoneNumber"
                type="tel"
                placeholder="e.g. +966 12 345 6789"
              />
            </div>
          </div>
        </section>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button className={styles.submitButton} type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Lead'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLeadForm;
