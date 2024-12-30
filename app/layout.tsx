import React from "react";
import "./globals.css";

export const metadata = {
  title: "trc",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon Link */}
        <link rel="icon" href="/daniel-defoe.jpeg" />
      </head>
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}
