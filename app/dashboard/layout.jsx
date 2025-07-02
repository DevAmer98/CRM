import Sidebar from "../ui/dashboard/sidebar/sidebar"
import Navbar from "../ui/dashboard/navbar/navbar"
import styles from "../ui/dashboard/dashboard.module.css"
import Footer from "../ui/dashboard/footer/footer"
import Main from "../ui/dashboard/main/main"
import { SessionProvider } from "next-auth/react"
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation"



const layout = async ({ children }) => {

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
        <div className={ styles.content}>
          <Navbar />
            {children}
        </div>
    </div>
    </SessionProvider>

  )
}

export default layout