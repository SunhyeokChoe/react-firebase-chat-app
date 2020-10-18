import React, { useState, useRef } from 'react';
import logo from './logo.svg';
import './App.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

firebase.initializeApp(
  {
    apiKey: "AIzaSyAkB_zrbh3bk14vzOLEZmj4JahO7VsbNA0",
    authDomain: "superchat-2a70d.firebaseapp.com",
    databaseURL: "https://superchat-2a70d.firebaseio.com",
    projectId: "superchat-2a70d",
    storageBucket: "superchat-2a70d.appspot.com",
    messagingSenderId: "87445108397",
    appId: "1:87445108397:web:f0291ffa80926605dcb824",
    measurementId: "G-72FW9Q37HB"
  }
);

const auth = firebase.auth();
const firestore = firebase.firestore();
const analytics = firebase.analytics();

function App() {
  // ? signed in 일 경우  : user === object
  // ? signed out 일 경우 : user === null
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>⚛️🔥💬</h1>
        <SignOut />
      </header>

      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>

    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      <p>Do not violate the community guidelines or you will be banned for life!</p>
    </>
  );
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  );
}

function ChatRoom() {
  // ? 메세지 입력 후 submit 시 스크롤을 최하단으로 내리기 위한 dummy div 태그의 reference
  const dummyForScrollToBottom = useRef();

  // ? firestore collection을 참조
  const messagesRef = firebase.collection('messages');

  // ? collection 내 document를 쿼리 (최대 25개)
  const query = messagesRef.orderBy('createAt').limit(25);

  // ? 쿼리 결과를 hook으로 연결 (실시간 DB 쿼리 hook)
  const [messages] = useCollectionData(query, { idField: 'id' });

  const [formValue, setFormValue] = useState('');

  // ? firestore에 메시지 전송
  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    // ? firestore 내에 새로운 document 생성
    await messagesRef.add(
      {
        text: formValue,
        createAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
        photoURL,
      }
    );

    // ? 새로운 document 생성 완료 후 formValue를 ''로 초기화
    setFormValue('');

    // ? 스크롤을 최하단으로 이동
    dummyForScrollToBottom.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <main>
        {
          messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        }

        <span ref={dummyForScrollToBottom}></span>
      </main>

      <form onSubmit={sendMessage}>

        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="say something nice" />

        <button type="submit" disabled={!formValue}>Send</button>

      </form>
    </>
  )
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;

  // ? Conditional CSS
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
      <p>{text}</p>
    </div>
  )
}

export default App;
