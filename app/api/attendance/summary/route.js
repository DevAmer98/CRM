import { NextResponse } from 'next/server';
import { AttendanceDaily, Employee, Shift } from '@/app/lib/models';
import { connectToDB } from '@/app/lib/utils';
import { formatDateKey, formatDateTimeLocal } from '@/app/lib/attendance';

export const runtime = 'nodejs';
export const revalidate = 0;

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function timeToMinutes(value) {
  if (!value || typeof value !== 'string') return null;
  const [h, m] = value.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function dateRangeKeys(from, to) {
  const result = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    result.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export async function GET(request) {
  const searchDate = request.nextUrl.searchParams.get('date');
  const searchFrom = request.nextUrl.searchParams.get('from');
  const searchTo = request.nextUrl.searchParams.get('to');
  const includeRangeRows = request.nextUrl.searchParams.get('includeRangeRows') === '1';
  const today = formatDateKey(new Date());
  const date = isDateKey(searchDate) ? searchDate : today;

  try {
    await connectToDB();

    const defaultFromDate = new Date(`${date}T00:00:00`);
    defaultFromDate.setDate(defaultFromDate.getDate() - 29);
    let from = isDateKey(searchFrom) ? searchFrom : formatDateKey(defaultFromDate);
    let to = isDateKey(searchTo) ? searchTo : date;
    if (from > to) {
      const swap = from;
      from = to;
      to = swap;
    }
    const rangeDates = dateRangeKeys(from, to);

    const [rowsForDate, rowsForRange, employees, shiftsForDate] = await Promise.all([
      AttendanceDaily.find({ date }).lean(),
      includeRangeRows
        ? AttendanceDaily.find({ date: { $in: rangeDates } }).lean()
        : Promise.resolve([]),
      Employee.find({})
        .select('name employeeNo department')
        .populate({ path: 'department', select: 'name' })
        .lean(),
      Shift.find({ date }).select('employee startTime').lean()
    ]);

    const employeeById = new Map();
    const employeeByNo = new Map();
    const employeeByName = new Map();
    employees.forEach(emp => {
      employeeById.set(String(emp._id), emp);
      if (emp.employeeNo) employeeByNo.set(String(emp.employeeNo), emp);
      employeeByName.set(normalizeName(emp.name), emp);
    });

    const shiftStartByEmployeeId = new Map();
    shiftsForDate.forEach(shift => {
      const key = String(shift.employee || '');
      if (!key) return;
      const startMinutes = timeToMinutes(shift.startTime);
      if (!Number.isFinite(startMinutes)) return;
      const existing = shiftStartByEmployeeId.get(key);
      if (!existing || startMinutes < existing.startMinutes) {
        shiftStartByEmployeeId.set(key, { startTime: shift.startTime, startMinutes });
      }
    });

    const mapRows = sourceRows =>
      sourceRows
        .map(row => ({
          ...row,
          employee:
            employeeById.get(String(row.personId || '')) ||
            employeeByNo.get(String(row.personId || '')) ||
            employeeByName.get(normalizeName(row.personName))
        }))
        .map(row => ({
          date: row.date,
          personName: row.personName,
          employeeId: row.employee?._id ? String(row.employee._id) : '',
          employeeNo: row.employee?.employeeNo ? String(row.employee.employeeNo) : '',
          department: row.employee?.department?.name || 'Unassigned',
          scheduledStart:
            row.date === date && row.employee?._id
              ? shiftStartByEmployeeId.get(String(row.employee._id))?.startTime || ''
              : '',
          firstIn: formatDateTimeLocal(new Date(row.firstIn)),
          lastOut: formatDateTimeLocal(new Date(row.lastOut))
        }));

    const rows = mapRows(rowsForDate)
      .sort((a, b) => a.personName.localeCompare(b.personName));
    const rangeRows = mapRows(rowsForRange).sort(
      (a, b) => a.date.localeCompare(b.date) || a.personName.localeCompare(b.personName)
    );

    const countsByDay = await AttendanceDaily.aggregate([
      { $match: { date: { $in: rangeDates } } },
      { $group: { _id: '$date', count: { $sum: 1 } } }
    ]);

    const dayCountMap = Object.fromEntries(countsByDay.map(x => [x._id, x.count]));
    const trend = rangeDates.map(d => ({ date: d, count: dayCountMap[d] || 0 }));
    const counts = trend.map(item => item.count);
    const averageAttendance = Number(
      (counts.reduce((sum, count) => sum + count, 0) / counts.length).toFixed(2)
    );
    const departments = Array.from(new Set(rows.map(r => r.department))).sort((a, b) =>
      a.localeCompare(b)
    );

    return NextResponse.json({
      success: true,
      date,
      from,
      to,
      totalPresent: rows.length,
      averageAttendance,
      trend,
      departments,
      rows,
      rangeRows: includeRangeRows ? rangeRows : undefined
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch attendance summary',
        date,
        totalPresent: 0,
        averageAttendance: 0,
        rows: []
      },
      { status: 500 }
    );
  }
}
