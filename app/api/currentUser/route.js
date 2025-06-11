import { getSession } from "next-auth/react";
import {NextResponse } from "next/server";

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

