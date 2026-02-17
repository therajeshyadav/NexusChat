import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-discord-darkest p-4">
      <div className="w-full max-w-md rounded-lg bg-discord-dark p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none" className="text-primary-foreground">
              <path d="M23.7 1.7A23.3 23.3 0 0017.9.1a.1.1 0 00-.1 0 16 16 0 00-.7 1.5 21.5 21.5 0 00-6.4 0A15 15 0 0010 .1a.1.1 0 00-.1 0 23.2 23.2 0 00-5.8 1.6.1.1 0 000 0A24 24 0 00.1 16.2a.1.1 0 000 .1 23.4 23.4 0 007.1 3.6.1.1 0 00.1 0 16.7 16.7 0 001.5-2.4.1.1 0 000-.1 15.4 15.4 0 01-2.4-1.2.1.1 0 010-.2l.5-.4a.1.1 0 01.1 0 16.7 16.7 0 0014.2 0 .1.1 0 01.1 0l.5.4a.1.1 0 010 .2 14.5 14.5 0 01-2.5 1.2.1.1 0 000 .1 18.8 18.8 0 001.5 2.4.1.1 0 00.1 0 23.3 23.3 0 007.1-3.6.1.1 0 000-.1A24 24 0 0023.7 1.7zM9.3 13.3c-1.3 0-2.4-1.2-2.4-2.7s1.1-2.7 2.4-2.7 2.5 1.2 2.4 2.7c0 1.5-1 2.7-2.4 2.7zm8.8 0c-1.3 0-2.4-1.2-2.4-2.7s1.1-2.7 2.4-2.7 2.5 1.2 2.4 2.7c0 1.5-1 2.7-2.4 2.7z" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
