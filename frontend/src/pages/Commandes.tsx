import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Commandes: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/serveur', { replace: true })
  }, [navigate])

  return null
}

export default Commandes
