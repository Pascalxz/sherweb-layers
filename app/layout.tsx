import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sherweb Layer",
  description: "On-brand content generation for Sherweb.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
