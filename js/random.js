import {
  auth,
  db,
  signOut,
  onAuthStateChanged,
  updateDoc,
  doc
} from './firebase-config.js';

let currentUser = null;
let notesData = [];
let currentQuestion = null;
let previousQuestion = null;
let askedQuestions = [];
let isAnswerShown = false;
let hasMarkedWrong = false;

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
function toggleLoading(show, text = 'データを読み込み中...') {
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

// 安全にテキストを設定
function setTextSafely(element, text) {
  element.textContent = text || '';
}

// ランダムに問題を選択
function selectRandomQuestion() {
  if (notesData.length === 0) {
    showError('ERR401: 問題データがありません');
    setTimeout(() => {
      window.location.href = 'list.html';
    }, 2000);
    return null;
  }
  
  // すべての問題を出題し終えた場合
  if (askedQuestions.length >= notesData.length) {
    alert('すべての問題を出題しました！一覧画面に戻ります。');
    window.location.href = 'list.html';
    return null;
  }
  
  // まだ出題していない問題のリストを作成
  const availableQuestions = notesData.filter(note => 
    !askedQuestions.includes(note.id) && 
    (!previousQuestion || note.id !== previousQuestion.id)
  );
  
  // もし前の問題を除外したら選択肢がなくなった場合は、前の問題も含める
  if (availableQuestions.length === 0 && askedQuestions.length < notesData.length) {
    const allAvailable = notesData.filter(note => !askedQuestions.includes(note.id));
    if (allAvailable.length > 0) {
      const randomIndex = Math.floor(Math.random() * allAvailable.length);
      return allAvailable[randomIndex];
    }
  }
  
  if (availableQuestions.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
}

// 問題を表示
function displayQuestion(question) {
  if (!question) return;
  
  currentQuestion = question;
  isAnswerShown = false;
  hasMarkedWrong = false;
  
  // 問題を出題済みリストに追加
  if (!askedQuestions.includes(question.id)) {
    askedQuestions.push(question.id);
  }
  
  // 安全にデータを設定
  setTextSafely(document.getElementById('questionTitle'), question.Title);
  setTextSafely(document.getElementById('questionText'), question.Question);
  
  // 入力欄をリセット
  document.getElementById('answerInput').value = '';
  
  // 回答セクションを非表示
  document.getElementById('answerSection').style.display = 'none';
  document.getElementById('inputSection').style.display = 'block';
  
  // 間違いマークボタンを無効化
  const markWrongBtn = document.getElementById('markWrongBtn');
  markWrongBtn.disabled = true;
  markWrongBtn.style.backgroundColor = 'var(--disabled-color)';
}

// 回答を表示
function showAnswer() {
  if (!currentQuestion) return;
  
  isAnswerShown = true;
  
  // 安全にデータを設定
  setTextSafely(document.getElementById('answerText'), currentQuestion.Answer);
  
  if (currentQuestion.Explain) {
    setTextSafely(document.getElementById('explainText'), currentQuestion.Explain);
    document.getElementById('explainSection').style.display = 'block';
  } else {
    setTextSafely(document.getElementById('explainText'), '(解説なし)');
    document.getElementById('explainSection').style.display = 'block';
  }
  
  // 表示切り替え
  document.getElementById('inputSection').style.display = 'none';
  document.getElementById('answerSection').style.display = 'block';
  
  // 間違いマークボタンを有効化
  const markWrongBtn = document.getElementById('markWrongBtn');
  markWrongBtn.disabled = false;
  markWrongBtn.style.backgroundColor = 'var(--danger-color)';
}

// 間違いとしてマーク
async function markAsWrong(retryCount = 0) {
  if (!currentQuestion || hasMarkedWrong) return;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    toggleLoading(true, 'ミス回数を更新中...');
    
    const docRef = doc(db, 'notes', currentQuestion.id);
    await updateDoc(docRef, {
      MissCount: currentQuestion.MissCount + 1
    });
    
    clearTimeout(timeoutId);
    
    // ローカルデータも更新
    const localData = getLocalData();
    const index = localData.findIndex(note => note.id === currentQuestion.id);
    if (index !== -1) {
      localData[index].MissCount += 1;
      localStorage.setItem('notes', JSON.stringify(localData));
      notesData = localData;
      currentQuestion.MissCount += 1;
    }
    
    hasMarkedWrong = true;
    
    // ボタンを無効化
    const markWrongBtn = document.getElementById('markWrongBtn');
    markWrongBtn.disabled = true;
    markWrongBtn.style.backgroundColor = 'var(--disabled-color)';
    markWrongBtn.textContent = 'マーク済み';
    
    toggleLoading(false);
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('ミス回数更新エラー:', error);

    if (retryCount < 2) {
      toggleLoading(true, `通信環境が悪いため再試行中... (${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return markAsWrong(retryCount + 1);
    } else {
      toggleLoading(false);
      showError('ERR501: ミス回数の更新に失敗しました');
    }
  }
}

// 次の問題へ
function nextQuestion() {
  previousQuestion = currentQuestion;
  const nextQ = selectRandomQuestion();
  if (nextQ) {
    displayQuestion(nextQ);
  }
}

// 一覧に戻る
function backToList() {
  window.location.href = 'list.html';
}

// ログアウト処理
async function handleLogout() {
  try {
    await signOut(auth);
    localStorage.removeItem('notes');
    window.location.href = 'login.html';
  } catch (error) {
    console.error('ログアウトエラー:', error);
    showError('ERR301: ログアウトに失敗しました');
  }
}

// 初期化
async function init() {
  // 認証状態の確認
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      
      // localStorageからデータを取得
      notesData = getLocalData();
      
      if (notesData.length === 0) {
        showError('ERR401: 問題データがありません');
        setTimeout(() => {
          window.location.href = 'list.html';
        }, 2000);
        return;
      }
      
      // 最初の問題を表示
      const firstQuestion = selectRandomQuestion();
      if (firstQuestion) {
        displayQuestion(firstQuestion);
      }
      
    } else {
      // 未ログインの場合はログイン画面に遷移
      window.location.href = 'login.html';
    }
  });
  
  // イベントリスナー
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('showAnswerBtn').addEventListener('click', showAnswer);
  document.getElementById('markWrongBtn').addEventListener('click', markAsWrong);
  document.getElementById('nextBtn').addEventListener('click', nextQuestion);
  document.getElementById('backToListBtn').addEventListener('click', backToList);
}

// ページ読み込み時に初期化
init();
