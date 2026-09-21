import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinPay — Smart & Secure Financial Platform",
  description:
    "AI-powered FinTech financial platform & risk assessment using ViT-B/16 · DeBERTa-v3 · Whisper Telugu · FT-Transformer with Cross-Attention Fusion",
  keywords: "finpay, fintech, risk assessment, AI, machine learning, payments, loan, KYC, fraud detection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
