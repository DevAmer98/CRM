import { onAttendanceEvent } from '@/app/lib/attendanceEvents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ssePayload(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  let unsubscribe = null;
  let ping = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      controller.enqueue(encoder.encode(ssePayload('connected', { ok: true })));

      unsubscribe = onAttendanceEvent(payload => {
        controller.enqueue(encoder.encode(ssePayload('attendance', payload)));
      });

      ping = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 25000);
    },
    cancel() {
      if (ping) clearInterval(ping);
      if (unsubscribe) unsubscribe();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
