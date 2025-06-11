/*export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = auth?.user;
      const isOnDashboard = request.nextUrl?.pathname.startsWith("/dashboard");
      const isOnHrDashboard = request.nextUrl?.pathname.startsWith("/hr_dashboard");

      if (isOnDashboard || isOnHrDashboard) {
        return !!isLoggedIn;
      }

      if (isLoggedIn) {
        const redirectPath = auth.user.role === "hrAdmin" ? "/hr_dashboard" : "/dashboard";
        return Response.redirect(new URL(redirectPath, request.nextUrl));
      }
      return true;
    },
      async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? "user";
        token.id = user.id ?? null;
        token.username = user.username ?? null;
      }
      return token;
    },

    async session({ session, token }) {

           if (!session.user) {
    session.user = {};
  }
      session.user.role = token.role;
      session.user.id = token.id;
      session.user.username = token.username;
      return session;
    }
  }
};
*/



import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDB } from "./lib/utils";
import { User } from "./lib/models";
import bcrypt from "bcrypt";

const login = async (credentials) => {
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

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        try {
          return await login(credentials);
        } catch (err) {
          console.error("Authorization error:", err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = auth?.user;
      const isOnDashboard = request.nextUrl?.pathname.startsWith("/dashboard");
      const isOnHrDashboard = request.nextUrl?.pathname.startsWith("/hr_dashboard");

      if (isOnDashboard || isOnHrDashboard) {
        return !!isLoggedIn;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? null;
        token.username = user.username ?? null;
        token.email = user.email ?? null;
        token.role = user.role ?? "user";
        token.img = user.img ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (!session) session = {};
      if (!session.user) session.user = {};

      session.user.id = token.id;
      session.user.username = token.username;
      session.user.email = token.email;
      session.user.role = token.role;
      session.user.img = token.img;

      return session;
    },
  },
};
