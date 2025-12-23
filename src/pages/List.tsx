import React, { useEffect, useState } from 'react'
import { signOutUser, onAuthChanged } from '../firebase/auth'
import { useNavigate, Link } from 'react-router-dom'
import type { Note } from '../types/note'
import { fetchAllNotes, createNote, updateNote, deleteNote } from '../lib/api'
import NoteModal from '../components/NoteModal'

const LOCAL_KEY = 'notes'

const ListPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Note | null>(null)
  const [mode, setMode] = useState<'view'|'edit'|'delete'>('view')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (user) => {
      if (!user) {
        navigate('/login')
        return
      }
      try {
        const remote = await fetchAllNotes(user.uid)
        setNotes(remote)
      } catch (e) {
        console.error(e)
        loadLocal()
      }
    })
    return () => unsubscribe()
  }, [])

  function loadLocal() {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setNotes(parsed)
      } catch (e) {
        setNotes([])
      }
    }
  }

  const handleSignOut = async () => {
    await signOutUser()
    localStorage.removeItem(LOCAL_KEY)
    navigate('/login')
  }

  const handleCreate = async (data: Partial<Note>) => {
    if (!data.Title || !data.Question || !data.Answer) {
      alert('必須項目を入力してください')
      return
    }
    // Date/MissCount/uid は呼び出し元で整形する想定
    try {
      await createNote(data as Note)
      alert('登録しました')
      setShowForm(false)
      // 再取得
      const rawUser = (window as any).firebaseCurrentUser
      if (rawUser?.uid) {
        const res = await fetchAllNotes(rawUser.uid)
        setNotes(res)
      }
    } catch (e: any) {
      console.error(e)
      if (e?.code === 409) {
        alert('タイトルがすでに存在します。変更してください')
      } else {
        alert('登録に失敗しました')
      }
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h2>問題一覧</h2>
        <div>
          <Link to="/random">ランダム問題</Link>
          <button onClick={() => setShowForm(true)}>新規登録</button>
          <button onClick={handleSignOut}>ログアウト</button>
        </div>
      </header>

      <main>
        {showForm && (
          <div className="card">
            <h3>新規登録（簡易）</h3>
            <NoteForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {notes.length === 0 ? (
          <p>データがありません。登録してください</p>
        ) : (
          <table className="notes-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Miss</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id ?? n.Title} onClick={() => { setSelected(n); setMode('view') }} className="clickable-row">
                  <td>{n.Title}</td>
                  <td>{n.Date}</td>
                  <td>{n.MissCount}</td>
                  <td>
                    <button onClick={(e) => { e.stopPropagation(); setSelected(n); setMode('edit') }}>編集</button>
                    <button onClick={(e) => { e.stopPropagation(); setSelected(n); setMode('delete') }}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selected && (
          <NoteModal
            mode={mode}
            note={selected}
            onClose={() => setSelected(null)}
            onSaved={async () => {
              // 再取得
              const u = (window as any).firebaseCurrentUser
              if (u?.uid) {
                const res = await fetchAllNotes(u.uid)
                setNotes(res)
              }
            }}
            onDeleted={async () => {
              const u = (window as any).firebaseCurrentUser
              if (u?.uid) {
                const res = await fetchAllNotes(u.uid)
                setNotes(res)
              }
            }}
          />
        )}
      </main>
    </div>
  )
}

function NoteForm({ onSave, onCancel }: { onSave: (d: Partial<Note>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [explain, setExplain] = useState('')

  const handleSubmit = () => {
    // シンプルな検証
    if (!title || !question || !answer) {
      alert('必須項目を入力してください')
      return
    }
    const now = new Date().toISOString()
    const uid = (window as any).firebaseCurrentUser?.uid || ''
    onSave({ Title: title, Question: question, Answer: answer, Explain: explain, Date: now, MissCount: 0, uid })
  }

  return (
    <div>
      <div>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} />
      </div>
      <div>
        <label>Question</label>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={999} />
      </div>
      <div>
        <label>Answer</label>
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={999} />
      </div>
      <div>
        <label>Explain (任意)</label>
        <textarea value={explain} onChange={(e) => setExplain(e.target.value)} maxLength={999} />
      </div>
      <div className="actions">
        <button onClick={handleSubmit}>登録</button>
        <button onClick={onCancel}>キャンセル</button>
      </div>
    </div>
  )
}

export default ListPage
