export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No sidebar, no nav — full-screen subscribe page
  return <>{children}</>
}
