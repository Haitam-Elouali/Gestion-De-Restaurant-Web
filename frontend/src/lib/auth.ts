import { User } from '../types'

export const fetchAuthStatus = async (): Promise<User> => {
  const response = await fetch('/api/auth/status/', { credentials: 'include' })
  return response.json()
}

export const logout = async () => {
  await fetch('/api/auth/logout/', {
    method: 'POST',
    credentials: 'include',
  })
}
