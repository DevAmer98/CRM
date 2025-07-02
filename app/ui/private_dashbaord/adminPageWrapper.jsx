import { auth } from "@/app/auth";
import AdminPage from "./admin";

const AdminPageWrapper = async () => {
  const session = await auth();
  const username = session?.user?.username || session?.user?.email || "User";

  return <AdminPage username={username} />;
};

export default AdminPageWrapper;
