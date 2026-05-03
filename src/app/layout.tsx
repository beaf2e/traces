import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://traces-8x6.pages.dev";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "traces — 지도 위에 남기는 하루",
  description: "당신의 발자취를 지도 위에 부드러운 궤적으로 기록하세요.",
  manifest: "/manifest.webmanifest",
  applicationName: "traces",
  appleWebApp: {
    capable: true,
    title: "traces",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/icon-192.png" }],
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "traces",
    title: "traces — 지도 위에 남기는 하루",
    description: "당신의 발자취를 지도 위에 부드러운 궤적으로 기록하세요.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "traces — 지도 위에 남기는 하루",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "traces — 지도 위에 남기는 하루",
    description: "당신의 발자취를 지도 위에 부드러운 궤적으로 기록하세요.",
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
