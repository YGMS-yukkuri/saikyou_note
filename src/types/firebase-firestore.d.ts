// 型定義が検出できない環境向けの簡易宣言
declare module 'firebase/firestore' {
  export const collection: any
  export const query: any
  export const where: any
  export const getDocs: any
  export const addDoc: any
  export const updateDoc: any
  export const deleteDoc: any
  export const doc: any
  export const increment: any
  const _default: any
  export default _default
}
