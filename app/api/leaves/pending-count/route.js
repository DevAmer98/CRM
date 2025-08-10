import { getPendingLeavesCount } from '@/app/lib/data';

export async function GET() {
  try {
    const count = await getPendingLeavesCount();
    return Response.json({ count });
  } catch (error) {
    return Response.json({ count: 0 }, { status: 500 });
  }
}
