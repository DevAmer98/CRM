// app/debug/page.jsx
"use client";

import { useSession } from "next-auth/react";

export default function DebugPage() {
  const { data: session, status } = useSession();
  
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Session Debug</h1>
      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>
      <div className="mb-4">
        <strong>Session Data:</strong>
        <pre className="bg-gray-100 p-4 rounded mt-2">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
      <div className="mb-4">
        <strong>User Role:</strong> {session?.user?.role || 'Not set'}
      </div>
    </div>
  );
}