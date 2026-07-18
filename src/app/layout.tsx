/**
 * Root layout pass-through.
 * Real <html>/<body> live in app/[lang]/layout.tsx (Next.js i18n routing).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
