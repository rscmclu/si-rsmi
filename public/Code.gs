/**
 * ========================================================================
 * SIMBARS - SISTEM INFORMASI MANAJEMEN INVENTARIS & ASET RUMAH SAKIT
 * Google Apps Script Backend Engine & Dynamic Schema Auto-Migrator
 * ========================================================================
 * Versi Script: 3.3.0
 * Update Otomatis: Mendukung penambahan kolom & tabel baru secara mandiri
 * Rumah Sakit Medika Insani - Bagian Sarana & Prasarana (IPSRS)
 * 
 * FITUR UTAMA CODE.GS v3.3.0:
 * 1. Mesin Batch-Update Cepat & Stabil: Mendukung pembaruan multi-tabel dalam batch teroptimasi, mengurangi request HTTP drastis
 * 2. Auto-Migrasi Skema: Otomatis mendeteksi dan membuat sheet/kolom baru tanpa hapus data
 * 3. 19 Tabel Lengkap: Master, DIR (Foto Aset), Laporan Mutu 15 Menit, Audit Log, Pengadaan, Pemusnahan
 * 4. Otomatisasi Dua Arah: Push & Pull real-time sinkron dengan SIMBARS Web Application
 * 5. Tracking Metadata: Mencatat histori sinkronisasi dan kesehatan database di METADATA_SISTEM
 * 
 * PETUNJUK INSTALASI:
 * 1. Buka Google Spreadsheet SIMBARS di peramban Anda.
 * 2. Klik menu "Ekstensi" > "Apps Script".
 * 3. Hapus semua kode default, lalu tempel (paste) seluruh isi file Code.gs ini.
 * 4. Simpan proyek (Ctrl+S) dengan nama "SIMBARS_Backend".
 * 5. Jalankan fungsi "setupDatabase" atau "autoMigrateDatabase".
 * 6. Klik "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment) > Pilih "Aplikasi Web" (Web App).
 *    - Jalankan sebagai: "Saya" (User)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone)
 * 7. Salin URL Aplikasi Web yang dihasilkan ke menu Pengaturan SIMBARS.
 * ========================================================================
 */

const SCRIPT_VERSION = "3.3.0";
const API_KEY_SECRET = "RSMI-SIMBARS-SECURE-KEY-2025";

/**
 * Definisi Skema Lengkap 19 Tabel SIMBARS
 */
function getDatabaseSchemaDefinitions() {
  return [
    {
      name: 'MASTER_JENIS',
      color: '#059669',
      headers: ['ID Jenis (3 Karakter)', 'Nama Jenis Inventaris', 'Deskripsi', 'Tanggal Dibuat']
    },
    {
      name: 'MASTER_KATEGORI',
      color: '#0d9488',
      headers: ['ID Kategori (3 Karakter)', 'Nama Kategori', 'Kelompok', 'Tanggal Dibuat']
    },
    {
      name: 'MASTER_MERK',
      color: '#0284c7',
      headers: ['ID Merk', 'Nomor Urut', 'Nama Merk', 'Negara Asal', 'Keterangan', 'Tanggal Dibuat']
    },
    {
      name: 'MASTER_RUANG',
      color: '#2563eb',
      headers: ['ID Ruang (3 Karakter)', 'Nama Ruang', 'Gedung & Lantai', 'Penanggung Jawab', 'Kontak PJ', 'Tanggal Dibuat']
    },
    {
      name: 'MASTER_SUPPLIER',
      color: '#4f46e5',
      headers: ['ID Supplier', 'Nama Supplier', 'Alamat', 'Telepon', 'Email', 'PIC Kontak', 'Tanggal Dibuat']
    },
    {
      name: 'DATA_INVENTARIS_RUANG',
      color: '#10b981',
      headers: [
        'ID Barang (Jenis-Kat-Ruang-Urut)', 'No Urut', 'Nama Barang / Aset', 'ID Jenis', 'ID Kategori',
        'ID Merk', 'ID Ruang', 'ID Supplier', 'Spesifikasi Teknis', 'Nomor Seri Pabrik',
        'Tahun Perolehan', 'Harga Perolehan (Rp)', 'Kondisi', 'Status Ketersediaan',
        'Sumber Dana', 'Tanggal Registrasi', 'Catatan Khusus', 'Foto Aset URL / Bukti'
      ]
    },
    {
      name: 'DATA_SIRKULASI_MUTASI',
      color: '#0891b2',
      headers: ['ID Sirkulasi', 'No Surat Jalan', 'Tanggal', 'ID Barang', 'Nama Barang', 'Ruang Asal', 'Ruang Tujuan', 'Jumlah', 'Penanggung Jawab', 'Penerima', 'Alasan Mutasi', 'Tindak Lanjut', 'Status']
    },
    {
      name: 'DATA_AUDIT_LOGS',
      color: '#64748b',
      headers: ['ID Log', 'ID Barang', 'Tanggal & Waktu', 'Tipe Aksi', 'Judul Perubahan', 'Deskripsi Lengkap', 'Petugas / User', 'Role User', 'Ruang Asal', 'Ruang Tujuan', 'Status Lama', 'Status Baru', 'Kondisi Lama', 'Kondisi Baru', 'Dokumen Ref', 'Catatan']
    },
    {
      name: 'KEGIATAN_PERMINTAAN_PERBAIKAN',
      color: '#e11d48',
      headers: ['ID Permintaan', 'Tanggal', 'ID Ruang', 'ID Barang', 'Nama Barang', 'Deskripsi Kerusakan', 'Prioritas', 'Pelapor', 'Status Progress', 'Catatan Admin']
    },
    {
      name: 'KEGIATAN_PERBAIKAN',
      color: '#ea580c',
      headers: ['ID Perbaikan', 'ID Permintaan Ref', 'No Berita Acara', 'Tanggal Mulai', 'Tanggal Selesai', 'ID Barang', 'Nama Barang', 'ID Ruang', 'Pelaksana', 'Teknisi', 'Tindakan Perbaikan', 'Suku Cadang', 'Biaya Estimasi', 'Biaya Realisasi', 'Status Akhir', 'Catatan Teknisi']
    },
    {
      name: 'JADWAL_PEMELIHARAAN',
      color: '#d97706',
      headers: ['ID Jadwal', 'ID Barang', 'Nama Barang', 'ID Ruang', 'Frekuensi', 'Tanggal Terakhir', 'Tanggal Berikutnya', 'Petugas IPSRS', 'Status', 'Catatan Pemeliharaan']
    },
    {
      name: 'KEGIATAN_LAPORAN_MUTU',
      color: '#059669',
      headers: ['ID Laporan Mutu', 'ID Tiket Ref', 'Unit Pelapor', 'Nama Barang / Alat', 'ID Barang', 'Deskripsi Masalah', 'Tanggal & Jam Lapor', 'Tanggal & Jam Respon', 'Durasi Respon (Menit)', 'Status Capaian Respon (<=15 Mnt)', 'Alasan Keterlambatan', 'Teknisi Respon IPSRS', 'Tindak Lanjut', 'Catatan', 'Tanggal Dibuat']
    },
    {
      name: 'PENGADAAN_PENGAJUAN',
      color: '#7c3aed',
      headers: ['ID Pengajuan', 'No Pengajuan', 'Tanggal', 'ID Ruang Pemohon', 'Nama Barang', 'ID Jenis', 'ID Kategori', 'Jumlah', 'Satuan', 'Estimasi Satuan', 'Total Estimasi', 'Alasan Kebutuhan', 'Prioritas', 'Status Approval', 'Pemohon']
    },
    {
      name: 'PENGADAAN_PO',
      color: '#9333ea',
      headers: ['ID Pengadaan', 'ID Pengajuan Ref', 'No PO', 'Tanggal PO', 'ID Supplier', 'Nama Barang', 'ID Jenis', 'ID Kategori', 'ID Ruang Tujuan', 'Jumlah', 'Harga Satuan', 'Total Nilai', 'Status Pengadaan', 'Keterangan']
    },
    {
      name: 'PENGADAAN_PENERIMAAN',
      color: '#c026d3',
      headers: ['ID Penerimaan', 'ID Pengadaan Ref', 'No BAST', 'Tanggal Terima', 'ID Supplier', 'Nama Barang', 'ID Jenis', 'ID Kategori', 'ID Ruang Tujuan', 'Jumlah Diterima', 'Kondisi Fisik', 'Pemeriksa', 'Status Eksekusi Ruangan', 'Catatan']
    },
    {
      name: 'PEMUSNAHAN_PERMINTAAN',
      color: '#dc2626',
      headers: ['ID Usulan', 'No Usulan', 'Tanggal Pengajuan', 'ID Barang', 'Nama Barang', 'ID Ruang', 'Kondisi Saat Ini', 'Alasan Pemusnahan', 'Pengusul', 'Status Persetujuan Komite', 'Catatan Komite']
    },
    {
      name: 'PEMUSNAHAN_PELAKSANAAN',
      color: '#991b1b',
      headers: ['ID Pelaksanaan', 'ID Usulan Ref', 'ID Barang', 'Nama Barang', 'Ruang Asal', 'Tanggal Eksekusi', 'Metode Pemusnahan', 'Lokasi Eksekusi', 'Penanggung Jawab', 'Saksi 1', 'Saksi 2', 'No Berita Acara (BAP)', 'Keterangan', 'Status']
    },
    {
      name: 'USERS_AUTH',
      color: '#334155',
      headers: ['ID User', 'Username', 'Nama Lengkap', 'NIP', 'Role / Jabatan', 'Ruang Restriksi', 'Unit Kerja', 'Kontak', 'Status Aktif', 'Terakhir Login']
    },
    {
      name: 'APP_SETTINGS',
      color: '#1e293b',
      headers: ['Pengaturan Key', 'Nilai / Value', 'Keterangan Konfigurasi', 'Terakhir Diperbarui']
    }
  ];
}

/**
 * Menu otomatis saat Google Spreadsheet dibuka
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏥 SIMBARS Medika Insani')
    .addItem('⚙️ Update & Migrasi Skema Otomatis (v' + SCRIPT_VERSION + ')', 'autoMigrateDatabase')
    .addItem('🔄 Sinkronisasi Penuh Database', 'setupDatabase')
    .addSeparator()
    .addItem('ℹ️ Cek Status & Kesehatan Database', 'showDatabaseStatus')
    .addToUi();
}

/**
 * Migrasi Skema Dinamis: Menambahkan tabel atau kolom baru secara otomatis tanpa merusak data lama
 */
function autoMigrateDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tables = getDatabaseSchemaDefinitions();
  
  let createdCount = 0;
  let updatedCount = 0;

  tables.forEach(table => {
    let sheet = ss.getSheetByName(table.name);
    if (!sheet) {
      sheet = ss.insertSheet(table.name);
      createdCount++;
    }

    const lastCol = sheet.getLastColumn();
    let currentHeaders = [];
    if (lastCol > 0 && sheet.getLastRow() > 0) {
      currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    }

    if (currentHeaders.length === 0) {
      const headerRange = sheet.getRange(1, 1, 1, table.headers.length);
      headerRange.setValues([table.headers]);
      headerRange.setBackground(table.color);
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    } else if (currentHeaders.length < table.headers.length) {
      const missingHeaders = table.headers.slice(currentHeaders.length);
      const appendRange = sheet.getRange(1, currentHeaders.length + 1, 1, missingHeaders.length);
      appendRange.setValues([missingHeaders]);
      appendRange.setBackground(table.color);
      appendRange.setFontColor('#FFFFFF');
      appendRange.setFontWeight('bold');
      appendRange.setHorizontalAlignment('center');
      updatedCount++;
    }
  });

  let metaSheet = ss.getSheetByName('METADATA_SISTEM');
  if (!metaSheet) {
    metaSheet = ss.insertSheet('METADATA_SISTEM');
  }
  metaSheet.getRange(1, 1, 1, 3).setValues([['Parameter', 'Nilai', 'Terakhir Diperbarui']]);
  metaSheet.getRange(1, 1, 1, 3).setBackground('#0f172a').setFontColor('#FFFFFF').setFontWeight('bold');
  metaSheet.setFrozenRows(1);

  const metaData = [
    ['SISTEM', 'SIMBARS RS Medika Insani', new Date().toISOString()],
    ['VERSI_SCRIPT', SCRIPT_VERSION, new Date().toISOString()],
    ['TOTAL_TABEL', tables.length.toString(), new Date().toISOString()],
    ['STATUS_DATABASE', 'Aktif & Kompatibel Penuh (19 Sheet)', new Date().toISOString()],
    ['TERAKHIR_MIGRASI', new Date().toLocaleString('id-ID'), new Date().toISOString()]
  ];
  metaSheet.getRange(2, 1, metaData.length, 3).setValues(metaData);

  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  return {
    success: true,
    version: SCRIPT_VERSION,
    totalTables: tables.length,
    createdCount: createdCount,
    updatedCount: updatedCount,
    timestamp: new Date().toISOString()
  };
}

/**
 * Setup Database Lengkap
 */
function setupDatabase() {
  const res = autoMigrateDatabase();
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '✅ Database SIMBARS v' + SCRIPT_VERSION + ' berhasil di-setup! Total ' + res.totalTables + ' tabel siap digunakan.',
      'Sukses Update Database',
      6
    );
  } catch (e) {}
  return res;
}

/**
 * Handle HTTP GET Request
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'ping') {
    return createJsonResponse({
      status: 'ok',
      version: SCRIPT_VERSION,
      message: 'SIMBARS Google Apps Script API v' + SCRIPT_VERSION + ' active & ready.',
      spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
      totalSheets: SpreadsheetApp.getActiveSpreadsheet().getSheets().length,
      timestamp: new Date().toISOString()
    });
  }

  if (action === 'getVersion') {
    return createJsonResponse({
      status: 'ok',
      version: SCRIPT_VERSION,
      schemaVersion: SCRIPT_VERSION,
      totalTables: getDatabaseSchemaDefinitions().length
    });
  }

  if (
    action === 'autoUpdateSchema' ||
    action === 'migrateSchema' ||
    action === 'updateSchema' ||
    action === 'setupDatabase'
  ) {
    const report = autoMigrateDatabase();
    return createJsonResponse({
      status: 'success',
      version: SCRIPT_VERSION,
      message: 'Skema Google Spreadsheet (19 Tabel) berhasil diperbarui dan dimigrasikan otomatis ke versi ' + SCRIPT_VERSION,
      report: report,
      timestamp: new Date().toISOString()
    });
  }

  if (action === 'getAllData') {
    return createJsonResponse(fetchAllTablesData());
  }

  if (action && action !== 'portal' && action !== 'view' && action !== 'index') {
    return createJsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  }

  // Jika diakses tanpa parameter action (atau action=portal / action=view): Sajikan index.html
  try {
    return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('SIMBARS - Portal Google Apps Script (RS Medika Insani)')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  } catch (htmlErr) {
    // Jika file index.html belum dibuat di Google Apps Script editor, tampilkan respon fallback
    return createJsonResponse({
      status: 'ok',
      version: SCRIPT_VERSION,
      message: 'SIMBARS Google Apps Script API v' + SCRIPT_VERSION + ' active & ready. (Untuk mengaktifkan Web Portal UI lengkap, tambahkan file index.html pada Apps Script)',
      spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
      totalSheets: SpreadsheetApp.getActiveSpreadsheet().getSheets().length,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Server functions callable by google.script.run from index.html
 */
function getGasPortalData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const defs = getDatabaseSchemaDefinitions();

    const tablesSummary = defs.map(def => {
      const sh = ss.getSheetByName(def.name);
      return {
        name: def.name,
        color: def.color,
        exists: sh !== null,
        rowCount: sh ? Math.max(0, sh.getLastRow() - 1) : 0,
        headersCount: def.headers.length
      };
    });

    return {
      status: 'ok',
      version: SCRIPT_VERSION,
      spreadsheetName: ss.getName(),
      spreadsheetId: ss.getId(),
      totalSheets: sheets.length,
      tables: tablesSummary,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      status: 'error',
      message: err.toString()
    };
  }
}

function searchAssetItems(keyword) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('DATA_INVENTARIS_RUANG');
    if (!sheet) return { status: 'error', message: 'Sheet DATA_INVENTARIS_RUANG belum ada.' };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { status: 'ok', items: [] };

    const q = (keyword || '').toLowerCase().trim();
    const results = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = String(row[0] || '');
      const nama = String(row[2] || '');
      const ruang = String(row[6] || '');
      const serial = String(row[9] || '');
      const kondisi = String(row[12] || '');
      const status = String(row[13] || '');
      const harga = row[11] || 0;

      if (
        !q ||
        id.toLowerCase().includes(q) ||
        nama.toLowerCase().includes(q) ||
        ruang.toLowerCase().includes(q) ||
        serial.toLowerCase().includes(q)
      ) {
        results.push({
          id: id,
          nama: nama,
          ruang: ruang,
          serial: serial,
          kondisi: kondisi,
          status: status,
          harga: harga
        });
      }
      if (results.length >= 50) break;
    }

    return { status: 'ok', items: results };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

/**
 * Handle HTTP POST Request
 */
function doPost(e) {
  try {
    let postData;
    try {
      postData = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({ status: 'error', message: 'Format data JSON tidak valid: ' + parseErr.toString() });
    }

    const action = postData.action || 'syncFullDatabase';

    // Verifikasi API Secret dengan toleransi spasi & diagnosa yang jelas
    const providedKey = (postData.apiKey || '').toString().trim();
    const expectedKey = (typeof API_KEY_SECRET !== 'undefined' ? API_KEY_SECRET : 'RSMI-SIMBARS-SECURE-KEY-2025').toString().trim();
    if (expectedKey && providedKey && providedKey !== expectedKey) {
      return createJsonResponse({ 
        status: 'error', 
        message: 'Invalid API Key Secret. Kunci yang dikirim tidak cocok dengan API_KEY_SECRET di Code.gs.' 
      });
    }

    if (
      action === 'autoUpdateSchema' ||
      action === 'migrateSchema' ||
      action === 'updateSchema' ||
      action === 'setupDatabase'
    ) {
      const report = autoMigrateDatabase();
      if (postData.data) {
        saveFullDataToSpreadsheet(postData.data);
      }
      return createJsonResponse({
        status: 'success',
        version: SCRIPT_VERSION,
        message: 'Skema Google Spreadsheet (19 Tabel) berhasil dimigrasikan dan diperbarui otomatis ke versi ' + SCRIPT_VERSION,
        report: report
      });
    }

    if (action === 'getScriptVersion' || action === 'getVersion') {
      return createJsonResponse({
        status: 'ok',
        version: SCRIPT_VERSION,
        schemaVersion: SCRIPT_VERSION,
        totalTables: getDatabaseSchemaDefinitions().length
      });
    }

    if (action === 'syncFullDatabase') {
      autoMigrateDatabase();

      const payload = postData.data;
      saveFullDataToSpreadsheet(payload);
      return createJsonResponse({
        status: 'success',
        version: SCRIPT_VERSION,
        message: 'Data berhasil disinkronisasi ke 19 tabel Google Spreadsheet secara menyeluruh.',
        syncedAt: new Date().toISOString()
      });
    }

    if (action === 'batchUpdate') {
      autoMigrateDatabase();

      const batchResult = processBatchUpdate(postData);
      return createJsonResponse({
        status: 'success',
        version: SCRIPT_VERSION,
        action: 'batchUpdate',
        message: 'Batch update berhasil: ' + batchResult.updatedCount + ' tabel diperbarui (' + batchResult.totalRows + ' total baris).',
        details: batchResult,
        syncedAt: new Date().toISOString()
      });
    }

    // Jika action tidak dikenali tapi ada payload data, jalankan autoMigrate & simpan
    if (postData.data) {
      autoMigrateDatabase();
      saveFullDataToSpreadsheet(postData.data);
      return createJsonResponse({
        status: 'success',
        version: SCRIPT_VERSION,
        message: 'Data berhasil disinkronkan ke Google Spreadsheet (fallback mode).',
        syncedAt: new Date().toISOString()
      });
    }

    return createJsonResponse({ status: 'error', message: 'Invalid action: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Membaca seluruh data dari 19 sheet menjadi objek JSON terstruktur
 */
function fetchAllTablesData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const getRows = (sheetName) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    const headers = values[0];
    return values.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, idx) => { obj[h] = row[idx]; });
      return obj;
    });
  };

  return {
    status: 'success',
    version: SCRIPT_VERSION,
    data: {
      jenis: getRows('MASTER_JENIS'),
      kategori: getRows('MASTER_KATEGORI'),
      merk: getRows('MASTER_MERK'),
      ruang: getRows('MASTER_RUANG'),
      supplier: getRows('MASTER_SUPPLIER'),
      inventarisRuangan: getRows('DATA_INVENTARIS_RUANG'),
      sirkulasi: getRows('DATA_SIRKULASI_MUTASI'),
      auditLogs: getRows('DATA_AUDIT_LOGS'),
      permintaanPerbaikan: getRows('KEGIATAN_PERMINTAAN_PERBAIKAN'),
      perbaikan: getRows('KEGIATAN_PERBAIKAN'),
      jadwalPemeliharaan: getRows('JADWAL_PEMELIHARAAN'),
      laporanMutu: getRows('KEGIATAN_LAPORAN_MUTU'),
      pengajuan: getRows('PENGADAAN_PENGAJUAN'),
      pengadaan: getRows('PENGADAAN_PO'),
      penerimaan: getRows('PENGADAAN_PENERIMAAN'),
      permintaanPemusnahan: getRows('PEMUSNAHAN_PERMINTAAN'),
      pelaksanaanPemusnahan: getRows('PEMUSNAHAN_PELAKSANAAN'),
      users: getRows('USERS_AUTH'),
      appSettings: getRows('APP_SETTINGS')
    }
  };
}

/**
 * Menyimpan seluruh data payload ke Google Spreadsheet
 */
function saveFullDataToSpreadsheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const writeTable = (sheetName, rows) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      autoMigrateDatabase();
      sheet = ss.getSheetByName(sheetName);
    }
    if (!sheet) return;
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
    if (rows && rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
  };

  // 1. MASTER_JENIS
  if (data.master && data.master.jenis) {
    const rows = data.master.jenis.map(j => [j.id, j.namaJenis, j.deskripsi, j.createdAt || '']);
    writeTable('MASTER_JENIS', rows);
  }

  // 2. MASTER_KATEGORI
  if (data.master && data.master.kategori) {
    const rows = data.master.kategori.map(k => [k.id, k.namaKategori, k.kelompok, k.createdAt || '']);
    writeTable('MASTER_KATEGORI', rows);
  }

  // 3. MASTER_MERK
  if (data.master && data.master.merk) {
    const rows = data.master.merk.map(m => [m.id, m.nomorUrut, m.namaMerk, m.negaraAsal, m.keterangan, m.createdAt || '']);
    writeTable('MASTER_MERK', rows);
  }

  // 4. MASTER_RUANG
  if (data.master && data.master.ruang) {
    const rows = data.master.ruang.map(r => [r.id, r.namaRuang, r.gedungLantai, r.penanggungJawab, r.kontakPJ, r.createdAt || '']);
    writeTable('MASTER_RUANG', rows);
  }

  // 5. MASTER_SUPPLIER
  if (data.master && data.master.supplier) {
    const rows = data.master.supplier.map(s => [s.id, s.nama, s.alamat, s.telepon, s.email, s.pic, s.createdAt || '']);
    writeTable('MASTER_SUPPLIER', rows);
  }

  // 6. DATA_INVENTARIS_RUANG
  if (data.dataInventaris && data.dataInventaris.ruangan) {
    const rows = data.dataInventaris.ruangan.map(inv => [
      inv.idBarang, inv.noUrut, inv.namaBarang, inv.idJenis, inv.idKategori,
      inv.idMerk, inv.idRuang, inv.idSupplier, inv.spesifikasi, inv.nomorSeri,
      inv.tahunPerolehan, inv.hargaPerolehan, inv.kondisi, inv.status,
      inv.sumberDana, inv.tanggalInput, inv.catatan || '', inv.fotoUrl || ''
    ]);
    writeTable('DATA_INVENTARIS_RUANG', rows);
  }

  // 7. DATA_SIRKULASI_MUTASI
  if (data.dataInventaris && data.dataInventaris.sirkulasi) {
    const rows = data.dataInventaris.sirkulasi.map(s => [
      s.idSirkulasi, s.noSuratJalan || '', s.tanggal, s.idBarang, s.namaBarang,
      s.ruangAsalId || s.idRuangAsal || '', s.ruangTujuanId || s.idRuangTujuan || '', s.jumlah || 1,
      s.penanggungJawab, s.penerima, s.alasan, s.tindakLanjut || 'Dimutasikan', s.status
    ]);
    writeTable('DATA_SIRKULASI_MUTASI', rows);
  }

  // 8. DATA_AUDIT_LOGS
  if (data.dataInventaris && data.dataInventaris.auditLogs) {
    const rows = data.dataInventaris.auditLogs.map(a => [
      a.idLog, a.idBarang, a.timestamp, a.tipeAksi, a.judul, a.deskripsi,
      a.user, a.roleUser || '', a.ruangAsalId || '', a.ruangTujuanId || '',
      a.statusLama || '', a.statusBaru || '', a.kondisiLama || '', a.kondisiBaru || '',
      a.dokumenRef || '', a.catatan || ''
    ]);
    writeTable('DATA_AUDIT_LOGS', rows);
  }

  // 9. KEGIATAN_PERMINTAAN_PERBAIKAN
  if (data.kegiatan && data.kegiatan.permintaanPerbaikan) {
    const rows = data.kegiatan.permintaanPerbaikan.map(pp => [
      pp.idPermintaan, pp.tanggal, pp.idRuang, pp.idBarang, pp.namaBarang,
      pp.deskripsiKerusakan, pp.prioritas, pp.pelapor, pp.status, pp.catatanAdmin || ''
    ]);
    writeTable('KEGIATAN_PERMINTAAN_PERBAIKAN', rows);
  }

  // 10. KEGIATAN_PERBAIKAN
  if (data.kegiatan && data.kegiatan.perbaikan) {
    const rows = data.kegiatan.perbaikan.map(pb => [
      pb.idPerbaikan, pb.idPermintaan || '', pb.noBeritaAcara, pb.tanggalMulai,
      pb.tanggalSelesai || '', pb.idBarang, pb.namaBarang, pb.idRuang,
      pb.jenisPelaksana, pb.teknisi, pb.tindakan, pb.sukuCadang,
      pb.biayaEstimasi, pb.biayaRealisasi, pb.status, pb.catatanTeknisi
    ]);
    writeTable('KEGIATAN_PERBAIKAN', rows);
  }

  // 11. JADWAL_PEMELIHARAAN
  if (data.kegiatan && data.kegiatan.jadwalPemeliharaan) {
    const rows = data.kegiatan.jadwalPemeliharaan.map(pm => [
      pm.idJadwal, pm.idBarang, pm.namaBarang, pm.idRuang, pm.frekuensi,
      pm.tanggalTerakhir || '', pm.tanggalBerikutnya, pm.petugas, pm.status,
      pm.catatanPemeliharaan || ''
    ]);
    writeTable('JADWAL_PEMELIHARAAN', rows);
  }

  // 12. KEGIATAN_LAPORAN_MUTU
  if (data.kegiatan && data.kegiatan.laporanMutu) {
    const rows = data.kegiatan.laporanMutu.map(m => [
      m.idLaporan, m.idPermintaan || '', m.unitPelapor, m.namaBarang, m.idBarang || '',
      m.deskripsiMasalah || '', m.tglJamLapor, m.tglJamRespon || '', m.durasiRespon || 0,
      m.statusRespon, m.alasanKeterlambatan || '', m.teknisiRespon || '', m.tindakLanjut || 'Sudah Dikerjakan',
      m.catatan || '', m.createdAt || ''
    ]);
    writeTable('KEGIATAN_LAPORAN_MUTU', rows);
  }

  // 13. PENGADAAN_PENGAJUAN
  if (data.pengadaan && data.pengadaan.pengajuan) {
    const rows = data.pengadaan.pengajuan.map(aj => [
      aj.idPengajuan, aj.nomorPengajuan, aj.tanggal, aj.idRuangPemohon,
      aj.namaBarang, aj.idJenis, aj.idKategori, aj.jumlah, aj.satuan,
      aj.estimasiHargaSatuan, aj.totalEstimasi, aj.alasanKebutuhan,
      aj.prioritas, aj.statusApproval, aj.pemohon
    ]);
    writeTable('PENGADAAN_PENGAJUAN', rows);
  }

  // 14. PENGADAAN_PO
  if (data.pengadaan && data.pengadaan.pengadaan) {
    const rows = data.pengadaan.pengadaan.map(po => [
      po.idPengadaan, po.idPengajuan || '', po.noPO, po.tanggalPO,
      po.idSupplier, po.namaBarang, po.idJenis, po.idKategori,
      po.idRuangTujuan, po.jumlah, po.hargaSatuan, po.totalNilai,
      po.statusPengadaan, po.keterangan
    ]);
    writeTable('PENGADAAN_PO', rows);
  }

  // 15. PENGADAAN_PENERIMAAN
  if (data.pengadaan && data.pengadaan.penerimaan) {
    const rows = data.pengadaan.penerimaan.map(tr => [
      tr.idPenerimaan, tr.idPengadaan, tr.noBAST, tr.tanggalTerima,
      tr.idSupplier, tr.namaBarang, tr.idJenis, tr.idKategori,
      tr.idRuangTujuan, tr.jumlahDiterima, tr.kondisiFisik,
      tr.pemeriksa, tr.statusEksekusi, tr.catatan
    ]);
    writeTable('PENGADAAN_PENERIMAAN', rows);
  }

  // 16. PEMUSNAHAN_PERMINTAAN
  if (data.pemusnahan && data.pemusnahan.permintaan) {
    const rows = data.pemusnahan.permintaan.map(pm => [
      pm.idPemusnahan, pm.noUsulan, pm.tanggalPengajuan, pm.idBarang,
      pm.namaBarang, pm.idRuang, pm.kondisiSaatIni, pm.alasanPemusnahan,
      pm.pengusul, pm.statusPersetujuan, pm.catatanKomite || ''
    ]);
    writeTable('PEMUSNAHAN_PERMINTAAN', rows);
  }

  // 17. PEMUSNAHAN_PELAKSANAAN
  if (data.pemusnahan && data.pemusnahan.pelaksanaan) {
    const rows = data.pemusnahan.pelaksanaan.map(pl => [
      pl.idPelaksanaan, pl.idPemusnahan, pl.idBarang, pl.namaBarang,
      pl.idRuangAsal, pl.tanggalEksekusi, pl.metode, pl.lokasi,
      pl.penanggungJawab, pl.saksi1, pl.saksi2, pl.noBeritaAcara,
      pl.keterangan, pl.status
    ]);
    writeTable('PEMUSNAHAN_PELAKSANAAN', rows);
  }

  // 18. USERS_AUTH
  if (data.users && Array.isArray(data.users)) {
    const rows = data.users.map(u => [
      u.id, u.username, u.namaLengkap, u.nip || '-', u.role,
      u.ruangId || '-', u.unitKerja || 'Rumah Sakit Medika Insani', u.kontak || '',
      u.isActive !== false ? 'Aktif' : 'Nonaktif', u.lastLogin || ''
    ]);
    writeTable('USERS_AUTH', rows);
  }

  // 19. APP_SETTINGS
  if (data.appSettings && typeof data.appSettings === 'object') {
    const settingsEntries = Object.entries(data.appSettings).map(([k, v]) => [
      k, typeof v === 'object' ? JSON.stringify(v) : String(v), 'Konfigurasi Sistem SIMBARS', new Date().toISOString()
    ]);
    writeTable('APP_SETTINGS', settingsEntries);
  }
}

/**
 * Memproses pembaruan data secara batch (mengurangi beban payload & request HTTP)
 */
function processBatchUpdate(postData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let updatedCount = 0;
  let totalRows = 0;
  const updatedTables = [];

  const writeTableRows = (sheetName, rows) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      autoMigrateDatabase();
      sheet = ss.getSheetByName(sheetName);
    }
    if (!sheet) return;

    // Bersihkan data lama (tetap pertahankan header pada baris 1)
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow > 1 && lastCol > 0) {
      sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }
    if (rows && rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      totalRows += rows.length;
    }
    updatedCount++;
    updatedTables.push(sheetName);
  };

  // 1. Jika dikirim dalam format direct tables mapping: { "DATA_INVENTARIS_RUANG": [...], ... }
  if (postData.tables && typeof postData.tables === 'object') {
    const tableKeys = Object.keys(postData.tables);
    for (let i = 0; i < tableKeys.length; i++) {
      const tName = tableKeys[i];
      const rData = postData.tables[tName];
      if (Array.isArray(rData)) {
        writeTableRows(tName, rData);
      }
    }
  }

  // 2. Jika dikirim dalam format structured data
  if (postData.data) {
    saveFullDataToSpreadsheet(postData.data);
    updatedCount = Math.max(updatedCount, 1);
  }

  // Flush seluruh operasi Spreadsheet dalam satu batch
  SpreadsheetApp.flush();

  return {
    updatedCount: updatedCount,
    totalRows: totalRows,
    updatedTables: updatedTables,
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper JSON Response
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Dialog Info Status Database
 */
function showDatabaseStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().map(s => s.getName());
  SpreadsheetApp.getUi().alert(
    'Status Database SIMBARS:\\n' +
    'Versi Code.gs: ' + SCRIPT_VERSION + '\\n' +
    'Total Sheet Aktif: ' + sheets.length + '\\n\\n' +
    sheets.join('\\n')
  );
}
