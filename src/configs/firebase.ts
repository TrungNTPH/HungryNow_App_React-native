import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDOcGtVgdqMQUaPSo7Q10zOhcp3evYpPXI',
  authDomain: 'hungrynowuser.firebaseapp.com',
  projectId: 'hungrynowuser',
  storageBucket: 'hungrynowuser.appspot.com',
  messagingSenderId: '657868242549',
  appId: '1:657868242549:web:ca4f6305c746937c01c23c',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
