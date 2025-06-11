import Image from "next/image";
import styles from "./footer.module.css";

const Footer = () => {
  return (
    <div className={styles.container}>

      <div className={styles.background}>
        <Image src="/Picture1.png" alt="" width={300} height={100} />
      </div>
      {/*<div className={styles.logo}>TheEagle</div>*/}
      <div className={styles.text}>© All rights reserved.</div>
    </div>
  );
};

export default Footer;
