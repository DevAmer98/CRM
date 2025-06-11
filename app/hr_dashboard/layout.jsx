import Sidebar from "../ui/hr_dashboard/sidebar/sidebar"
/*import Navbar from "../ui/dashboard/navbar/navbar"*/
import styles from "../ui/hr_dashboard/hr_dashboard.module.css"
import Footer from "../ui/hr_dashboard/footer/footer"
 

const layout = ({children}) => {
  return (
    // Add the data-dashboard attribute for global theming
    <div data-dashboard="main" className={styles.container}>
        <div className={styles.menu}>
            <Sidebar />
        </div>
        <div className={styles.content}>
            {children}
            <Footer />
        </div>
    </div>
  )
}

export default layout