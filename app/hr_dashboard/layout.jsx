import Sidebar from "../ui/hr_dashboard/sidebar/sidebar"
/*import Navbar from "../ui/dashboard/navbar/navbar"*/
import styles from "../ui/hr_dashboard/hr_dashboard.module.css"
import Footer from "../ui/hr_dashboard/footer/footer"
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { SessionProvider } from "next-auth/react"
import { redirect } from "next/navigation"
import Navbar from "../ui/dashboard/navbar/navbar";



const layout = async({children}) => {



  const session = await auth();

  if (!session?.user) {
    // Protect your dashboard pages
    redirect("/login");
  }
  return (
    <SessionProvider>
    <div data-dashboard="main" className={styles.container}>

        <div className={styles.menu}>
 <Sidebar session={session} />       
        </div>
        <div className={styles.content}>
          <Navbar />
            {children}
            <Footer />
        </div>
    </div> 
    </SessionProvider>
  )
}

export default layout