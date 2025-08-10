import { fetchJobOrders } from "@/app/lib/data";
import ShowJobOrders from "@/app/ui/dashboard/jobOrder/showJobOrder";

const JobOrderPage = async({searchParams}) => {
  const q = searchParams?.q || "";
  const page = searchParams?.page || 1;

   const { jobOrders, count } = await fetchJobOrders(q, page);
    
    return (
      <div>
  <ShowJobOrders jobOrders={jobOrders} count={count} />
       </div>
      
    );
}

export default JobOrderPage

 