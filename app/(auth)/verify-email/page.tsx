import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MailCheck, ArrowRight } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-center">
      <CardHeader className="pb-2">
        <div className="mx-auto mb-4 rounded-full bg-indigo-500/10 p-5">
          <MailCheck className="h-12 w-12 text-indigo-400 mx-auto animate-bounce" />
        </div>
        <div className="mx-auto mb-2 flex items-center gap-2 text-2xl font-bold">
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Email
          </span>
          <span className="text-white">Send</span>
        </div>
        <CardTitle className="text-white text-xl">Check your email</CardTitle>
        <CardDescription className="text-white/60">
          We&apos;ve sent a verification link to your email address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/70">
            Click the link in the email to verify your account, then come back
            here and sign in.
          </p>
        </div>

        <Link href="/login">
          <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold">
            Go to Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>

        <p className="text-xs text-white/40">
          Didn&apos;t receive an email? Check your spam folder.
        </p>
      </CardContent>
    </Card>
  )
}
