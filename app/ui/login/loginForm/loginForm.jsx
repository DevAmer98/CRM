"use client";
import { authenticate } from "@/app/lib/actions";
import styles from "./loginForm.module.css";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LoginForm = () => {
  const router = useRouter();
  const [state, formAction] = useFormState(authenticate, undefined);
  
  useEffect(() => {
    // Check if authentication was successful and user role is available
    if (state?.success && state?.userRole) {
      // Redirect based on the role returned from the authenticate function
      const redirectPath = state.userRole === "hrAdmin" 
        ? "/hr_dashboard" 
        : "/dashboard";
      router.push(redirectPath);
    }
  }, [state, router]);

  return (
    <form action={formAction} className={styles.form}>
      <h1>Login</h1>
      <input type="text" placeholder="username" name="username" />
      <input type="password" placeholder="password" name="password" />
      <button>Login</button>
      {state?.error && <p className={styles.error}>{state.error}</p>}
    </form>
  );
};

export default LoginForm;