import { auth } from "@/app/auth";

const Username = async () => {
  const session = await auth();
  const user = session?.user;

  return (
    <div>
      Hi, {user?.username || user?.email || "User"}
    </div>
  );
};

export default Username;


