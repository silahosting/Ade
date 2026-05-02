'use client'

import { Menu, Bell } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import type { SessionUser } from '@/types'

interface NavbarProps {
  user: SessionUser
  onMenuClick: () => void
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  return (
    <header className="bg-card/50 backdrop-blur-xl border-b border-border p-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden sm:block">
          <h2 className="font-semibold text-lg">Selamat Datang!</h2>
          <p className="text-sm text-muted-foreground">{user.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
        
        <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/70 rounded-xl flex items-center justify-center font-semibold text-secondary-foreground shadow-lg">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
