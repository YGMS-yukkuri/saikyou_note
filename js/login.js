import { 
  auth, 
  signInWithPopup, 
  googleProvider, 
  onAuthStateChanged 
} from './firebase-config.js';

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
function toggleLoading(show) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (show) {
    loadingOverlay.classList.add('active');
  } else {
    loadingOverlay.classList.remove('active');
  }
}

// ログイン処理
async function handleLogin() {
  toggleLoading(true);
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // ログイン成功、一覧画面に遷移
    window.location.href = 'list.html';
  } catch (error) {
    toggleLoading(false);
    console.error('ログインエラー:', error);
    
    let errorMessage = 'ERR001: ログインに失敗しました';
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        errorMessage = 'ERR002: ログインがキャンセルされました';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'ERR003: ネットワークエラーが発生しました';
        break;
      case 'auth/unauthorized-domain':
        errorMessage = 'ERR004: このドメインは認証されていません';
        break;
    }
    
    showError(errorMessage);
  }
}

// 認証状態の監視
onAuthStateChanged(auth, (user) => {
  if (user) {
    // すでにログインしている場合は一覧画面に遷移
    window.location.href = 'list.html';
  }
});

// ログインボタンのイベントリスナー
document.getElementById('loginBtn').addEventListener('click', handleLogin);
