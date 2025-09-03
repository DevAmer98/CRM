import { notFound } from 'next/navigation';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { fetchShift } from '@/app/lib/data';
import EditShift from '@/app/ui/forms/shifts/EditShift';

const SingleShiftPage = async ({ params }) => {
  const session = await auth();

  const id = params?.id;
  if (!id) notFound();

  const shift = await fetchShift(id);
  if (!shift) notFound();

  return <EditShift session={session} shift={shift} />;
};

export default SingleShiftPage;
