import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Stellar PolarisPay | Programmable Milestone Escrows & Payroll",
  description:
    "Production-grade, non-custodial milestone escrow and streaming disbursement protocol built natively on Stellar & Soroban.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-polaris-dark text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
