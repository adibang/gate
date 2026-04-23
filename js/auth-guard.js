// js/auth-guard.js
import { auth, dbCloud } from './firebase-config.js';
import { doc, getDoc, query, collection, where, getDocs, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ========== KONFIGURASI AKSES HALAMAN ==========
const PAGE_ACCESS = {
  // Halaman yang hanya bisa diakses admin
  adminOnly: [
    'masterdata.html',
    'purchase.html',
    'purchase-list.html',
    'finance.html',
    'report.html',
    'setting.html',
    'sales-list.html',
    'relation.html'
  ],
  // Halaman yang bisa diakses kasir (dan admin)
  kasirAllowed: [
    'index.html',
    'sales.html',
    'inventory.html',
    'sales-returns.html'
  ]
};

// Item sidebar yang hanya muncul untuk admin
const ADMIN_ONLY_MENU_ITEMS = [
  'masterdata.html',
  'purchase.html',
  'finance.html',
  'inventory.html',
  'report.html',
  'setting.html',
  'relation.html'
];

// ========== STATE MANAGEMENT ==========
let currentUser = null;
let currentRole = null;
let authInitialized = false;

// Simpan state ke sessionStorage
function saveAuthState(user, role) {
  if (user) {
    sessionStorage.setItem('userEmail', user.email);
    sessionStorage.setItem('userDisplayName', user.displayName || '');
    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userUid', user.uid);
  } else {
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userDisplayName');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userUid');
  }
}

// Ambil state dari sessionStorage
function loadAuthState() {
  return {
    email: sessionStorage.getItem('userEmail'),
    displayName: sessionStorage.getItem('userDisplayName'),
    role: sessionStorage.getItem('userRole'),
    uid: sessionStorage.getItem('userUid')
  };
}

// ========== FETCH ROLE DARI FIRESTORE (DENGAN FALLBACK) ==========
async function fetchUserRole(user) {
  if (!user) return null;
  try {
    // 1. Coba langsung dengan UID
    const userDocRef = doc(dbCloud, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data().role;
    }

    // 2. Jika tidak ada, cari berdasarkan email (untuk user yang ditambahkan via user-manager)
    console.log(`User doc not found for UID ${user.uid}, searching by email: ${user.email}`);
    const usersCol = collection(dbCloud, "users");
    const q = query(usersCol, where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Ambil data dari dokumen pertama yang cocok
      const existingDoc = querySnapshot.docs[0];
      const userData = existingDoc.data();
      const role = userData.role || null;
      
      // (Opsional) Migrasi data ke UID yang benar agar pencarian berikutnya lebih cepat
      // Hanya lakukan jika ID dokumen bukan UID (misalnya mengandung '_' atau '@')
      if (existingDoc.id !== user.uid) {
        console.log(`Migrating user data from ${existingDoc.id} to UID ${user.uid}`);
        try {
          await setDoc(userDocRef, {
            email: user.email,
            name: userData.name || user.displayName || '',
            role: role,
            createdAt: userData.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
            pending: false
          });
          // Opsional: hapus dokumen lama? Tidak dihapus untuk keamanan.
          // await deleteDoc(existingDoc.ref);
        } catch (migrateError) {
          console.warn("Failed to migrate user doc, but role is still usable:", migrateError);
        }
      }
      
      return role;
    }

    console.warn(`No user document found for email: ${user.email}`);
    return null;
  } catch (error) {
    console.error("Gagal mengambil role:", error);
    return null;
  }
}

// ========== INISIALISASI AUTH ==========
export async function initAuth(callback) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        const role = await fetchUserRole(user);
        currentRole = role;
        saveAuthState(user, role);
      } else {
        currentUser = null;
        currentRole = null;
        saveAuthState(null, null);
      }
      authInitialized = true;
      
      if (callback) callback(user, currentRole);
      resolve({ user, role: currentRole });
    });
  });
}

// ========== ROUTE GUARD ==========
export function checkPageAccess() {
  const state = loadAuthState();
  const role = state.role;
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Jika tidak ada role, redirect ke index (login)
  if (!role) {
    console.warn('Tidak ada role, redirect ke index');
    if (currentPage !== 'index.html') {
      window.location.href = 'index.html';
    }
    return false;
  }
  
  // Cek akses
  const isAdmin = role === 'admin';
  const isKasir = role === 'kasir';
  
  if (isAdmin) {
    // Admin bisa akses semua
    return true;
  }
  
  if (isKasir) {
    // Kasir hanya bisa akses halaman tertentu
    if (PAGE_ACCESS.kasirAllowed.includes(currentPage)) {
      return true;
    } else {
      alert('Akses ditolak. Halaman ini hanya untuk admin.');
      window.location.href = 'sales.html';
      return false;
    }
  }
  
  // Role tidak dikenal
  alert('Role tidak valid.');
  window.location.href = 'index.html';
  return false;
}

// ========== FILTER SIDEBAR ==========
export function filterSidebarByRole() {
  const role = loadAuthState().role;
  if (role !== 'admin') {
    // Sembunyikan menu admin-only
    const allLinks = document.querySelectorAll('.sidebar-menu .menu-link, .sidebar-menu .nav-link');
    allLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const page = href.split('/').pop();
        if (ADMIN_ONLY_MENU_ITEMS.includes(page)) {
          const parentLi = link.closest('li');
          if (parentLi) parentLi.style.display = 'none';
        }
      }
    });
    
    // Sembunyikan juga submenu jika perlu
    const submenuItems = document.querySelectorAll('.submenu a');
    submenuItems.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const page = href.split('/').pop();
        if (ADMIN_ONLY_MENU_ITEMS.includes(page)) {
          const parentLi = link.closest('li');
          if (parentLi) parentLi.style.display = 'none';
        }
      }
    });
  }
  
  // Update info user di UI (opsional)
  updateUserInfoUI();
}

// ========== UPDATE UI DENGAN INFO USER ==========
export function updateUserInfoUI() {
  const state = loadAuthState();
  const userNameSpan = document.getElementById('userDisplayName');
  const userRoleSpan = document.getElementById('userRoleDisplay');
  
  if (userNameSpan && state.displayName) {
    userNameSpan.textContent = state.displayName;
  }
  if (userRoleSpan && state.role) {
    userRoleSpan.textContent = state.role === 'admin' ? 'Administrator' : 'Kasir';
  }
}

// ========== LOGOUT ==========
export async function logoutUser() {
  try {
    await auth.signOut();
    saveAuthState(null, null);
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// ========== GETTER UNTUK STATE ==========
export function getCurrentUser() {
  return currentUser;
}

export function getCurrentRole() {
  return currentRole || loadAuthState().role;
}

export function isAdmin() {
  return getCurrentRole() === 'admin';
}

export function isKasir() {
  return getCurrentRole() === 'kasir';
}

// ========== TUNGGU INISIALISASI ==========
export async function waitForAuth() {
  if (authInitialized) return { user: currentUser, role: currentRole };
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (authInitialized) {
        clearInterval(check);
        resolve({ user: currentUser, role: currentRole });
      }
    }, 100);
  });
}
