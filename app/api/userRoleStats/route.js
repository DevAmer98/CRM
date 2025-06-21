import { NextResponse } from "next/server";
import { User } from "@/app/lib/models";
import { ROLES } from "@/app/lib/role"; // Make sure the path is correct
import { connectToDB } from "@/app/lib/utils";

export async function GET() {
  try {
    await connectToDB();

    // Aggregate counts grouped by role
    const roleCounts = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert aggregation result to a lookup map
    const countMap = roleCounts.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    // Ensure all roles from ROLES are represented
    const stats = Object.values(ROLES).map((role) => ({
      role,
      count: countMap[role] || 0,
    }));

    return NextResponse.json({ stats }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/userRoleStats:", err);
    return NextResponse.json({ error: "Failed to fetch user role statistics." }, { status: 500 });
  }
}
