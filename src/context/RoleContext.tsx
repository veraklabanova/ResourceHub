import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Role, User } from '../data/types'
import { users } from '../data/seedData'

interface RoleContextValue {
  role: Role
  setRole: (role: Role) => void
  currentUser: User
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('end_user')

  const currentUser = role === 'admin'
    ? users.find((u) => u.role === 'admin')!
    : users.find((u) => u.role === 'end_user')!

  return (
    <RoleContext.Provider value={{ role, setRole, currentUser }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
