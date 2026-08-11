import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md w-full p-8 glass-strong squircle-lg">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full glass-tint">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-6 font-display text-3xl uppercase tracking-tight">Access Restricted</h1>
          <p className="mt-4 text-sm text-foreground/65">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>
          <div className="mt-8 rounded-[0.9rem] glass p-4 text-sm text-foreground/65 text-left">
            <p>If you believe this is an error, you can:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;