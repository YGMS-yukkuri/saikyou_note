import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import type { Note } from '../types/note'
import { updateNote, deleteNote } from '../lib/api'

type Props = {
  mode: 'view' | 'edit' | 'delete'
  note: Note
  onClose: () => void
  onSaved?: () => void
  onDeleted?: () => void
}

const NoteModal: React.FC<Props> = ({ mode: initialMode, note, onClose, onSaved, onDeleted }) => {
  const [mode, setMode] = useState(initialMode)
  const [title, setTitle] = useState(note.Title)
  const [question, setQuestion] = useState(note.Question)
  const [answer, setAnswer] = useState(note.Answer)
  const [explain, setExplain] = useState(note.Explain || '')
  const [confirmTitle, setConfirmTitle] = useState('')
  const [dirty, setDirty] = useState(false)
  
  useEffect(() => {
    setTitle(note.Title)
    setQuestion(note.Question)
    setAnswer(note.Answer)
    setExplain(note.Explain || '')
  }, [note])

  function closeWithCheck() {
    if (dirty && !confirm('変更が破棄されます。よろしいですか？')) return
    onClose()
  }

  async function handleSave() {
    if (!title || !question || !answer) {
      alert('必須項目を入力してください')
      return
    }
    if (!note.id) {
      alert('内部エラー: note id がありません')
      return
    }
    try {
      await updateNote(note.id, { Title: title, Question: question, Answer: answer, Explain: explain })
      onSaved && onSaved()
      onClose()
    } catch (e: any) {
      if (e?.code === 409) alert('タイトルが重複しています')
      else alert('保存に失敗しました')
    }
  }

  async function handleDelete() {
    if (confirmTitle !== note.Title) {
      alert('タイトルが一致しません')
      return
    }
    if (!note.id) return
    try {
      await deleteNote(note.id)
      onDeleted && onDeleted()
      onClose()
    } catch (e) {
      console.error(e)
      alert('削除に失敗しました')
    }
  }

  return (
    <Modal onClose={closeWithCheck}>
      <div className="note-modal">
        <div className="note-modal-header">
          <h3>{mode === 'view' ? '詳細' : mode === 'edit' ? '編集' : '削除'}</h3>
          <button className="close" onClick={closeWithCheck}>✕</button>
        </div>

        {mode === 'view' && (
          <div>
            <p><strong>Title</strong>: {note.Title}</p>
            <p><strong>Question</strong>: {note.Question}</p>
            <p><strong>Answer</strong>: {note.Answer}</p>
            {note.Explain && <p><strong>Explain</strong>: {note.Explain}</p>}
            <div className="actions">
              <button onClick={() => setMode('edit')}>編集</button>
              <button onClick={() => setMode('delete')}>削除</button>
            </div>
          </div>
        )}

        {mode === 'edit' && (
          <div>
            <label>Title</label>
            <input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true) }} maxLength={50} />
            <label>Question</label>
            <textarea value={question} onChange={(e) => { setQuestion(e.target.value); setDirty(true) }} maxLength={999} />
            <label>Answer</label>
            <textarea value={answer} onChange={(e) => { setAnswer(e.target.value); setDirty(true) }} maxLength={999} />
            <label>Explain (任意)</label>
            <textarea value={explain} onChange={(e) => { setExplain(e.target.value); setDirty(true) }} maxLength={999} />
            <div className="actions">
              <button onClick={handleSave}>保存</button>
              <button onClick={closeWithCheck}>キャンセル</button>
            </div>
          </div>
        )}

        {mode === 'delete' && (
          <div>
            <p>データを削除しますか？削除する場合はタイトルを入力して確定してください。</p>
            <p><em>対象: {note.Title}</em></p>
            <input placeholder="タイトルを入力" value={confirmTitle} onChange={(e) => setConfirmTitle(e.target.value)} />
            <div className="actions">
              <button onClick={handleDelete}>削除を確定</button>
              <button onClick={() => setMode('view')}>キャンセル</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default NoteModal
