export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Animated gradient orbs in background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/20 rounded-full blur-[100px] animate-pulse [animation-delay:1s]" />
      </div>
      <div className="w-full max-w-md p-8 relative z-10">
        {children}
        <p className="text-center text-xs text-white/25 mt-8">
          Created by <span className="text-indigo-400/60 font-medium">Cyber AK</span>
        </p>
      </div>
    </div>
  )
}
