/*"use client"
import Link from 'next/link'
import styles from './menuLinks.module.css'
import { usePathname } from 'next/navigation'

const MenuLinks = ({item}) => {

  const pathname = usePathname()

  return (
    <Link href={item.path} className={`${styles.container} ${pathname === item.path && styles.active}`}>
      {item.icon}
      {item.title}
    </Link>
  )
}

export default MenuLinks 
*/


"use client"
import Link from 'next/link'
import styles from './menuLinks.module.css'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const MenuLinks = ({ item }) => {
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
    </Link>
  )
}

export default MenuLinks
