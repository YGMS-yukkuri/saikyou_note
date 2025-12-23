import React, { useEffect, useState } from 'react'

const NetworkStatus: React.FC = () => {
  const [status, setStatus] = useState<'idle'|'retrying'|'failed'>('idle')
  const [attempt, setAttempt] = useState<number | null>(null)

  useEffect(() => {
    function onStatus(e: any) {
      const s = e.detail?.state
      if (s === 'start') setStatus('retrying')
      if (s === 'ok') setStatus('idle')
      if (s === 'failed') setStatus('failed')
    }
    function onAttempt(e: any) {
      setAttempt(e.detail?.attempt)
    }
    window.addEventListener('api:retry-status', onStatus as any)
    window.addEventListener('api:retry-attempt', onAttempt as any)
    return () => {
      window.removeEventListener('api:retry-status', onStatus as any)
      window.removeEventListener('api:retry-attempt', onAttempt as any)
    }
  }, [])

  if (status === 'idle') return null

  return (
    <div className={`network-banner ${status}`}>
      {status === 'retrying' && <div>接続を試行しています… (試行回数: {attempt ?? 0})</div>}
      {status === 'failed' && <div>通信に失敗しました。ページをリロードしてください。</div>}
    </div>
  )
}

export default NetworkStatus
