// Add this function to check admin status properly
const checkAdminStatus = async (email) => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', email));
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Update the useEffect to check admin status properly
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setUser(user);
      // Check admin status from Firestore
      const isAdminUser = await checkAdminStatus(user.email);
      setIsAdmin(isAdminUser);
      
      // Also check local storage for demo admin
      const localAdmin = localStorage.getItem('isAdmin');
      if (localAdmin === 'true' || user.email === 'admin@123') {
        setIsAdmin(true);
      }
    } else {
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('isAdmin');
    }
    setLoading(false);
  });
  return unsubscribe;
}, []);