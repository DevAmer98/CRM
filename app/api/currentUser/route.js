/*import { getSession } from "next-auth/react";
import {NextResponse } from "next/server";

export const revalidate = 0; 

export default async function GET(req, res) {
  const session = await getSession({ req });
  if (session) {
    return NextResponse.status(200).json({ user: session.user });
  } else {
    // Not Signed in
    res.status(401);
    res.end();
  }
}

*/


import { getServerSession } from "next-auth";
import { authConfig } from "@/app/authconfig" // adjust this import if needed
import { NextResponse } from "next/server";

export const revalidate = 0;

export async function GET(req) {
  const session = await getServerSession(authConfig);

  if (session?.user) {
    return NextResponse.json({ user: session.user });
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
