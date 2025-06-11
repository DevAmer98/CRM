import React from 'react'
import Link from 'next/link'
import styles from '@/app/ui/dashboard/pl_coc/pl_coc.module.css'
const Pl_cocPage = () => {
  return (
    <div className={styles.container}>
      <Link href='/dashboard/approves'>
      <button className={styles['button-86']} role="button">Quotation</button>
      </Link>
      <Link href='/dashboard/approvePo'>
      <button className={styles['button-86']} role="button">Purchase Order</button>
      </Link>
      <Link href='/dashboard/approveCoc'>
      <button className={styles['button-86']} role="button">Coc</button>
      </Link>
      </div>
    
  )
}

export default Pl_cocPage