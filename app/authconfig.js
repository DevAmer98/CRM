export const authConfig = {
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
        token.role = user.role;
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.id;
      session.user.username = token.username;
      return session;
    }
  }
};