import React from 'react'
import ShowClients from '@/app/ui/dashboard/client/showClient';
import { fetchClientsWithQuotations } from '@/app/lib/data';

const ClientsPage = async({searchParams}) => {
  const q = searchParams?.q || "";
  const page = searchParams?.page || 1;

   const { clients, count } = await fetchClientsWithQuotations(q, page);
    
    return (
      <div>
  <ShowClients clients={clients} count={count} />
       </div>
      
    );
}

export default ClientsPage