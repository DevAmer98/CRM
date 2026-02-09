"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./profile.module.css";

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const [accountData, setAccountData] = useState(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");

  const fetchAccountDetails = useCallback(async () => {
    setAccountLoading(true);
    setAccountError("");
    try {
      const response = await fetch("/api/account", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load account details.");
      }

      setAccountData(payload.user);
      setAccountForm({
        username: payload.user?.username || "",
        email: payload.user?.email || "",
        phone: payload.user?.phone || "",
        address: payload.user?.address || "",
        newPassword: "",
        confirmPassword: "",
      });
      setAccountMessage("");
    } catch (error) {
      setAccountError(error?.message || "Unable to load your account.");
    } finally {
      setAccountLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchAccountDetails();
  }, [status, fetchAccountDetails]);

  const handleAccountFieldChange = (field, value) => {
    setAccountForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (accountError) setAccountError("");
    if (accountMessage) setAccountMessage("");
  };

  const handleAccountReset = () => {
    if (!accountData) return;
    setAccountForm({
      username: accountData?.username || "",
      email: accountData?.email || "",
      phone: accountData?.phone || "",
      address: accountData?.address || "",
      newPassword: "",
      confirmPassword: "",
    });
    setAccountError("");
    setAccountMessage("");
  };

  const handleAccountSubmit = async (event) => {
    event.preventDefault();
    setAccountError("");
    setAccountMessage("");

    if (!accountForm.username.trim()) {
      setAccountError("Username is required.");
      return;
    }

    if (!accountForm.email.trim()) {
      setAccountError("Email is required.");
      return;
    }

    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      setAccountError("New passwords do not match.");
      return;
    }

    const payload = {
      username: accountForm.username.trim(),
      email: accountForm.email.trim(),
      phone: accountForm.phone || "",
      address: accountForm.address || "",
    };

    if (accountForm.newPassword) {
      payload.password = accountForm.newPassword;
    }

    setAccountSaving(true);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update account.");
      }

      setAccountData(data.user);
      setAccountMessage("Account updated successfully.");
      setAccountForm((prev) => ({
        ...prev,
        username: data.user?.username || prev.username,
        email: data.user?.email || prev.email,
        phone: data.user?.phone || "",
        address: data.user?.address || "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      setAccountError(error?.message || "Unable to update account.");
    } finally {
      setAccountSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.accountDialog}>
        <div className={styles.accountHeader}>
          <div className={styles.accountHeaderTop}>
            <div className={styles.accountHeaderInfo}>
              <h1 className={styles.accountTitle}>Account Settings</h1>
              {session?.user?.role && (
                <p className={styles.accountRole}>Role · {session.user.role}</p>
              )}
            </div>
            {accountData?.email && <span className={styles.accountBadge}>{accountData.email}</span>}
          </div>
          {accountData?.updatedAt && (
            <p className={styles.accountMeta}>
              Last updated{" "}
              {new Date(accountData.updatedAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <div className={styles.accountBody}>
          {accountError && <p className={`${styles.accountAlert} ${styles.accountAlertError}`}>{accountError}</p>}
          {accountMessage && (
            <p className={`${styles.accountAlert} ${styles.accountAlertSuccess}`}>{accountMessage}</p>
          )}

          {accountLoading ? (
            <div className={styles.accountLoading}>Loading your account…</div>
          ) : accountData ? (
            <form onSubmit={handleAccountSubmit} className={styles.accountForm}>
              <div className={styles.accountGrid}>
                <section className={`${styles.accountCard} ${styles.accountCardProfile}`}>
                  <div className={styles.accountCardHeading}>
                    <p className={styles.accountCardTitle}>Profile</p>
                    <p className={styles.accountCardSubtitle}>Basic account information</p>
                  </div>
                  <div className={styles.accountFields}>
                    <div className={styles.accountTwoColumn}>
                      {[
                        { label: "Username", type: "text", field: "username" },
                        { label: "Email", type: "email", field: "email" },
                      ].map((item) => (
                        <label key={item.field} className={styles.accountLabel}>
                          <span>{item.label}</span>
                          <input
                            type={item.type}
                            value={accountForm[item.field]}
                            onChange={(e) => handleAccountFieldChange(item.field, e.target.value)}
                            className={styles.accountInput}
                          />
                        </label>
                      ))}
                    </div>
                    <label className={styles.accountLabel}>
                      <span>Phone</span>
                      <input
                        type="tel"
                        value={accountForm.phone}
                        onChange={(e) => handleAccountFieldChange("phone", e.target.value)}
                        className={styles.accountInput}
                      />
                    </label>
                    <label className={`${styles.accountLabel} ${styles.accountLabelTextarea}`}>
                      <span>Address</span>
                      <textarea
                        value={accountForm.address}
                        onChange={(e) => handleAccountFieldChange("address", e.target.value)}
                        rows={3}
                        className={`${styles.accountInput} ${styles.accountTextarea}`}
                      />
                    </label>
                  </div>
                </section>

                <section className={`${styles.accountCard} ${styles.accountCardSecurity}`}>
                  <div className={styles.accountCardHeading}>
                    <p className={styles.accountCardTitle}>Security</p>
                    <p className={styles.accountCardSubtitle}>Update your password</p>
                  </div>
                  <div className={styles.accountFieldsColumn}>
                    <div className={styles.accountTwoColumn}>
                      {[
                        { label: "New Password", field: "newPassword" },
                        { label: "Confirm Password", field: "confirmPassword" },
                      ].map((item) => (
                        <label key={item.field} className={styles.accountLabel}>
                          <span>{item.label}</span>
                          <input
                            type="password"
                            value={accountForm[item.field]}
                            onChange={(e) => handleAccountFieldChange(item.field, e.target.value)}
                            className={styles.accountInput}
                          />
                        </label>
                      ))}
                    </div>
                    <p className={styles.accountNote}>
                      Leave both password fields empty if you do not want to update your password.
                    </p>
                  </div>
                </section>
              </div>

              <div className={styles.accountFooter}>
                <button
                  type="button"
                  onClick={handleAccountReset}
                  className={`${styles.accountButton} ${styles.accountButtonGhost}`}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className={`${styles.accountButton} ${styles.accountButtonPrimary}`}
                  disabled={accountSaving}
                >
                  {accountSaving ? "Saving changes…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.accountLoadError}>
              <p>We couldn't load your account details.</p>
              <button onClick={fetchAccountDetails}>Try again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
