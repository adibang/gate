// js/sidebar.js
import { isAdmin, isKasir, getCurrentRole, logoutUser } from './auth-guard.js';

// ========== KONFIGURASI MENU ==========
const MENU_CONFIG = [
  {
    title: 'Home',
    icon: 'home',
    href: 'index.html',
    roles: ['admin', 'kasir']
  },
  {
    title: 'Master Data',
    icon: 'package',
    roles: ['admin'],
    submenu: [
      { title: 'Tambah Produk', icon: 'plus-circle', href: 'masterdata.html', section: 'tambahProduk' },
      { title: 'Daftar Produk', icon: 'list', href: 'masterdata.html', section: 'daftarProduk' },
      { title: 'Tambah Kategori', icon: 'plus-circle', href: 'masterdata.html', section: 'tambahKategori' },
      { title: 'Daftar Kategori', icon: 'list', href: 'masterdata.html', section: 'daftarKategori' },
      { title: 'Tambah Satuan', icon: 'plus-circle', href: 'masterdata.html', section: 'tambahUnit' },
      { title: 'Daftar Satuan', icon: 'list', href: 'masterdata.html', section: 'daftarUnit' },
      { title: 'Tambah Gudang', icon: 'plus-circle', href: 'masterdata.html', section: 'tambahGudang' },
      { title: 'Daftar Gudang', icon: 'list', href: 'masterdata.html', section: 'daftarGudang' },
      { title: 'History Transfer', icon: 'clock', href: 'masterdata.html', section: 'historyTransfer' }
    ]
  },
  {
    title: 'Sales',
    icon: 'shopping-cart',
    roles: ['admin', 'kasir'],
    submenu: [
      { title: 'Transaksi', icon: 'shopping-cart', href: 'sales.html' },
      { title: 'Daftar Transaksi', icon: 'list', href: 'sales-list.html' }
    ]
  },
  {
    title: 'Purchase',
    icon: 'truck',
    roles: ['admin'],
    submenu: [
      { title: 'Pembelian', icon: 'shopping-cart', href: 'purchase.html' },
      { title: 'Daftar Pembelian', icon: 'list', href: 'purchase-list.html' }
    ]
  },
  {
    title: 'Finance',
    icon: 'dollar-sign',
    href: 'finance.html',
    roles: ['admin']
  },
  {
    title: 'Inventory',
    icon: 'layers',
    href: 'inventory.html',
    roles: ['admin']
  },
  {
    title: 'Relation',
    icon: 'users',
    roles: ['admin'],
    submenu: [
      { title: 'Tambah Customer', icon: 'plus-circle', href: 'relation.html', section: 'tambahCustomer' },
      { title: 'Daftar Customer', icon: 'list', href: 'relation.html', section: 'daftarCustomer' },
      { title: 'Tambah Supplier', icon: 'plus-circle', href: 'relation.html', section: 'tambahSupplier' },
      { title: 'Daftar Supplier', icon: 'list', href: 'relation.html', section: 'daftarSupplier' }
    ]
  },
  {
    title: 'Report',
    icon: 'bar-chart-2',
    href: 'report.html',
    roles: ['admin']
  },
  {
    title: 'Setting',
    icon: 'settings',
    href: 'setting.html',
    roles: ['admin']
  }
];

// ========== FUNGSI RENDER SIDEBAR ==========
export function renderSidebar(options = {}) {
  const {
    containerId = 'sidebar',               // ID elemen sidebar
    overlayId = 'overlay',                 // ID elemen overlay
    menuToggleId = 'menuToggle',           // ID tombol buka sidebar
    closeSidebarId = 'closeSidebar',       // ID tombol tutup sidebar
    activePage = getCurrentPage(),         // Halaman aktif (auto-detect)
    activeSection = getActiveSection(),    // Section aktif (untuk masterdata/relation)
    showLocalUser = false,                 // Tampilkan info user lokal (untuk masterdata)
    localUserName = '',                    // Nama user lokal
    onLocalLogout = null                   // Callback logout lokal
  } = options;

  const sidebar = document.getElementById(containerId);
  if (!sidebar) {
    console.error(`Element #${containerId} tidak ditemukan`);
    return;
  }

  // Generate HTML
  const role = getCurrentRole();
  const filteredMenu = MENU_CONFIG.filter(item => item.roles.includes(role));
  
  let html = `
    <div class="sidebar-header">
      <h2>MUDA POS</h2>
      <button class="close-sidebar" id="${closeSidebarId}"><i data-feather="x"></i></button>
    </div>
    <ul class="sidebar-menu">
  `;

  filteredMenu.forEach(item => {
    const isActive = !item.submenu && item.href === activePage;
    if (item.submenu) {
      // Cek apakah ada submenu yang aktif
      const hasActiveChild = item.submenu.some(sub => sub.href === activePage);
      const openClass = hasActiveChild ? 'open' : '';
      
      html += `<li class="has-submenu ${openClass}">`;
      html += `<a class="menu-link"><i data-feather="${item.icon}"></i> ${item.title} <i data-feather="chevron-down" class="arrow"></i></a>`;
      html += `<ul class="submenu">`;
      
      item.submenu.forEach(sub => {
        const subActive = sub.href === activePage && 
                         (!sub.section || sub.section === activeSection);
        html += `<li><a href="${sub.href}${sub.section ? '#' + sub.section : ''}" 
                        class="${subActive ? 'active' : ''}">
                  <i data-feather="${sub.icon || 'circle'}"></i> ${sub.title}
                </a></li>`;
      });
      
      html += `</ul></li>`;
    } else {
      html += `<li><a href="${item.href}" class="menu-link ${isActive ? 'active' : ''}">
                <i data-feather="${item.icon}"></i> ${item.title}
              </a></li>`;
    }
  });

  html += `</ul>`;

  // Footer dengan info user lokal (opsional)
  if (showLocalUser) {
    html += `
      <div class="sidebar-footer">
        <div class="local-user-info">
          <span>${localUserName || 'User'}</span>
          <button class="local-logout-btn" id="localLogoutBtn">Logout</button>
        </div>
      </div>
    `;
  }

  sidebar.innerHTML = html;

  // Inisialisasi Feather Icons
  if (window.feather) {
    feather.replace();
  }

  // Event Listeners
  initSidebarEvents({
    containerId,
    overlayId,
    menuToggleId,
    closeSidebarId,
    onLocalLogout
  });

  // Tandai halaman aktif di submenu (jika ada)
  highlightCurrentPage(activePage, activeSection);
}

// ========== INISIALISASI EVENT SIDEBAR ==========
function initSidebarEvents({ containerId, overlayId, menuToggleId, closeSidebarId, onLocalLogout }) {
  const sidebar = document.getElementById(containerId);
  const overlay = document.getElementById(overlayId);
  const menuToggle = document.getElementById(menuToggleId);
  const closeBtn = document.getElementById(closeSidebarId);

  // Buka sidebar
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('active');
    });
  }

  // Tutup sidebar
  const closeSidebar = () => {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Toggle submenu
  sidebar.querySelectorAll('.has-submenu .menu-link').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = toggle.closest('.has-submenu');
      parent.classList.toggle('open');
    });
  });

  // Local logout (untuk masterdata)
  const localLogoutBtn = document.getElementById('localLogoutBtn');
  if (localLogoutBtn && onLocalLogout) {
    localLogoutBtn.addEventListener('click', onLocalLogout);
  }
}

// ========== HELPER ==========
function getCurrentPage() {
  const path = window.location.pathname;
  return path.split('/').pop() || 'index.html';
}

function getActiveSection() {
  const hash = window.location.hash.substring(1);
  return hash || null;
}

function highlightCurrentPage(activePage, activeSection) {
  // Tandai link aktif
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    const [page, section] = href.split('#');
    if (page === activePage) {
      if (!section || section === activeSection) {
        link.classList.add('active');
        // Buka parent submenu jika ada
        const parentSubmenu = link.closest('.has-submenu');
        if (parentSubmenu) {
          parentSubmenu.classList.add('open');
        }
      }
    }
  });
}

// ========== EKSPOR KONFIGURASI UNTUK CUSTOMISASI ==========
export function getMenuConfig() {
  return MENU_CONFIG;
}
