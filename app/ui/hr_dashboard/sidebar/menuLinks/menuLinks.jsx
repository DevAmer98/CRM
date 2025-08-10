"use client"
import Link from 'next/link'
import styles from './menuLinks.module.css'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const MenuLinks = ({ item, badge = 0 }) => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (path) => pathname === path

  if (item.children) {
    const anyChildActive = item.children.some(child => isActive(child.path))

    return (
      <div className={styles.nestedContainer}>
        <div
          className={`${styles.container} ${anyChildActive ? styles.active : ''}`}
          onClick={() => setOpen(!open)}
        >
          {item.icon}
          <span className={styles.title}>{item.title}</span>
          {badge > 0 && <span className={styles.badge}>{badge}</span>}
        </div>

        {open && (
          <div className={styles.subMenu}>
          {item.children.map(child => (
  <Link
    key={child.title}
    href={child.path}
    className={`${styles.subLink} ${isActive(child.path) ? styles.active : ''}`}
  >
    {child.icon}
    <span className={styles.subTitle}>{child.title}</span>
    {child.badge > 0 && <span className={styles.badge}>{child.badge}</span>} {/* ✅ Add this */}
  </Link>
))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link href={item.path} className={`${styles.container} ${isActive(item.path) ? styles.active : ''}`}>
      {item.icon}
      <span className={styles.title}>{item.title}</span>
      {badge > 0 && <span className={styles.badge}>{badge}</span>}
    </Link>
  )
}

export default MenuLinks
