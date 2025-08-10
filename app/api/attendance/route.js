// app/api/attendance/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const deviceIP = '192.168.1.201';
  const port = 4370;

  try {
    // Dynamically import CommonJS module (works in Next.js app router)
    const { default: ZKLib } = await import('node-zklib');

    const zk = new ZKLib(deviceIP, port, 10000, 4000);

    await zk.createSocket();

    const attendance = await zk.getAttendances();

    await zk.disconnect();

    return NextResponse.json({
      success: true,
      logs: attendance.data,
    });
  } catch (err) {
    console.error('❌ Error fetching attendance:', err);
    return NextResponse.json({
      success: false,
      message: err.message || 'Something went wrong',
    });
  }
}
