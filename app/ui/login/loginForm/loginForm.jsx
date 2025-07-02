"use client";
import { authenticate } from "@/app/lib/actions";
import styles from "./loginForm.module.css";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react"; // ✅ import signIn from next-auth/react

const LoginForm = () => {
  const router = useRouter();
  const [state, formAction] = useFormState(authenticate, undefined);
  const formRef = useRef();

  useEffect(() => {
    const doSignIn = async () => {
      if (state?.success) {
        const formData = new FormData(formRef.current);
        const username = formData.get("username");
        const password = formData.get("password");

        // ✅ actually sign in with NextAuth on the client
        const res = await signIn("credentials", {
          username,
          password,
          redirect: false, // we'll handle the redirect ourselves
        });

        if (res?.ok) {
          // Redirect based on role from your authenticate result
          const redirectPath = state.userRole === "hrAdmin"
            ? "/hr_dashboard"
            : "/dashboard/private";
          router.push(redirectPath);
        } else {
          console.error("signIn failed", res);
        }
      }
    };

    doSignIn();
  }, [state, router]);

  return (
    <form action={formAction} ref={formRef} className={styles.form}>
      <h1>Login</h1>
      <input type="text" placeholder="username" name="username" required />
      <input type="password" placeholder="password" name="password" required />
      <button type="submit">Login</button>
      {state?.error && <p className={styles.error}>{state.error}</p>}
    </form>
  );
};

export default LoginForm;
