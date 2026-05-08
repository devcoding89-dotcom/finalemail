'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Lock } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully!')
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 rounded-full bg-indigo-500/10 p-5">
          <Lock className="h-12 w-12 text-indigo-400 mx-auto" />
        </div>
        <CardTitle className="text-white text-xl">Set new password</CardTitle>
        <CardDescription className="text-white/60">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">
              New Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white/80">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
