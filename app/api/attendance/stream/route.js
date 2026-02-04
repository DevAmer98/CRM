import { AttendanceEvent } from '@/app/lib/models';
import { connectToDB } from '@/app/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ssePayload(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  await connectToDB();

  let changeStream = null;
  let ping = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      controller.enqueue(encoder.encode(ssePayload('connected', { ok: true })));

      changeStream = AttendanceEvent.watch(
        [{ $match: { operationType: 'insert' } }],
        { fullDocument: 'updateLookup' }
      );

      changeStream.on('change', change => {
        const doc = change?.fullDocument || {};
        controller.enqueue(
          encoder.encode(
            ssePayload('attendance', {
              personName: doc.personName || 'Unknown',
              personId: doc.personId || '',
              date: doc.date,
              time: doc.time,
              at: new Date().toISOString()
            })
          )
        );
      });

      changeStream.on('error', err => {
        controller.enqueue(encoder.encode(ssePayload('error', { message: err.message })));
      });

      ping = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 25000);
    },
    cancel() {
      if (ping) clearInterval(ping);
      if (changeStream) changeStream.close();
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
