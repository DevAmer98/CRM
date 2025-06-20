import Sidebar from "../ui/dashboard/sidebar/sidebar"
import Navbar from "../ui/dashboard/navbar/navbar"
import styles from "../ui/dashboard/dashboard.module.css"
import Footer from "../ui/dashboard/footer/footer"
import Main from "../ui/dashboard/main/main"


const layout = ({children}) => {
  return (
    <div data-dashboard="main" className={styles.container}>

        <div className={styles.menu}>
            <Sidebar />
        </div>
        <div className={ styles.content}>
          <Navbar />
            {children}
        </div>
    </div>
  )
}

export default layout