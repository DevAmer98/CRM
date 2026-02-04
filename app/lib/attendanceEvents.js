import { EventEmitter } from 'events';

const globalKey = '__attendance_emitter__';

function getEmitter() {
  if (!globalThis[globalKey]) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(200);
    globalThis[globalKey] = emitter;
  }
  return globalThis[globalKey];
}

export function publishAttendanceEvent(payload = {}) {
  getEmitter().emit('attendance', {
    at: new Date().toISOString(),
    ...payload
  });
}

export function onAttendanceEvent(handler) {
  const emitter = getEmitter();
  emitter.on('attendance', handler);
  return () => emitter.off('attendance', handler);
}
