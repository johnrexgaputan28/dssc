window.FirebaseConfig = {
  enabled: true,
  note: "Set enabled to true and paste your Firebase web app config from Project settings > Your apps.",
  config: {
    apiKey: "AIzaSyDXHGSLCAtK9DB0pqKuuXcjAPN8m93P-OQ",
    authDomain: "dssc-schedule-system.firebaseapp.com",
    projectId: "dssc-schedule-system",
    storageBucket: "dssc-schedule-system.firebasestorage.app",
    messagingSenderId: "448265991482",
    appId: "1:448265991482:web:d9b27de73662ed818dcc03",
    measurementId: "G-JKM1SG9QBH"
  }
};

window.FirebaseService = (() => {
  const sdkVersion = "12.7.0";
  const state = {
    ready: false,
    app: null,
    auth: null,
    db: null,
    modules: {}
  };

  function hasConfig() {
    const config = window.FirebaseConfig.config;
    return window.FirebaseConfig.enabled && config.apiKey && config.projectId && config.appId;
  }

  async function init() {
    if (!hasConfig()) return false;
    if (state.ready) return true;

    const appModule = await import(`https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-app.js`);
    const authModule = await import(`https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-auth.js`);
    const firestoreModule = await import(`https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-firestore.js`);

    state.modules = { appModule, authModule, firestoreModule };
    state.app = appModule.initializeApp(window.FirebaseConfig.config);
    state.auth = authModule.getAuth(state.app);
    state.db = firestoreModule.getFirestore(state.app);
    state.ready = true;
    return true;
  }

  async function signIn(email, password) {
    await init();
    const { signInWithEmailAndPassword } = state.modules.authModule;
    const credential = await signInWithEmailAndPassword(state.auth, email, password);
    return credential.user;
  }

  async function createAccount(email, password) {
    await init();
    const { createUserWithEmailAndPassword } = state.modules.authModule;
    const credential = await createUserWithEmailAndPassword(state.auth, email, password);
    return credential.user;
  }

  async function signOutUser() {
    if (!state.ready) return;
    const { signOut } = state.modules.authModule;
    await signOut(state.auth);
  }

  async function getUserProfile(uid) {
    await init();
    const { doc, getDoc } = state.modules.firestoreModule;
    const snapshot = await getDoc(doc(state.db, "users", uid));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  }

  async function getCollection(name) {
    await init();
    const { collection, getDocs } = state.modules.firestoreModule;
    const snapshot = await getDocs(collection(state.db, name));
    return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }));
  }

  async function loadAllData() {
    const [users, sections, schedules, announcements] = await Promise.all([
      getCollection("users"),
      getCollection("sections"),
      getCollection("schedules"),
      getCollection("announcements")
    ]);
    return { users, sections, schedules, announcements };
  }

  async function addDocument(collectionName, data) {
    await init();
    const { addDoc, collection, serverTimestamp } = state.modules.firestoreModule;
    const payload = { ...data, createdAt: data.createdAt || serverTimestamp() };
    const docRef = await addDoc(collection(state.db, collectionName), payload);
    return docRef.id;
  }

  async function setDocument(collectionName, id, data) {
    await init();
    const { doc, setDoc, serverTimestamp } = state.modules.firestoreModule;
    await setDoc(doc(state.db, collectionName, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  }

  async function updateDocument(collectionName, id, data) {
    await init();
    const { doc, updateDoc, serverTimestamp } = state.modules.firestoreModule;
    await updateDoc(doc(state.db, collectionName, id), { ...data, updatedAt: serverTimestamp() });
  }

  async function deleteDocument(collectionName, id) {
    await init();
    const { deleteDoc, doc } = state.modules.firestoreModule;
    await deleteDoc(doc(state.db, collectionName, id));
  }

  return {
    init,
    hasConfig,
    signIn,
    createAccount,
    signOutUser,
    getUserProfile,
    getCollection,
    loadAllData,
    addDocument,
    setDocument,
    updateDocument,
    deleteDocument
  };
})();
