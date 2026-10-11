import { Navigate, useLocation } from 'react-router-dom'

export function Timeline() {
  const { hash } = useLocation()
  return <Navigate to={{ pathname: '/', hash: hash.replace(/^#/, '') }} replace />
}
