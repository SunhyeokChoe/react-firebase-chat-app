# React와 Firebase(Auth, Firestore)를 활용한 소규모 채팅 앱

## Firebase 요금제
< Spark: 무료 >
- "데이터베이스, Firestore, 저장소, 함수, 전화 인증, 호스팅, Test Lab 사용 할당량" 무료

< Blaze: 종량제 >
- Spark에서 사용 가능한 기능 + GCP로 프로젝트 확장 가능
- 매달 무료 사용량 모두 소진 후 데이터 사용량 만큼 청구

## Firestore
확장성 높은 NoSQL 클라우드 데이터베이스 (Not Realtime Database)

< Collection >
- doument의 집합
- RDB의 테이블 구조와 유사
- 서로 상이한 구조를 갖는 document를 저장할 수 있음

< Document >
- field와 value를 갖는 JSON 형식의 데이터
- 내부에 또 다른 collection을 포함할 수 있음
- 최상위 Root에는 반드시 collection이 위치하며 children은 collection과 document가 서로를 포함할 수 있음

## Firebase Project 추가 및 설정
1. [Firebase 웹 페이지 접속](https://firebase.google.com/?hl=ko)
2. "시작하기" 클릭
3. "프로젝트 만들기" 클릭
4. 프로젝트 이름 입력 (이미 존재하는 프로젝트명일 경우 뒤에 ID가 부여됨)
5. 애널리틱스 사용 설정
6. 서비스 지역 설정 (주요 서비스 대상 국가를 지정하는 작업)
7. 좌측 사이드바의 "Authentication" 클릭
8. 상단 탭의 "Signed-in method" 클릭
9. "Google" 클릭
10. "사용 설정" 클릭
11. "저장" 클릭

## Cloud Firestore 추가
1. "생성된 프로젝트" 클릭
2. Cloud Firestore 추가
3. "데이터베이스 만들기" 클릭
4. Cloud Firestore 보안 규칙 설정 (테스트 모드로 설정해야 로컬에서 Firestore에 데이터 요청 가능)
5. Cloud Firestore 위치 설정 (서비스 지역과 동일하게 선택해야 함) (ex: 애널리틱스 위치를 대한민국으로 지정했을 경우 "asia-east2"로 설정)

## Cloud Firestore Root Collection & Empty Document 추가
1. 상단 탭의 "데이터" 클릭
2. "컬렉션 시작" 클릭
3. "컬렉션 ID"에 "messages" 입력
4. "문서 ID" 내 "자동 ID" 클릭 (collection을 처음 생성했을 때 document가 하나 이상 있어야 하므로 이를 추가하는 과정임)
5. "저장" 클릭

## Cloud Firestore 규칙 생성
1. 상단 탭의 "규칙" 클릭
2. 아래 자바스크립트로 된 Rule 코드 복사 & 붙여넣기
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
  
    match /{document=**} {
      allow read, write: if
          request.time < timestamp.date(2020, 11, 17);
    }
    
    match /messages/{docId} {
    	allow read: if request.auth.uid != null; // user가 로그인 상태 일 경우 read 허용
      allow create: if canCreateMessage();
    }
    
    // 바로 위 match 문에서 user가 로그인 상태 일 경우 아래 함수 수행
    function canCreateMessage() {
     	// 로그인 여부
    	let isSignedIn = request.auth.uid != null;
      
      // 생성하려고 하는 document의 uid와 요청 user의 uid가 일치하는지 여부
      let isOwner = request.auth.uid == request.resource.data.uid;
      
      // Ban 상태가 아닐 경우 
      let isNotBanned = exists(
      	/database/$(database)/documents/bannedList/$(request.auth.uid)
      ) == false;
      
      return isSignedIn && isOwner && isNotBanned;
    }
  }
}
```
3. "저장" 클릭

## 로컬 프로젝트 폴더에 Firebase dependency 폴더 추가 및 코드 입력
1. 콘솔창에 "npm i -g firebase-tools" 입력
2. "firebase login" 입력 후 로그인 (로컬 머신을 Firebase 서비스에 연결하여 엑세스 권환 취득)
3. "firebase init functions" 입력
4. "Please select an options" 단계에서 "Use an existing project" 선택
5. "Select a default Firebase project for this directory" 단계에서 Firebase 서비스에 올라가 있는 프로젝트 선택
6. "What language would you like to use to write Cloud Functions?" 단계에서 Javascript 선택 (기호에 따라)
7. "Do you want to use ESLint to catch probable bugs and enforce style?" 단계에서 No 선택 (기호에 따라)
8. "Do you want to install dependencies with npm now?" 단계에서 No 선택
9. /functions/index.js 스크립트 내 아래 코드 입력
```
const functions = require('firebase-functions');
const Filter = require('bad-words');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.detectEvilUsers = functions.firestore
    .document('messages/{msgId}')
    .onCreate(async (doc, ctx) => {

        const filter = new Filter();
        const { text, uid } = doc.data();

        if (filter.isProfane(text)) {
            const cleaned = filter.clean(text);
            await doc.ref.update({ text: `제가 감히 이런 상스러운 말씀을 올려 죄송합니다... 평생 입 닫겠습니다. 🤐\n[박제된 언어: ${cleaned}]` });

            await db.collection('bannedList').doc(uid).set({});
        }

        const userRef = db.collection('users').doc(uid)

        const userData = (await userRef.get()).data();

        if (userData.msgCount >= 7) {
            await db.collection('bannedList').doc(uid).set({});
        } else {
            await userRef.set({ msgCount: (userData.msgCount || 0) + 1 })
        }

    });
```

## Firebase 내 프로젝트에 deploy 하기
1. 콘솔창에 "firebase deploy --only functions" 입력


This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
