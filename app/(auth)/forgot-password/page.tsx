'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      toast.error(error.message)
    } else {
      setSubmitted(true)
      toast.success('Reset link sent!')
    }

    setLoading(false)
  }

  if (submitted) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4 rounded-full bg-indigo-500/10 p-5">
            <Mail className="h-12 w-12 text-indigo-400 mx-auto" />
          </div>
          <CardTitle className="text-white text-xl">Check your email</CardTitle>
          <CardDescription className="text-white/60">
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="w-full bg-white/10 border-white/10 text-white hover:bg-white/20">
              Back to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-white text-xl">Forgot password?</CardTitle>
        <CardDescription className="text-white/60">
          Enter your email to receive a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold"
            disabled={loading}
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
