import {
  auth,
  db,
  signOut,
  onAuthStateChanged,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from './firebase-config.js';

let currentUser = null;
let notesData = [];
let currentModal = null;
let hasUnsavedChanges = false;

// エラー表示関数
function showError(message) {
  const errorContainer = document.getElementById('errorContainer');
  const errorToast = document.createElement('div');
  errorToast.className = 'error-toast';
  errorToast.textContent = message;
  errorContainer.appendChild(errorToast);

  setTimeout(() => {
    errorToast.remove();
  }, 5000);
}

// ローディング表示切り替え
function toggleLoading(show, text = 'データを同期中...') {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  loadingText.textContent = text;
  
  if (show) {
    loadingOverlay.classList.add('active');
  } else {
    loadingOverlay.classList.remove('active');
  }
}

// localStorageからデータを取得
function getLocalData() {
  const data = localStorage.getItem('notes');
  return data ? JSON.parse(data) : [];
}

// localStorageにデータを保存
function saveLocalData(data) {
  localStorage.setItem('notes', JSON.stringify(data));
}

// Firestoreからデータを取得
async function fetchDataFromFirestore(retryCount = 0) {
  if (!currentUser) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    toggleLoading(true, 'データを取得中...');
    
    const q = query(collection(db, 'notes'), where('uid', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    clearTimeout(timeoutId);
    
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });

    saveLocalData(data);
    toggleLoading(false);
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('データ取得エラー:', error);

    if (retryCount < 2) {
      toggleLoading(true, `通信環境が悪いため再試行中... (${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchDataFromFirestore(retryCount + 1);
    } else {
      toggleLoading(false);
      showError('ERR101: データの取得に失敗しました。ページを再読み込みしてください');
      return getLocalData();
    }
  }
}

// データをFirestoreに保存
async function saveToFirestore(data, retryCount = 0) {
  if (!currentUser) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    toggleLoading(true, 'データを保存中...');
    await addDoc(collection(db, 'notes'), {
      ...data,
      uid: currentUser.uid
    });
    
    clearTimeout(timeoutId);
    toggleLoading(false);
    return true;
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('データ保存エラー:', error);

    if (retryCount < 2) {
      toggleLoading(true, `通信環境が悪いため再試行中... (${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return saveToFirestore(data, retryCount + 1);
    } else {
      toggleLoading(false);
      showError('ERR102: データの保存に失敗しました。ページを再読み込みしてください');
      return false;
    }
  }
}

// データをFirestoreで更新
async function updateFirestore(id, data, retryCount = 0) {
  if (!currentUser) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    toggleLoading(true, 'データを更新中...');
    const docRef = doc(db, 'notes', id);
    await updateDoc(docRef, data);
    
    clearTimeout(timeoutId);
    toggleLoading(false);
    return true;
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('データ更新エラー:', error);

    if (retryCount < 2) {
      toggleLoading(true, `通信環境が悪いため再試行中... (${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return updateFirestore(id, data, retryCount + 1);
    } else {
      toggleLoading(false);
      showError('ERR103: データの更新に失敗しました。ページを再読み込みしてください');
      return false;
    }
  }
}

// データをFirestoreから削除
async function deleteFromFirestore(id, retryCount = 0) {
  if (!currentUser) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    toggleLoading(true, 'データを削除中...');
    const docRef = doc(db, 'notes', id);
    await deleteDoc(docRef);
    
    clearTimeout(timeoutId);
    toggleLoading(false);
    return true;
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('データ削除エラー:', error);

    if (retryCount < 2) {
      toggleLoading(true, `通信環境が悪いため再試行中... (${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return deleteFromFirestore(id, retryCount + 1);
    } else {
      toggleLoading(false);
      showError('ERR104: データの削除に失敗しました。ページを再読み込みしてください');
      return false;
    }
  }
}

// データを並び替え
function sortData(data, sortType) {
  const sortedData = [...data];
  
  switch (sortType) {
    case 'date':
      sortedData.sort((a, b) => new Date(b.Date) - new Date(a.Date));
      break;
    case 'title':
      sortedData.sort((a, b) => a.Title.localeCompare(b.Title));
      break;
    case 'missCount':
      sortedData.sort((a, b) => b.MissCount - a.MissCount);
      break;
  }
  
  return sortedData;
}

// テーブルを更新
function updateTable() {
  const tableBody = document.getElementById('tableBody');
  const sortType = document.getElementById('sortSelect').value;
  const sortedData = sortData(notesData, sortType);
  
  tableBody.innerHTML = '';
  
  if (sortedData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">データがありません</td></tr>';
    return;
  }
  
  sortedData.forEach((note) => {
    const row = document.createElement('tr');
    
    const titleCell = document.createElement('td');
    titleCell.className = 'title-cell';
    titleCell.textContent = note.Title;
    titleCell.addEventListener('click', () => showDetailModal(note));
    
    const dateCell = document.createElement('td');
    const date = new Date(note.Date);
    dateCell.textContent = date.toLocaleString('ja-JP');
    
    const missCell = document.createElement('td');
    missCell.textContent = note.MissCount;
    
    const actionCell = document.createElement('td');
    const actionBtn = document.createElement('button');
    actionBtn.className = 'action-btn';
    actionBtn.textContent = '編集/削除';
    actionBtn.addEventListener('click', () => showEditModal(note));
    actionCell.appendChild(actionBtn);
    
    row.appendChild(titleCell);
    row.appendChild(dateCell);
    row.appendChild(missCell);
    row.appendChild(actionCell);
    
    tableBody.appendChild(row);
  });
}

// XSS対策: HTMLエスケープ
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 安全にテキストを設定
function setTextSafely(element, text) {
  element.textContent = text || '';
}

// モーダルを閉じる
function closeModal() {
  if (hasUnsavedChanges) {
    if (!confirm('変更が保存されていません。破棄してもよろしいですか?')) {
      return;
    }
  }
  
  const modalOverlay = document.getElementById('modalOverlay');
  modalOverlay.classList.remove('active');
  currentModal = null;
  hasUnsavedChanges = false;
}

// 詳細表示モーダル
function showDetailModal(note) {
  currentModal = 'detail';
  hasUnsavedChanges = false;
  
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  
  modalTitle.textContent = '問題詳細';
  
  modalContent.innerHTML = `
    <div class="detail-section">
      <h3>タイトル</h3>
      <div class="detail-content" id="detailTitle"></div>
    </div>
    <div class="detail-section">
      <h3>問題</h3>
      <div class="detail-content" id="detailQuestion"></div>
    </div>
    <div class="detail-section">
      <h3>解答</h3>
      <div class="detail-content" id="detailAnswer"></div>
    </div>
    <div class="detail-section">
      <h3>解説</h3>
      <div class="detail-content" id="detailExplain"></div>
    </div>
    <div class="detail-info">
      <span>登録日時: <span id="detailDate"></span></span>
      <span>ミス回数: <span id="detailMissCount"></span></span>
    </div>
    <div class="modal-buttons">
      <button class="btn-secondary" id="closeDetailBtn">閉じる</button>
    </div>
  `;
  
  // 安全にデータを設定
  setTextSafely(document.getElementById('detailTitle'), note.Title);
  setTextSafely(document.getElementById('detailQuestion'), note.Question);
  setTextSafely(document.getElementById('detailAnswer'), note.Answer);
  setTextSafely(document.getElementById('detailExplain'), note.Explain || '(解説なし)');
  setTextSafely(document.getElementById('detailDate'), new Date(note.Date).toLocaleString('ja-JP'));
  setTextSafely(document.getElementById('detailMissCount'), note.MissCount.toString());
  
  document.getElementById('closeDetailBtn').addEventListener('click', closeModal);
  
  const modalOverlay = document.getElementById('modalOverlay');
  modalOverlay.classList.add('active');
}

// 新規登録モーダル
function showAddModal() {
  currentModal = 'add';
  hasUnsavedChanges = false;
  
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  
  modalTitle.textContent = '新規登録';
  
  modalContent.innerHTML = `
    <div class="form-group">
      <label for="inputTitle">タイトル <span style="color: red;">*</span></label>
      <input type="text" id="inputTitle" maxlength="50" required>
      <small>最大50文字</small>
      <div class="error-message" id="titleError"></div>
    </div>
    <div class="form-group">
      <label for="inputQuestion">問題 <span style="color: red;">*</span></label>
      <textarea id="inputQuestion" maxlength="999" required></textarea>
      <small>最大999文字</small>
      <div class="error-message" id="questionError"></div>
    </div>
    <div class="form-group">
      <label for="inputAnswer">解答 <span style="color: red;">*</span></label>
      <textarea id="inputAnswer" maxlength="999" required></textarea>
      <small>最大999文字</small>
      <div class="error-message" id="answerError"></div>
    </div>
    <div class="form-group">
      <label for="inputExplain">解説 (任意)</label>
      <textarea id="inputExplain" maxlength="999"></textarea>
      <small>最大999文字</small>
    </div>
    <div class="modal-buttons">
      <button class="btn-secondary" id="cancelBtn">キャンセル</button>
      <button class="btn-primary" id="saveBtn">登録</button>
    </div>
  `;
  
  // 入力監視
  ['inputTitle', 'inputQuestion', 'inputAnswer', 'inputExplain'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      hasUnsavedChanges = true;
    });
  });
  
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('saveBtn').addEventListener('click', handleAdd);
  
  // Enterキーでの送信
  document.getElementById('modal').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  });
  
  const modalOverlay = document.getElementById('modalOverlay');
  modalOverlay.classList.add('active');
}

// 新規登録処理
async function handleAdd() {
  const title = document.getElementById('inputTitle').value.trim();
  const question = document.getElementById('inputQuestion').value.trim();
  const answer = document.getElementById('inputAnswer').value.trim();
  const explain = document.getElementById('inputExplain').value.trim();
  
  // バリデーション
  let hasError = false;
  
  if (!title) {
    document.getElementById('titleError').textContent = 'タイトルは必須です';
    document.getElementById('inputTitle').classList.add('error-input');
    hasError = true;
  } else {
    document.getElementById('titleError').textContent = '';
    document.getElementById('inputTitle').classList.remove('error-input');
    
    // タイトル重複チェック
    if (notesData.some(note => note.Title === title)) {
      document.getElementById('titleError').textContent = '既に存在するタイトルです';
      document.getElementById('inputTitle').classList.add('error-input');
      hasError = true;
    }
  }
  
  if (!question) {
    document.getElementById('questionError').textContent = '問題は必須です';
    document.getElementById('inputQuestion').classList.add('error-input');
    hasError = true;
  } else {
    document.getElementById('questionError').textContent = '';
    document.getElementById('inputQuestion').classList.remove('error-input');
  }
  
  if (!answer) {
    document.getElementById('answerError').textContent = '解答は必須です';
    document.getElementById('inputAnswer').classList.add('error-input');
    hasError = true;
  } else {
    document.getElementById('answerError').textContent = '';
    document.getElementById('inputAnswer').classList.remove('error-input');
  }
  
  if (hasError) {
    showError('ERR201: 入力内容に誤りがあります');
    return;
  }
  
  // データ作成
  const newData = {
    Title: title,
    Question: question,
    Answer: answer,
    Explain: explain,
    Date: new Date().toISOString(),
    MissCount: 0
  };
  
  // Firestoreに保存
  const success = await saveToFirestore(newData);
  
  if (success) {
    // ローカルデータを再取得
    notesData = await fetchDataFromFirestore();
    updateTable();
    hasUnsavedChanges = false;
    closeModal();
  }
}

// 編集モーダル
function showEditModal(note) {
  currentModal = 'edit';
  hasUnsavedChanges = false;
  
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  
  modalTitle.textContent = '編集';
  
  modalContent.innerHTML = `
    <div class="form-group">
      <label for="inputTitle">タイトル <span style="color: red;">*</span></label>
      <input type="text" id="inputTitle" maxlength="50" required>
      <small>最大50文字</small>
      <div class="error-message" id="titleError"></div>
    </div>
    <div class="form-group">
      <label for="inputQuestion">問題 <span style="color: red;">*</span></label>
      <textarea id="inputQuestion" maxlength="999" required></textarea>
      <small>最大999文字</small>
      <div class="error-message" id="questionError"></div>
    </div>
    <div class="form-group">
      <label for="inputAnswer">解答 <span style="color: red;">*</span></label>
      <textarea id="inputAnswer" maxlength="999" required></textarea>
      <small>最大999文字</small>
      <div class="error-message" id="answerError"></div>
    </div>
    <div class="form-group">
      <label for="inputExplain">解説 (任意)</label>
      <textarea id="inputExplain" maxlength="999"></textarea>
      <small>最大999文字</small>
    </div>
    <div class="modal-buttons">
      <button class="btn-danger" id="deleteBtn">データを削除...</button>
      <button class="btn-secondary" id="cancelBtn">キャンセル</button>
      <button class="btn-primary" id="saveBtn">保存</button>
    </div>
  `;
  
  // 既存データを設定
  document.getElementById('inputTitle').value = note.Title;
  document.getElementById('inputQuestion').value = note.Question;
  document.getElementById('inputAnswer').value = note.Answer;
  document.getElementById('inputExplain').value = note.Explain || '';
  
  // 入力監視
  ['inputTitle', 'inputQuestion', 'inputAnswer', 'inputExplain'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      hasUnsavedChanges = true;
    });
  });
  
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('saveBtn').addEventListener('click', () => handleEdit(note));
  document.getElementById('deleteBtn').addEventListener('click', () => showDeleteModal(note));
  
  // Enterキーでの送信
  document.getElementById('modal').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit(note);
    }
  });
  
  const modalOverlay = document.getElementById('modalOverlay');
  modalOverlay.classList.add('active');
}

// 編集処理
async function handleEdit(originalNote) {
  const title = document.getElementById('inputTitle').value.trim();
  const question = document.getElementById('inputQuestion').value.trim();
  const answer = document.getElementById('inputAnswer').value.trim();
  const explain = document.getElementById('inputExplain').value.trim();
  
  // バリデーション
  let hasError = false;
  
  if (!title) {
    document.getElementById('titleError').textContent = 'タイトルは必須です';
    document.getElementById('inputTitle').classList.add('error-input');
    hasError = true;
  } else {
    document.getElementById('titleError').textContent = '';
    document.getElementById('inputTitle').classList.remove('error-input');
    
    // タイトル重複チェック (自分以外)
    if (title !== originalNote.Title && notesData.some(note => note.Title === title)) {
      document.getElementById('titleError').textContent = '既に存在するタイトルです';
      document.getElementById('inputTitle').classList.add('error-input');
      hasError = true;
    }
  }
  
  if (!question) {
    document.getElementById('questionError').textContent = '問題は必須です';
    document.getElementById('inputQuestion').classList.add('error-input');
    hasError = true;
  } else {
    document.getElementById('questionError').textContent = '';
    document.getElementById('inputQuestion').classList.remove('error-input');
  }
  
  if (!answer) {
    document.getElementById('answerError').textContent = '解答は必須です';
    document.getElementById('inputAnswer').classList.add('error-input');
    hasError = true;
  } else {
    document.getElementById('answerError').textContent = '';
    document.getElementById('inputAnswer').classList.remove('error-input');
  }
  
  if (hasError) {
    showError('ERR201: 入力内容に誤りがあります');
    return;
  }
  
  // 更新データ
  const updateData = {
    Title: title,
    Question: question,
    Answer: answer,
    Explain: explain
  };
  
  // Firestoreに保存
  const success = await updateFirestore(originalNote.id, updateData);
  
  if (success) {
    // ローカルデータを再取得
    notesData = await fetchDataFromFirestore();
    updateTable();
    hasUnsavedChanges = false;
    closeModal();
  }
}

// 削除モーダル
function showDeleteModal(note) {
  hasUnsavedChanges = false;
  
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  
  modalTitle.textContent = '削除確認';
  
  modalContent.innerHTML = `
    <p style="margin-bottom: 20px;">以下のデータを削除しますか？</p>
    <div class="detail-section">
      <h3>タイトル</h3>
      <div class="detail-content" id="deleteTitle"></div>
    </div>
    <p style="margin: 20px 0 10px;">削除を確定するには、タイトルを入力してください:</p>
    <div class="form-group">
      <input type="text" id="confirmTitle" placeholder="タイトルを入力">
      <div class="error-message" id="confirmError"></div>
    </div>
    <div class="modal-buttons">
      <button class="btn-secondary" id="cancelDeleteBtn">キャンセル</button>
      <button class="btn-danger" id="confirmDeleteBtn">削除を確定</button>
    </div>
  `;
  
  setTextSafely(document.getElementById('deleteTitle'), note.Title);
  
  document.getElementById('cancelDeleteBtn').addEventListener('click', () => showEditModal(note));
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => handleDelete(note));
  
  // Enterキーでの削除
  document.getElementById('modal').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDelete(note);
    }
  });
}

// 削除処理
async function handleDelete(note) {
  const confirmTitle = document.getElementById('confirmTitle').value.trim();
  
  if (confirmTitle !== note.Title) {
    document.getElementById('confirmError').textContent = 'タイトルが一致しません';
    document.getElementById('confirmTitle').classList.add('error-input');
    showError('ERR202: タイトルが一致しません');
    return;
  }
  
  // Firestoreから削除
  const success = await deleteFromFirestore(note.id);
  
  if (success) {
    // ローカルデータを再取得
    notesData = await fetchDataFromFirestore();
    updateTable();
    closeModal();
  }
}

// ログアウト処理
async function handleLogout() {
  try {
    await signOut(auth);
    // localStorageをクリア
    localStorage.removeItem('notes');
    window.location.href = 'login.html';
  } catch (error) {
    console.error('ログアウトエラー:', error);
    showError('ERR301: ログアウトに失敗しました');
  }
}

// ランダム問題画面に遷移
function goToRandom() {
  if (notesData.length === 0) {
    showError('ERR401: 問題データがありません');
    return;
  }
  window.location.href = 'random.html';
}

// 初期化
async function init() {
  // 認証状態の確認
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      
      // localStorageからデータを取得
      notesData = getLocalData();
      
      // Firestoreからデータを取得して同期
      notesData = await fetchDataFromFirestore();
      
      updateTable();
    } else {
      // 未ログインの場合はログイン画面に遷移
      window.location.href = 'login.html';
    }
  });
  
  // イベントリスナー
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('addBtn').addEventListener('click', showAddModal);
  document.getElementById('randomBtn').addEventListener('click', goToRandom);
  document.getElementById('sortSelect').addEventListener('change', updateTable);
  
  // モーダルオーバーレイクリックで閉じる
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') {
      closeModal();
    }
  });
  
  // Escキーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentModal) {
      closeModal();
    }
  });
}

init();
