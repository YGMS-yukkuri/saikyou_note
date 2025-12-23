import React from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../firebase/auth'

const Login: React.FC = () => {
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      await signInWithGoogle()
      navigate('/list')
    } catch (e) {
      alert('ログインに失敗しました')
    }
  }

  return (
    <div className="center-screen">
      <h1>最強のノート</h1>
      <button onClick={handleLogin}>Googleでログイン</button>
    </div>
  )
}

export default Login
