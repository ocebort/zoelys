import { type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function SiteLayout({
  children,
  transparentNav = false,
  noTopPadding = false,
}: {
  children: ReactNode;
  transparentNav?: boolean;
  noTopPadding?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar transparent={transparentNav} />
      <main className={`flex-1 ${noTopPadding ? "" : "pt-20"}`}>{children}</main>
      <Footer />
    </div>
  );
}
