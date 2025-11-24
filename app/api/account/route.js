import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectToDB } from "@/app/lib/utils";
import { User } from "@/app/lib/models";
import { auth } from "../auth/[...nextauth]/route";

const sanitizeUser = user => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  phone: user.phone || "",
  address: user.address || "",
  role: user.role,
  img: user.img || "",
  updatedAt: user.updatedAt,
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("Failed to load account:", error);
    return NextResponse.json({ message: "Failed to load account details" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, email, phone, address, password } = body || {};

    await connectToDB();

    const updateFields = {};

    if (typeof username === "string" && username.trim()) {
      updateFields.username = username.trim();
    }

    if (typeof email === "string" && email.trim()) {
      updateFields.email = email.trim();
    }

    if (typeof phone === "string") {
      updateFields.phone = phone.trim();
    }

    if (typeof address === "string") {
      updateFields.address = address.trim();
    }

    if (typeof password === "string" && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password.trim(), salt);
    }

    if (!Object.keys(updateFields).length) {
      return NextResponse.json({ message: "No changes detected" }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(session.user.id, updateFields, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: sanitizeUser(updatedUser) });
  } catch (error) {
    console.error("Failed to update account:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to update account" },
      { status: 500 }
    );
  }
}
