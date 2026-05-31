import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DemoBanner } from "@/components/demo-banner";

export const metadata: Metadata = {
  title: "Vault — your credit-card advisor",
  description: "Ask which of your cards to use for any purchase. AI advisor with the math shown.",
  manifest: "/manifest.json",
  applicationName: "Vault",
  appleWebApp: { capable: true, title: "Vault", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <DemoBanner />
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

function ServiceWorkerRegistrar() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
        if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          });
        }`,
      }}
    />
  );
}
