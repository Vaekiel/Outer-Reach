// Compte Google (Firebase Authentication) et sauvegarde cloud (Firestore).
// Chargé uniquement si firebase-config.js contient de vraies clés (voir app.js).
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

let auth,db;

export function initFirebase(config){
 const app=initializeApp(config);
 auth=getAuth(app);
 db=getFirestore(app);
}

export function getDb(){return db;}

export function watchAuth(onUser){
 onAuthStateChanged(auth,onUser);
}

export function signInGoogle(){
 return signInWithPopup(auth,new GoogleAuthProvider());
}

export function signOutUser(){
 return signOut(auth);
}

export async function loadCloudSave(uid){
 const snap=await getDoc(doc(db,'saves',uid));
 return snap.exists()?snap.data():null;
}

export function saveCloudSave(uid,data){
 return setDoc(doc(db,'saves',uid),data);
}
