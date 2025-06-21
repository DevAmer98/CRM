import React from "react";
import { auth } from "@/app/auth";

 

const FetchUser = async () => {
 
     const session = await auth(); // This runs on the server
     const user = session?.user || null;

  return (
   <div>
    <h3>
        {user.name}
    </h3>
   </div>
  );
};

export default FetchUser;