import Image from "next/image";
import styles from "@/app/ui/homePage/homePage.module.css";

import Link from "next/link";

const Homepage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <Image
          src="/ph6.png" 
          alt="Background"
          fill 
          style={{ objectFit: 'cover' }} 
        />
      </div>
      <div className={styles.overlay}>
        <Link href='/login'>
      <button className={styles['button-86']} role="button">Log In</button>
        </Link>
      </div>
    </div>
  );
};

export default Homepage
