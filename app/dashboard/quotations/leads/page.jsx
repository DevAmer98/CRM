import { fetchLeads } from '@/app/lib/data';
import ShowLeads from '@/app/ui/dashboard/leads/showLeads';

const LeadsPage = async ({ searchParams }) => {
  const q = searchParams?.q || '';
  const page = Number(searchParams?.page || 1);

  const { leads, count } = await fetchLeads(q, page);

  return <ShowLeads leads={leads} count={count} />;
};

export default LeadsPage;
