import { connectToDB } from "@/app/lib/utils";
import { User } from "@/app/lib/models";
import bcrypt from "bcrypt";

// Define login helper function
export const login = async (credentials) => {
  try {
    await connectToDB();
    const user = await User.findOne({ username: credentials.username });

    if (!user) throw new Error("Wrong credentials!");

    const isPasswordCorrect = await bcrypt.compare(
      credentials.password,
      user.password
    );

    if (!isPasswordCorrect) throw new Error("Wrong credentials!");

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      img: user.img,
    };
  } catch (err) {
    console.error("Login error:", err);
    throw new Error("Failed to login");
  }
};
