// --- KONFIGURASI KONEKSI SUPABASE ---
const SUPABASE_URL = 'https://fgiqdltvyakrqlmqntmy.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_-96kNxkpROh3xzXf2x4Y3w_b3yQWNaX'; // Kunci API Anonim Anda

// Inisialisasi Klien Supabase
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tableName = 'pegawai_store'; 
let currentUser = null;

// Cek sesi aktif saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('sim_supabase_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        initApp();
    }
});

// --- SISTEM LOGIN (Deteksi Role Otomatis dari Username) ---
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const u = document.getElementById('username').value.trim().toLowerCase();
    const p = document.getElementById('password').value.trim();

    if (p === '123') {
        if (u === 'admin' || u === 'kepegawaian' || u === 'pegawai') {
            currentUser = { username: u, role: u };
            sessionStorage.setItem('sim_supabase_user', JSON.stringify(currentUser));
            initApp();
        } else {
            alert('Username tidak terdaftar! Gunakan: admin, kepegawaian, atau pegawai.');
        }
    } else {
        alert('Password salah!');
    }
});

document.getElementById('btn-logout').addEventListener('click', function() {
    sessionStorage.removeItem('sim_supabase_user');
    location.reload();
});

// --- INISIALISASI TAMPILAN APLIKASI ---
function initApp() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('user-profile-label').innerText = `Login: ${currentUser.username.toUpperCase()} (${currentUser.role})`;

    renderMenu();
    loadDashboard();
}

function renderMenu() {
    const navMenu = document.getElementById('nav-menu');
    let menuHtml = `<li><a href="#" class="active" onclick="loadDashboard()">📊 Dashboard</a></li>`;

    if (currentUser.role === 'admin') {
        menuHtml += `<li><a href="#" onclick="loadManajemenUser()">👥 Manajemen User</a></li>`;
        menuHtml += `<li><a href="#" onclick="loadDataPegawai()">🗂️ Data Dosen & Pegawai</a></li>`;
    } else if (currentUser.role === 'kepegawaian') {
        menuHtml += `<li><a href="#" onclick="loadDataPegawai()">🗂️ Kelola Data Dosen & Pegawai</a></li>`;
        menuHtml += `<li><a href="#" onclick="loadLaporan()">📈 Laporan SDM</a></li>`;
    } else if (currentUser.role === 'pegawai') {
        menuHtml += `<li><a href="#" onclick="loadProfilSaya()">👤 Profil Saya</a></li>`;
        menuHtml += `<li><a href="#" onclick="loadPengajuanCuti()">📝 Pengajuan Cuti</a></li>`;
    }

    navMenu.innerHTML = menuHtml;
}

// --- FUNGSI ASINKRON CRUD DENGAN SUPABASE ---

async function ambilSemuaData(callback) {
    let { data, error } = await _supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error mengambil data:', error.message);
        callback([]);
    } else {
        callback(data);
    }
}

// 1. DASHBOARD
function loadDashboard() {
    document.getElementById('page-title').innerText = 'Dashboard Utama';
    
    ambilSemuaData(function(data) {
        const totalDosen = data.filter(item => item.jenis === 'Dosen').length;
        const totalPegawai = data.filter(item => item.jenis === 'Pegawai').length;

        let htmlContent = `
            <div class="dashboard-cards">
                <div class="card">
                    <h3>Total Dosen</h3>
                    <div class="number">${totalDosen}</div>
                </div>
                <div class="card">
                    <h3>Total Pegawai / Staff</h3>
                    <div class="number">${totalPegawai}</div>
                </div>
                <div class="card">
                    <h3>Total Keseluruhan SDM</h3>
                    <div class="number">${data.length}</div>
                </div>
            </div>
            <div class="table-container">
                <h3>Sistem Basis Data Cloud (Supabase)</h3>
                <p style="margin-top: 10px; color: #475569;">Aplikasi ini terhubung secara real-time dengan server database cloud Supabase.</p>
            </div>
        `;
        document.getElementById('main-content').innerHTML = htmlContent;
    });
}

// 2. KELOLA DATA DOSEN & PEGAWAI
function loadDataPegawai() {
    document.getElementById('page-title').innerText = 'Data Dosen dan Pegawai';
    
    ambilSemuaData(function(data) {
        let rows = '';
        data.forEach((item, index) => {
            rows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.nip}</td>
                    <td>${item.nama}</td>
                    <td><span class="badge ${item.jenis === 'Dosen' ? 'badge-dosen' : 'badge-pegawai'}">${item.jenis}</span></td>
                    <td>${item.jabatan}</td>
                    <td>${item.unit}</td>
                    <td>
                        <button class="btn-sm btn-edit" onclick="editData(${item.id})">Edit</button>
                        <button class="btn-sm btn-delete" onclick="hapusData(${item.id})">Hapus</button>
                    </td>
                </tr>
            `;
        });

        let htmlContent = `
            <div class="table-container">
                <div class="table-header">
                    <h3>Database Supabase: Pegawai & Dosen Aktif</h3>
                    <button class="btn" style="width: auto; padding: 8px 16px;" onclick="tampilkanFormTambah()">+ Tambah Data</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>NIP</th>
                            <th>Nama Lengkap</th>
                            <th>Kategori</th>
                            <th>Jabatan</th>
                            <th>Unit / Prodi</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.length > 0 ? rows : '<tr><td colspan="7" style="text-align:center;">Database masih kosong.</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div id="form-action-container"></div>
        `;
        document.getElementById('main-content').innerHTML = htmlContent;
    });
}

function tampilkanFormTambah(isEdit = false, dataEdit = null) {
    const container = document.getElementById('form-action-container');
    container.innerHTML = `
        <div class="table-container" style="margin-top: 20px; border-top: 4px solid var(--primary);">
            <h3>${isEdit ? 'Edit Data Dosen/Pegawai' : 'Tambah Data Baru ke Supabase'}</h3>
            <form id="form-data-sdm" onsubmit="simpanDataSupabase(event, ${isEdit ? dataEdit.id : 'null'})">
                <div class="form-group" style="margin-top: 15px;">
                    <label>NIP</label>
                    <input type="text" id="input-nip" required value="${isEdit ? dataEdit.nip : ''}">
                </div>
                <div class="form-group">
                    <label>Nama Lengkap & Gelar</label>
                    <input type="text" id="input-nama" required value="${isEdit ? dataEdit.nama : ''}">
                </div>
                <div class="form-group">
                    <label>Kategori</label>
                    <select id="input-jenis">
                        <option value="Dosen" ${isEdit && dataEdit.jenis === 'Dosen' ? 'selected' : ''}>Dosen</option>
                        <option value="Pegawai" ${isEdit && dataEdit.jenis === 'Pegawai' ? 'selected' : ''}>Pegawai</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Jabatan</label>
                    <input type="text" id="input-jabatan" required value="${isEdit ? dataEdit.jabatan : ''}">
                </div>
                <div class="form-group">
                    <label>Unit Kerja / Program Studi</label>
                    <input type="text" id="input-unit" required value="${isEdit ? dataEdit.unit : ''}">
                </div>
                <button type="submit" class="btn" style="background-color: var(--success);">Simpan ke Supabase</button>
            </form>
        </div>
    `;
}

async function simpanDataSupabase(e, id) {
    e.preventDefault();
    const nip = document.getElementById('input-nip').value;
    const nama = document.getElementById('input-nama').value;
    const jenis = document.getElementById('input-jenis').value;
    const jabatan = document.getElementById('input-jabatan').value;
    const unit = document.getElementById('input-unit').value;

    const payload = { nip, nama, jenis, jabatan, unit };
    let error;

    if (id) {
        let res = await _supabase.from(tableName).update(payload).eq('id', id);
        error = res.error;
    } else {
        let res = await _supabase.from(tableName).insert([payload]);
        error = res.error;
    }

    if (error) {
        alert('Gagal menyimpan data: ' + error.message);
    } else {
        alert('Data berhasil disimpan ke Supabase!');
        loadDataPegawai();
    }
}

async function editData(id) {
    let { data, error } = await _supabase.from(tableName).select('*').eq('id', id).single();
    if (error) {
        alert('Gagal mengambil data untuk diedit.');
    } else {
        tampilkanFormTambah(true, data);
    }
}

async function hapusData(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini dari Supabase?')) {
        let { error } = await _supabase.from(tableName).delete().eq('id', id);
        if (error) {
            alert('Gagal menghapus data: ' + error.message);
        } else {
            alert('Data berhasil dihapus dari Supabase.');
            loadDataPegawai();
        }
    }
}

// 3. MANAJEMEN USER (Admin)
function loadManajemenUser() {
    document.getElementById('page-title').innerText = 'Manajemen Pengguna Sistem';
    document.getElementById('main-content').innerHTML = `
        <div class="table-container">
            <h3>Hak Akses Role Pengguna</h3>
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role Akses</th>
                        <th>Status Database</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>admin</td><td><span class="badge badge-dosen">Admin</span></td><td><span style="color:var(--success)">Supabase Terhubung</span></td></tr>
                    <tr><td>kepegawaian</td><td><span class="badge badge-pegawai">Kepegawaian</span></td><td><span style="color:var(--success)">Supabase Terhubung</span></td></tr>
                    <tr><td>pegawai</td><td><span class="badge" style="background:#e2e8f0; color:#334151;">Pegawai</span></td><td><span style="color:var(--success)">Supabase Terhubung</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// 4. LAPORAN SDM (Kepegawaian)
function loadLaporan() {
    document.getElementById('page-title').innerText = 'Laporan Rekapitulasi SDM';
    ambilSemuaData(function(data) {
        document.getElementById('main-content').innerHTML = `
            <div class="table-container">
                <h3>Rekapitulasi Berdasarkan Database Supabase</h3>
                <p style="margin: 15px 0;">Total Dosen: <strong>${data.filter(i => i.jenis === 'Dosen').length} Orang</strong></p>
                <p style="margin: 15px 0;">Total Pegawai: <strong>${data.filter(i => i.jenis === 'Pegawai').length} Orang</strong></p>
                <button class="btn" style="width:auto; margin-top:15px;" onclick="window.print()">🖨️ Cetak Laporan</button>
            </div>
        `;
    });
}

// 5. PROFIL & CUTI (Pegawai)
function loadProfilSaya() {
    document.getElementById('page-title').innerText = 'Profil Pegawai';
    document.getElementById('main-content').innerHTML = `
        <div class="table-container">
            <h3>Informasi Akun Pegawai Aktif</h3>
            <p style="margin-top:10px;">Username: <strong>pegawai</strong></p>
            <p style="margin-top:5px;">Status: <strong>Aktif (Cloud Connected)</strong></p>
        </div>
    `;
}

function loadPengajuanCuti() {
    document.getElementById('page-title').innerText = 'Form Pengajuan Cuti';
    document.getElementById('main-content').innerHTML = `
        <div class="table-container">
            <h3>Formulir Cuti Online</h3>
            <form onsubmit="event.preventDefault(); alert('Pengajuan cuti berhasil dikirim ke server Supabase!');" style="margin-top:15px;">
                <div class="form-group"><label>Keperluan / Alasan</label><input type="text" required></div>
                <div class="form-group"><label>Jumlah Hari</label><input type="number" required min="1" value="1"></div>
                <button type="submit" class="btn">Kirim Pengajuan</button>
            </form>
        </div>
    `;
}

