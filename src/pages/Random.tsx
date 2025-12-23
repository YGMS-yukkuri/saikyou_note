import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { Note } from '../types/note'

const LOCAL_KEY = 'notes'

const RandomPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [index, setIndex] = useState<number | null>(null)
  const [show, setShow] = useState(false)
  const [marked, setMarked] = useState(false)
  const [seen, setSeen] = useState<Set<number>>(new Set())
  const [allDone, setAllDone] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) setNotes(JSON.parse(raw))
    // Listen for changes to local cache in other tabs
    function onStorage(e: StorageEvent) {
      if (e.key === LOCAL_KEY) {
        const v = e.newValue
        if (v) setNotes(JSON.parse(v))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    // notes が変わったら一巡をリセット
    setSeen(new Set())
    setAllDone(false)
    setIndex(null)
    if (notes.length > 0) pickRandom()
  }, [notes])

  function pickRandom() {
    if (notes.length === 0) return
    // まだ見ていないインデックスを選ぶ
    const available: number[] = []
    for (let i = 0; i < notes.length; i++) if (!seen.has(i)) available.push(i)

    if (available.length === 0) {
      // 一巡完了
      setAllDone(true)
      setIndex(null)
      setShow(false)
      return
    }

    const next = available[Math.floor(Math.random() * available.length)]
    setIndex(next)
    setShow(false)
    setMarked(false)
    setSeen((s) => new Set(Array.from(s).concat([next])))
  }

  function handleShow() {
    setShow(true)
  }

  async function handleMark() {
    if (!item?.id) return
    setMarked(true)
    try {
      // Firestore へ MissCount を加算
      const { incMissCount } = await import('../lib/api')
      await incMissCount(item.id)
      // ローカルキャッシュも更新
      const raw = localStorage.getItem(LOCAL_KEY)
      if (raw) {
        const parsed: Note[] = JSON.parse(raw)
        const idx = parsed.findIndex((p) => p.id === item.id)
        if (idx >= 0) {
          parsed[idx].MissCount = (parsed[idx].MissCount || 0) + 1
          localStorage.setItem(LOCAL_KEY, JSON.stringify(parsed))
          setNotes(parsed)
        }
      }
    } catch (e) {
      console.error(e)
      alert('保存に失敗しました')
      setMarked(false)
    }
  }

  const item = index !== null ? notes[index] : null

  return (
    <div className="container">
      <header className="header">
        <h2>ランダム問題</h2>
        <div>
          <Link to="/list">一覧へ戻る</Link>
        </div>
      </header>

      <main>
        {item ? (
          <div className="card">
            <h3>{item.Title}</h3>
            <p>{item.Question}</p>

            {!show ? (
              <div>
                <input placeholder="回答を入力" />
                <button onClick={handleShow}>回答を表示</button>
              </div>
            ) : (
              <div>
                <p><strong>Answer:</strong> {item.Answer}</p>
                <p><strong>Explain:</strong> {item.Explain}</p>
              </div>
            )}

            <div className="actions">
              <button onClick={pickRandom}>次に進む</button>
              <button onClick={() => navigate('/list')}>トップに戻る</button>
              <button onClick={handleMark} disabled={marked}>{marked ? 'Marked' : '間違いとしてマーク'}</button>
            </div>
          </div>
        ) : allDone ? (
          <div className="card">
            <h3>全問を一巡しました 🎉</h3>
            <p>お疲れさまです。一覧に戻るか、もう一度挑戦してください。</p>
            <div className="actions">
              <button onClick={() => { setSeen(new Set()); setAllDone(false); pickRandom() }}>もう一度挑戦</button>
              <button onClick={() => navigate('/list')} className="secondary">一覧へ戻る</button>
            </div>
          </div>
        ) : (
          <p>問題が見つかりません。まずは一覧からデータを登録してください。</p>
        )}
      </main>
    </div>
  )
}

export default RandomPage
