import { NextResponse } from 'next/server';
import { connectToDB } from '@/app/lib/utils';
import { Task, User } from '@/app/lib/models';
import { auth } from '../auth/[...nextauth]/route';

export const revalidate = 0;

export async function POST(req) {
  try {
    const session = await auth();

   /* if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
*/
    const body = await req.json();
    const { title, description, deadline, assignedTo } = body;

    await connectToDB();

    const task = await Task.create({
      title,
      description,
      deadline,
      assignedTo,
      createdBy: session.user.id,
    });

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && assignedTo) {
      const assignedUser = await User.findById(assignedTo).select('email username role').lean();
      const toEmail = assignedUser?.email;
      if (toEmail) {
        const fromEmail = process.env.RESEND_FROM || "CRM <onboarding@resend.dev>";
        const appUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const roleValue = String(assignedUser?.role || "").toLowerCase();
        const dashboardPath = roleValue.includes("hr") ? "/hr_dashboard/private" : "/dashboard/private";
        const subject = `New task assigned: ${title}`;
        const text = [
          `Hi ${assignedUser?.username || ''}`.trim(),
          '',
          `A new task was assigned to you: ${title}`,
          description ? `Description: ${description}` : null,
          deadline ? `Deadline: ${deadline}` : null,
          '',
          `Open your dashboard: ${appUrl}${dashboardPath}`,
        ].filter(Boolean).join('\n');

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject,
            text,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>New Task Assigned</h2>
                <p><strong>${title}</strong></p>
                ${description ? `<p>${description}</p>` : ""}
                ${deadline ? `<p><strong>Deadline:</strong> ${deadline}</p>` : ""}
                <p><a href="${appUrl}${dashboardPath}">Open your dashboard</a></p>
              </div>
            `,
          }),
        });
      }
    }

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to create task' }, { status: 500 });
  }
}
