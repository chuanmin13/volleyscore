import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBi53rFLKd8KNBKTrjSTMtW7Ixy2EnLzEE",
  authDomain: "volleyscore-a34a6.firebaseapp.com",
  databaseURL: "https://volleyscore-a34a6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "volleyscore-a34a6",
  storageBucket: "volleyscore-a34a6.firebasestorage.app",
  messagingSenderId: "250437897234",
  appId: "1:250437897234:web:91b67af601b1d3cf0d5ccb",
  measurementId: "G-QQB7SKHZ6H"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
