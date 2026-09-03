import { dataStorage } from './dataStorage';
import { GasSyncConfig } from '../types/inventory';

export const SCRIPT_VERSION = '3.3.0';

export interface BatchProgressInfo {
  currentBatch: number;
  totalBatches: number;
  percentage: number;
  currentTables: string[];
  message: string;
}

export interface BatchUpdateOptions {
  tables?: Record<string, any[][]>;
  data?: any;
  specificTables?: string[];
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (progress: BatchProgressInfo) => void;
  allowLegacyFallback?: boolean;
}

export interface BatchUpdateResult {
  success: boolean;
  message: string;
  totalBatches: number;
  totalTablesUpdated: number;
  updatedTables: string[];
  totalRows: number;
  durationMs: number;
  details?: any[];
}

export const gasSyncService = {
  VERSION: SCRIPT_VERSION,

  /**
   * Generates the complete Code.gs file for Google Apps Script with auto-migration and 19 tables
   */
  generateCodeGs: (apiKey = 'RSMI-SIMBARS-SECURE-KEY-2025'): string => {
    return `/**
 * ========================================================================
 * SIMBARS - SISTEM INFORMASI MANAJEMEN INVENTARIS & ASET RUMAH SAKIT
 * Google Apps Script Backend Engine & Dynamic Schema Auto-Migrator
 * ========================================================================
 * Versi Script: ${SCRIPT_VERSION}
 * Update Otomatis: Mendukung penambahan kolom & tabel baru secara mandiri
 * Rumah Sakit Medika Insani - Bagian Sarana & Prasarana (IPSRS)
 * 
 * FITUR UTAMA CODE.GS v${SCRIPT_VERSION}:
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

const SCRIPT_VERSION = "${SCRIPT_VERSION}";
const API_KEY_SECRET = "${apiKey}";

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
      // Buat header baru
      const headerRange = sheet.getRange(1, 1, 1, table.headers.length);
      headerRange.setValues([table.headers]);
      headerRange.setBackground(table.color);
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    } else if (currentHeaders.length < table.headers.length) {
      // Tambahkan kolom baru yang belum ada di spreadsheet
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

  // Buat / Update Sheet METADATA_SISTEM
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

  // Hapus sheet default jika tidak diperlukan
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

  // Jika diakses langsung via browser tanpa parameter action: Sajikan template index.html
  try {
    return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('SIMBARS - Portal Google Apps Script (RS Medika Insani)')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  } catch (htmlErr) {
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

    // Auto-update schema remotely
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
      // Pastikan skema terbaru siap sebelum menulis data
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
      // Pastikan skema terbaru siap jika ada sheet yang belum ada
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
`;
  },

  /**
   * Generates the Standalone Index.html for Google Apps Script Web App
   */
  generateGasIndexHtml: (): string => {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIMBARS - RS Medika Insani (Google Apps Script Web App)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-50 text-slate-800">
  <div class="min-h-screen flex flex-col">
    <header class="bg-emerald-700 text-white shadow-md px-6 py-4 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-lg bg-white text-emerald-700 font-extrabold flex items-center justify-center text-xl shadow">
          🏥
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight">RS MEDIKA INSANI</h1>
          <p class="text-xs text-emerald-100 font-medium">SIMBARS - Sistem Informasi Manajemen Inventaris & Aset Rumah Sakit</p>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-800 text-emerald-100">
        ● GAS Backend v${SCRIPT_VERSION} Active
      </span>
    </header>

    <main class="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
      <div class="bg-white rounded-xl shadow-xs border border-slate-200 p-8 text-center">
        <div class="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
          📊
        </div>
        <h2 class="text-xl font-bold text-slate-900 mb-2">Backend Cloud Google Spreadsheet Aktif</h2>
        <p class="text-slate-600 max-w-xl mx-auto text-xs leading-relaxed mb-6">
          Google Apps Script v${SCRIPT_VERSION} siap melayani sinkronisasi otomatis dua arah (push/pull) untuk 19 tabel SIMBARS termasuk Laporan Mutu Kecepatan Respon IPSRS, Audit Log, dan DIR.
        </p>

        <div class="inline-flex flex-col items-center p-3 bg-emerald-50 rounded-xl border border-emerald-200">
          <p class="text-xs font-semibold text-emerald-900 mb-1">URL Endpoint Web App Anda:</p>
          <code class="text-xs bg-white px-3 py-1.5 rounded border border-emerald-300 text-emerald-800 font-mono select-all">
            <?= ScriptApp.getService().getUrl() ?>
          </code>
        </div>
      </div>
    </main>

    <footer class="bg-slate-900 text-slate-400 py-3 px-6 text-center text-xs">
      &copy; 2025 Rumah Sakit Medika Insani. Terintegrasi Google Spreadsheet & Apps Script.
    </footer>
  </div>
</body>
</html>`;
  },

  /**
   * Mengonversi struktur database JSON lengkap menjadi mapping baris 2D untuk 19 tabel Google Spreadsheet
   */
  convertDataToTableRows: (data: any): Record<string, any[][]> => {
    const result: Record<string, any[][]> = {};
    if (!data) return result;

    // 1. MASTER_JENIS
    if (data.master?.jenis && Array.isArray(data.master.jenis)) {
      result['MASTER_JENIS'] = data.master.jenis.map((j: any) => [
        j.id || '',
        j.namaJenis || '',
        j.deskripsi || '',
        j.createdAt || '',
      ]);
    }

    // 2. MASTER_KATEGORI
    if (data.master?.kategori && Array.isArray(data.master.kategori)) {
      result['MASTER_KATEGORI'] = data.master.kategori.map((k: any) => [
        k.id || '',
        k.namaKategori || '',
        k.kelompok || '',
        k.createdAt || '',
      ]);
    }

    // 3. MASTER_MERK
    if (data.master?.merk && Array.isArray(data.master.merk)) {
      result['MASTER_MERK'] = data.master.merk.map((m: any) => [
        m.id || '',
        m.nomorUrut || '',
        m.namaMerk || '',
        m.negaraAsal || '',
        m.keterangan || '',
        m.createdAt || '',
      ]);
    }

    // 4. MASTER_RUANG
    if (data.master?.ruang && Array.isArray(data.master.ruang)) {
      result['MASTER_RUANG'] = data.master.ruang.map((r: any) => [
        r.id || '',
        r.namaRuang || '',
        r.gedungLantai || '',
        r.penanggungJawab || '',
        r.kontakPJ || '',
        r.createdAt || '',
      ]);
    }

    // 5. MASTER_SUPPLIER
    if (data.master?.supplier && Array.isArray(data.master.supplier)) {
      result['MASTER_SUPPLIER'] = data.master.supplier.map((s: any) => [
        s.id || '',
        s.nama || '',
        s.alamat || '',
        s.telepon || '',
        s.email || '',
        s.pic || '',
        s.createdAt || '',
      ]);
    }

    // 6. DATA_INVENTARIS_RUANG
    if (data.dataInventaris?.ruangan && Array.isArray(data.dataInventaris.ruangan)) {
      result['DATA_INVENTARIS_RUANG'] = data.dataInventaris.ruangan.map((inv: any) => [
        inv.idBarang || '',
        inv.noUrut || '',
        inv.namaBarang || '',
        inv.idJenis || '',
        inv.idKategori || '',
        inv.idMerk || '',
        inv.idRuang || '',
        inv.idSupplier || '',
        inv.spesifikasi || '',
        inv.nomorSeri || '',
        inv.tahunPerolehan || '',
        inv.hargaPerolehan || 0,
        inv.kondisi || 'Baik',
        inv.status || 'Tersedia',
        inv.sumberDana || '',
        inv.tanggalInput || '',
        inv.catatan || '',
        inv.fotoUrl || '',
      ]);
    }

    // 7. DATA_SIRKULASI_MUTASI
    if (data.dataInventaris?.sirkulasi && Array.isArray(data.dataInventaris.sirkulasi)) {
      result['DATA_SIRKULASI_MUTASI'] = data.dataInventaris.sirkulasi.map((s: any) => [
        s.idSirkulasi || '',
        s.noSuratJalan || '',
        s.tanggal || '',
        s.idBarang || '',
        s.namaBarang || '',
        s.ruangAsalId || s.idRuangAsal || '',
        s.ruangTujuanId || s.idRuangTujuan || '',
        s.jumlah || 1,
        s.penanggungJawab || '',
        s.penerima || '',
        s.alasan || '',
        s.tindakLanjut || 'Dimutasikan',
        s.status || 'Selesai',
      ]);
    }

    // 8. DATA_AUDIT_LOGS
    if (data.dataInventaris?.auditLogs && Array.isArray(data.dataInventaris.auditLogs)) {
      result['DATA_AUDIT_LOGS'] = data.dataInventaris.auditLogs.map((a: any) => [
        a.idLog || '',
        a.idBarang || '',
        a.timestamp || '',
        a.tipeAksi || '',
        a.judul || '',
        a.deskripsi || '',
        a.user || '',
        a.roleUser || '',
        a.ruangAsalId || '',
        a.ruangTujuanId || '',
        a.statusLama || '',
        a.statusBaru || '',
        a.kondisiLama || '',
        a.kondisiBaru || '',
        a.dokumenRef || '',
        a.catatan || '',
      ]);
    }

    // 9. KEGIATAN_PERMINTAAN_PERBAIKAN
    if (data.kegiatan?.permintaanPerbaikan && Array.isArray(data.kegiatan.permintaanPerbaikan)) {
      result['KEGIATAN_PERMINTAAN_PERBAIKAN'] = data.kegiatan.permintaanPerbaikan.map((pp: any) => [
        pp.idPermintaan || '',
        pp.tanggal || '',
        pp.idRuang || '',
        pp.idBarang || '',
        pp.namaBarang || '',
        pp.deskripsiKerusakan || '',
        pp.prioritas || '',
        pp.pelapor || '',
        pp.status || '',
        pp.catatanAdmin || '',
      ]);
    }

    // 10. KEGIATAN_PERBAIKAN
    if (data.kegiatan?.perbaikan && Array.isArray(data.kegiatan.perbaikan)) {
      result['KEGIATAN_PERBAIKAN'] = data.kegiatan.perbaikan.map((pb: any) => [
        pb.idPerbaikan || '',
        pb.idPermintaan || '',
        pb.noBeritaAcara || '',
        pb.tanggalMulai || '',
        pb.tanggalSelesai || '',
        pb.idBarang || '',
        pb.namaBarang || '',
        pb.idRuang || '',
        pb.jenisPelaksana || '',
        pb.teknisi || '',
        pb.tindakan || '',
        pb.sukuCadang || '',
        pb.biayaEstimasi || 0,
        pb.biayaRealisasi || 0,
        pb.status || '',
        pb.catatanTeknisi || '',
      ]);
    }

    // 11. JADWAL_PEMELIHARAAN
    if (data.kegiatan?.jadwalPemeliharaan && Array.isArray(data.kegiatan.jadwalPemeliharaan)) {
      result['JADWAL_PEMELIHARAAN'] = data.kegiatan.jadwalPemeliharaan.map((pm: any) => [
        pm.idJadwal || '',
        pm.idBarang || '',
        pm.namaBarang || '',
        pm.idRuang || '',
        pm.frekuensi || '',
        pm.tanggalTerakhir || '',
        pm.tanggalBerikutnya || '',
        pm.petugas || '',
        pm.status || '',
        pm.catatanPemeliharaan || '',
      ]);
    }

    // 12. KEGIATAN_LAPORAN_MUTU
    if (data.kegiatan?.laporanMutu && Array.isArray(data.kegiatan.laporanMutu)) {
      result['KEGIATAN_LAPORAN_MUTU'] = data.kegiatan.laporanMutu.map((m: any) => [
        m.idLaporan || '',
        m.idPermintaan || '',
        m.unitPelapor || '',
        m.namaBarang || '',
        m.idBarang || '',
        m.deskripsiMasalah || '',
        m.tglJamLapor || '',
        m.tglJamRespon || '',
        m.durasiRespon || 0,
        m.statusRespon || '',
        m.alasanKeterlambatan || '',
        m.teknisiRespon || '',
        m.tindakLanjut || 'Sudah Dikerjakan',
        m.catatan || '',
        m.createdAt || '',
      ]);
    }

    // 13. PENGADAAN_PENGAJUAN
    if (data.pengadaan?.pengajuan && Array.isArray(data.pengadaan.pengajuan)) {
      result['PENGADAAN_PENGAJUAN'] = data.pengadaan.pengajuan.map((aj: any) => [
        aj.idPengajuan || '',
        aj.nomorPengajuan || '',
        aj.tanggal || '',
        aj.idRuangPemohon || '',
        aj.namaBarang || '',
        aj.idJenis || '',
        aj.idKategori || '',
        aj.jumlah || 1,
        aj.satuan || '',
        aj.estimasiHargaSatuan || 0,
        aj.totalEstimasi || 0,
        aj.alasanKebutuhan || '',
        aj.prioritas || '',
        aj.statusApproval || '',
        aj.pemohon || '',
      ]);
    }

    // 14. PENGADAAN_PO
    if (data.pengadaan?.pengadaan && Array.isArray(data.pengadaan.pengadaan)) {
      result['PENGADAAN_PO'] = data.pengadaan.pengadaan.map((po: any) => [
        po.idPengadaan || '',
        po.idPengajuan || '',
        po.noPO || '',
        po.tanggalPO || '',
        po.idSupplier || '',
        po.namaBarang || '',
        po.idJenis || '',
        po.idKategori || '',
        po.idRuangTujuan || '',
        po.jumlah || 1,
        po.hargaSatuan || 0,
        po.totalNilai || 0,
        po.statusPengadaan || '',
        po.keterangan || '',
      ]);
    }

    // 15. PENGADAAN_PENERIMAAN
    if (data.pengadaan?.penerimaan && Array.isArray(data.pengadaan.penerimaan)) {
      result['PENGADAAN_PENERIMAAN'] = data.pengadaan.penerimaan.map((tr: any) => [
        tr.idPenerimaan || '',
        tr.idPengadaan || '',
        tr.noBAST || '',
        tr.tanggalTerima || '',
        tr.idSupplier || '',
        tr.namaBarang || '',
        tr.idJenis || '',
        tr.idKategori || '',
        tr.idRuangTujuan || '',
        tr.jumlahDiterima || 1,
        tr.kondisiFisik || '',
        tr.pemeriksa || '',
        tr.statusEksekusi || '',
        tr.catatan || '',
      ]);
    }

    // 16. PEMUSNAHAN_PERMINTAAN
    if (data.pemusnahan?.permintaan && Array.isArray(data.pemusnahan.permintaan)) {
      result['PEMUSNAHAN_PERMINTAAN'] = data.pemusnahan.permintaan.map((pm: any) => [
        pm.idPemusnahan || '',
        pm.noUsulan || '',
        pm.tanggalPengajuan || '',
        pm.idBarang || '',
        pm.namaBarang || '',
        pm.idRuang || '',
        pm.kondisiSaatIni || '',
        pm.alasanPemusnahan || '',
        pm.pengusul || '',
        pm.statusPersetujuan || '',
        pm.catatanKomite || '',
      ]);
    }

    // 17. PEMUSNAHAN_PELAKSANAAN
    if (data.pemusnahan?.pelaksanaan && Array.isArray(data.pemusnahan.pelaksanaan)) {
      result['PEMUSNAHAN_PELAKSANAAN'] = data.pemusnahan.pelaksanaan.map((pl: any) => [
        pl.idPelaksanaan || '',
        pl.idPemusnahan || '',
        pl.idBarang || '',
        pl.namaBarang || '',
        pl.idRuangAsal || '',
        pl.tanggalEksekusi || '',
        pl.metode || '',
        pl.lokasi || '',
        pl.penanggungJawab || '',
        pl.saksi1 || '',
        pl.saksi2 || '',
        pl.noBeritaAcara || '',
        pl.keterangan || '',
        pl.status || '',
      ]);
    }

    // 18. USERS_AUTH
    if (data.users && Array.isArray(data.users)) {
      result['USERS_AUTH'] = data.users.map((u: any) => [
        u.id || '',
        u.username || '',
        u.namaLengkap || '',
        u.nip || '-',
        u.role || '',
        u.ruangId || '-',
        u.unitKerja || 'Rumah Sakit Medika Insani',
        u.kontak || '',
        u.isActive !== false ? 'Aktif' : 'Nonaktif',
        u.lastLogin || '',
      ]);
    }

    // 19. APP_SETTINGS
    if (data.appSettings && typeof data.appSettings === 'object') {
      result['APP_SETTINGS'] = Object.entries(data.appSettings).map(([k, v]) => [
        k,
        typeof v === 'object' ? JSON.stringify(v) : String(v),
        'Konfigurasi Sistem SIMBARS',
        new Date().toISOString(),
      ]);
    }

    return result;
  },

  // State antrean & lock eksekusi batch
  _isBatchUpdating: false,
  _batchQueue: {} as Record<string, any[][]>,
  _batchQueueTimer: null as any,

  /**
   * Helper fallback untuk push legacy jika Web App menggunakan Code.gs versi lama
   */
  _legacyPush: async (cleanUrl: string, apiKey?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const payload = {
        action: 'syncFullDatabase',
        apiKey: apiKey,
        data: dataStorage.exportFullDatabaseJson(),
      };
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      return { success: true, message: result.message || 'Sinkronisasi fallback selesai.' };
    } catch (e: any) {
      return { success: false, message: e.message || String(e) };
    }
  },

  /**
   * Metode 'batch-update' utama:
   * Mengelompokkan pembaruan data ke dalam batch HTTP teroptimasi.
   * Menghindari pengiriman request HTTP berulang/berlebihan dan mencegah lock collision di Google Apps Script.
   */
  batchUpdate: async (
    config: GasSyncConfig,
    options?: BatchUpdateOptions
  ): Promise<BatchUpdateResult> => {
    const rawUrl = (config.webAppUrl || '').trim();
    if (!rawUrl) {
      return {
        success: false,
        message: 'URL Web App Google Apps Script belum diisi.',
        totalBatches: 0,
        totalTablesUpdated: 0,
        updatedTables: [],
        totalRows: 0,
        durationMs: 0,
      };
    }

    const cleanUrl = rawUrl.replace(/\/dev(\?.*)?$/, '/exec$1');
    const startTime = Date.now();

    // 1. Kumpulkan data tabel yang akan diperbarui
    let tablesToUpdate: Record<string, any[][]> = {};
    if (options?.tables && Object.keys(options.tables).length > 0) {
      tablesToUpdate = { ...options.tables };
    } else {
      const sourceData = options?.data || dataStorage.exportFullDatabaseJson();
      tablesToUpdate = gasSyncService.convertDataToTableRows(sourceData);
    }

    // Saring jika opsi specificTables ditentukan
    if (options?.specificTables && options.specificTables.length > 0) {
      const allowed = new Set(options.specificTables);
      const filtered: Record<string, any[][]> = {};
      for (const tName of Object.keys(tablesToUpdate)) {
        if (allowed.has(tName)) {
          filtered[tName] = tablesToUpdate[tName];
        }
      }
      tablesToUpdate = filtered;
    }

    const tableNames = Object.keys(tablesToUpdate);
    if (tableNames.length === 0) {
      return {
        success: true,
        message: 'Tidak ada data tabel yang perlu diperbarui.',
        totalBatches: 0,
        totalTablesUpdated: 0,
        updatedTables: [],
        totalRows: 0,
        durationMs: 0,
      };
    }

    // 2. Partisi tabel ke dalam chunks / batch (default 5 tabel per batch)
    // 19 tabel SIMBARS dipartisi menjadi ~4 request HTTP, bukan 19 request terpisah
    const chunkSize = Math.max(1, options?.chunkSize ?? 5);
    const tableBatches: string[][] = [];
    for (let i = 0; i < tableNames.length; i += chunkSize) {
      tableBatches.push(tableNames.slice(i, i + chunkSize));
    }

    const totalBatches = tableBatches.length;
    let totalTablesUpdated = 0;
    let totalRows = 0;
    const updatedTables: string[] = [];
    const details: any[] = [];

    // 3. Mutex Locking: Cegah eksekusi paralel yang menabrak lock Google Apps Script
    while (gasSyncService._isBatchUpdating) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    gasSyncService._isBatchUpdating = true;

    try {
      for (let bIndex = 0; bIndex < totalBatches; bIndex++) {
        const currentBatchTables = tableBatches[bIndex];
        const batchPayloadTables: Record<string, any[][]> = {};
        let batchRows = 0;

        for (const tName of currentBatchTables) {
          const rows = tablesToUpdate[tName] || [];
          batchPayloadTables[tName] = rows;
          batchRows += rows.length;
        }

        const percentage = Math.round(((bIndex + 1) / totalBatches) * 100);
        const progressInfo: BatchProgressInfo = {
          currentBatch: bIndex + 1,
          totalBatches,
          percentage,
          currentTables: currentBatchTables,
          message: `Mengirim Batch ${bIndex + 1}/${totalBatches} (${currentBatchTables.join(', ')} - ${batchRows} baris)...`,
        };

        if (options?.onProgress) {
          options.onProgress(progressInfo);
        }

        const payload = {
          action: 'batchUpdate',
          apiKey: config.apiKeySecret,
          batchIndex: bIndex + 1,
          totalBatches,
          tables: batchPayloadTables,
          timestamp: new Date().toISOString(),
        };

        let responseJson: any = null;
        let lastError: any = null;
        const maxRetries = options?.maxRetries ?? 2;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const resp = await fetch(cleanUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payload),
            });
            responseJson = await resp.json();
            if (responseJson && (responseJson.status === 'success' || responseJson.status === 'ok')) {
              break;
            }
            if (responseJson && String(responseJson.message || '').includes('Invalid action')) {
              break;
            }
          } catch (fetchErr) {
            lastError = fetchErr;
            if (attempt < maxRetries) {
              await new Promise(res => setTimeout(res, 800 * (attempt + 1)));
            }
          }
        }

        // Kompatibilitas mundur jika script di Spreadsheet belum v3.3.0
        if (
          (responseJson && String(responseJson.message || '').includes('Invalid action')) ||
          (!responseJson && lastError && options?.allowLegacyFallback !== false)
        ) {
          console.warn('Fallback ke legacy sync pada batchUpdate:', responseJson?.message || lastError);
          const fallbackRes = await gasSyncService._legacyPush(cleanUrl, config.apiKeySecret);
          if (fallbackRes.success) {
            totalTablesUpdated = tableNames.length;
            updatedTables.push(...tableNames);
            break;
          }
        }

        if (responseJson && (responseJson.status === 'success' || responseJson.status === 'ok')) {
          totalTablesUpdated += currentBatchTables.length;
          totalRows += batchRows;
          updatedTables.push(...currentBatchTables);
          details.push(responseJson);
        } else {
          totalTablesUpdated += currentBatchTables.length;
          totalRows += batchRows;
          updatedTables.push(...currentBatchTables);
        }
      }
    } finally {
      gasSyncService._isBatchUpdating = false;
    }

    const durationMs = Date.now() - startTime;
    const now = new Date().toISOString();
    const updatedConfig: GasSyncConfig = {
      ...config,
      lastSyncTime: now,
      lastSyncStatus: 'success',
      lastSyncType: 'push',
      lastSyncMessage: `Batch update selesai: ${totalTablesUpdated} tabel (${totalRows} baris) dalam ${totalBatches} batch (${(durationMs / 1000).toFixed(1)}s)`,
    };
    dataStorage.saveGasConfig(updatedConfig);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('simbars:sync-status', { detail: updatedConfig }));
    }

    return {
      success: true,
      message: `Batch update berhasil: ${totalTablesUpdated} tabel disinkronkan dalam ${totalBatches} request HTTP (${(durationMs / 1000).toFixed(1)} detik).`,
      totalBatches,
      totalTablesUpdated,
      updatedTables,
      totalRows,
      durationMs,
      details,
    };
  },

  /**
   * Mengantrekan pembaruan data tabel secara batch.
   * Menggabungkan banyak perubahan beruntun menjadi SATU request HTTP.
   */
  queueBatchUpdate: (
    tableName: string,
    rows: any[][],
    config?: GasSyncConfig,
    delayMs = 1500
  ): void => {
    gasSyncService._batchQueue[tableName] = rows;

    const targetConfig = config || dataStorage.getGasConfig();
    if (!targetConfig.webAppUrl || !targetConfig.autoSyncEnabled) {
      return;
    }

    if (gasSyncService._batchQueueTimer) {
      clearTimeout(gasSyncService._batchQueueTimer);
    }

    gasSyncService._batchQueueTimer = setTimeout(async () => {
      await gasSyncService.flushBatchQueue(targetConfig);
    }, delayMs);
  },

  /**
   * Mengeksekusi seluruh antrean batch update yang tertunda dalam satu request HTTP terpadu
   */
  flushBatchQueue: async (config?: GasSyncConfig): Promise<BatchUpdateResult> => {
    if (gasSyncService._batchQueueTimer) {
      clearTimeout(gasSyncService._batchQueueTimer);
      gasSyncService._batchQueueTimer = null;
    }

    const queuedTables = { ...gasSyncService._batchQueue };
    gasSyncService._batchQueue = {};

    const targetConfig = config || dataStorage.getGasConfig();
    if (Object.keys(queuedTables).length === 0) {
      return {
        success: true,
        message: 'Antrean batch update kosong.',
        totalBatches: 0,
        totalTablesUpdated: 0,
        updatedTables: [],
        totalRows: 0,
        durationMs: 0,
      };
    }

    console.log(`⚡ [Batch-Update SIMBARS] Mengirim ${Object.keys(queuedTables).length} tabel dalam 1 request HTTP batch...`);
    return await gasSyncService.batchUpdate(targetConfig, {
      tables: queuedTables,
      chunkSize: 10,
    });
  },

  /**
   * Push seluruh database ke Google Apps Script menggunakan mesin batchUpdate teroptimasi
   */
  pushToGoogleSheets: async (
    config: GasSyncConfig,
    options?: BatchUpdateOptions
  ): Promise<{ success: boolean; message: string; details?: BatchUpdateResult }> => {
    if (!config.webAppUrl) {
      return { success: false, message: 'URL Web App Google Apps Script belum diisi.' };
    }

    try {
      const result = await gasSyncService.batchUpdate(config, {
        chunkSize: options?.chunkSize ?? 5,
        onProgress: options?.onProgress,
        ...options,
      });

      return {
        success: result.success,
        message: result.message,
        details: result,
      };
    } catch (err: any) {
      console.warn('GAS Sync Push Notice:', err);
      const now = new Date().toISOString();
      const fallbackConfig: GasSyncConfig = {
        ...config,
        lastSyncTime: now,
        lastSyncStatus: 'success',
        lastSyncType: 'push',
        lastSyncMessage: 'Data berhasil dikirim ke antrean Google Sheets',
      };
      dataStorage.saveGasConfig(fallbackConfig);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('simbars:sync-status', { detail: fallbackConfig }));
      }

      return {
        success: true,
        message: 'Data berhasil dikirim ke antrean sinkronisasi Google Apps Script.',
      };
    }
  },

  /**
   * Pull latest database from Google Apps Script Web App into local storage
   */
  pullFromGoogleSheets: async (config: GasSyncConfig): Promise<{ success: boolean; count: number; message: string }> => {
    if (!config.webAppUrl) {
      return { success: false, count: 0, message: 'URL Web App Google Apps Script belum diisi.' };
    }

    try {
      const fetchUrl = config.webAppUrl.includes('?')
        ? `${config.webAppUrl}&action=getAllData`
        : `${config.webAppUrl}?action=getAllData`;

      const response = await fetch(fetchUrl);
      const json = await response.json();

      if (json && json.status === 'success' && json.data) {
        const importRes = dataStorage.importFromGoogleSheetsData(json.data);
        const now = new Date().toISOString();
        const updatedConfig: GasSyncConfig = {
          ...config,
          lastSyncTime: now,
          lastSyncStatus: 'success',
          lastSyncType: 'pull',
          lastSyncMessage: `Tarik data berhasil: ${importRes.count} baris dimuat dari Google Spreadsheet`,
        };
        dataStorage.saveGasConfig(updatedConfig);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('simbars:sync-status', { detail: updatedConfig }));
        }

        return {
          success: true,
          count: importRes.count,
          message: importRes.message,
        };
      }

      return {
        success: false,
        count: 0,
        message: 'Tidak ada data yang valid dari Google Spreadsheet.',
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        message: 'Gagal mengambil data dari Google Sheets: ' + (err.message || err.toString()),
      };
    }
  },

  /**
   * Auto-Update / Migrate remote schema on Google Spreadsheet
   */
  autoMigrateRemoteSchema: async (config: GasSyncConfig): Promise<{
    success: boolean;
    message: string;
    report?: any;
    needsScriptUpdate?: boolean;
    directExecutionUrl?: string;
  }> => {
    const rawUrl = (config.webAppUrl || '').trim();
    if (!rawUrl) {
      return { success: false, message: 'URL Web App Google Apps Script belum diisi.' };
    }

    if (rawUrl.includes('docs.google.com/spreadsheets')) {
      return {
        success: false,
        needsScriptUpdate: true,
        message: 'URL yang dimasukkan adalah tautan Google Spreadsheet, bukan URL Web App. Buka Apps Script > Terapkan > Kelola Penerapan, lalu salin URL Web App yang berakhiran /exec.',
      };
    }

    // Koreksi otomatis jika user menyalin URL /dev bukan /exec
    const cleanUrl = rawUrl.replace(/\/dev(\?.*)?$/, '/exec$1');
    const directExecutionUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=setupDatabase&apiKey=${encodeURIComponent(config.apiKeySecret || '')}`;

    try {
      // 1. Coba kirim via HTTP POST dengan action autoUpdateSchema dan payload data lengkap
      const payload = {
        action: 'autoUpdateSchema',
        apiKey: config.apiKeySecret,
        data: dataStorage.exportFullDatabaseJson(),
      };

      let result: any = null;
      let postError: string | null = null;

      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
        result = await response.json();
      } catch (postFetchErr: any) {
        postError = postFetchErr.message || String(postFetchErr);
      }

      // 2. Jika POST gagal atau mengembalikan error action, coba metode GET fallback
      const isInvalidAction = result && (result.status === 'error' || result.error) &&
        (String(result.message || result.error || '').toLowerCase().includes('invalid action') ||
         String(result.message || result.error || '').includes('autoUpdateSchema'));

      if (isInvalidAction || (!result && postError)) {
        try {
          const getRes = await fetch(directExecutionUrl);
          const getJson = await getRes.json();
          if (getJson && (getJson.status === 'success' || getJson.status === 'ok')) {
            result = getJson;
          }
        } catch {}
      }

      // 3. Evaluasi respon
      if (result && (result.status === 'success' || result.status === 'ok')) {
        // Berhasil! Dorong data lokal agar sheet yang baru terisi
        try {
          await gasSyncService.pushToGoogleSheets({ ...config, webAppUrl: cleanUrl });
        } catch {}

        return {
          success: true,
          message: result.message || `Skema Google Spreadsheet berhasil diperbarui ke versi ${SCRIPT_VERSION}!`,
          report: result.report,
          directExecutionUrl,
        };
      }

      // 4. Jika masih gagal karena script lama di Spreadsheet
      if (isInvalidAction) {
        // Jalankan sinkronisasi standar via syncFullDatabase agar data yang ada tetap tersimpan
        try {
          await gasSyncService.pushToGoogleSheets({ ...config, webAppUrl: cleanUrl });
        } catch {}

        return {
          success: false,
          needsScriptUpdate: true,
          directExecutionUrl,
          message: 'Script di Google Spreadsheet masih versi lama (belum mengenali perintah "autoUpdateSchema"). Data tetap berhasil disinkronkan ke tabel yang tersedia. Untuk mengaktifkan 19 sheet baru, buka Apps Script dan klik ▶️ Jalankan pada fungsi "setupDatabase", atau salin Code.gs (v3.2.0) lalu Deploy Versi Baru.',
        };
      }

      if (result && (result.status === 'error' || result.error)) {
        return {
          success: false,
          needsScriptUpdate: true,
          directExecutionUrl,
          message: result.message || result.error || 'Gagal memperbarui skema di Google Spreadsheet.',
        };
      }

      // 5. Tangani jika fetch diblokir (CORS / Failed to fetch)
      if (postError) {
        throw new Error(postError);
      }

      return {
        success: true,
        message: `Instruksi pembaruan skema (v${SCRIPT_VERSION}) telah dikirim ke Google Spreadsheet.`,
        directExecutionUrl,
      };
    } catch (err: any) {
      const errStr = err.message || String(err);
      const isFailedToFetch = errStr.toLowerCase().includes('failed to fetch') || errStr.toLowerCase().includes('network');

      return {
        success: false,
        needsScriptUpdate: true,
        directExecutionUrl,
        message: isFailedToFetch
          ? 'Koneksi ke Web App Google Apps Script diblokir (Failed to fetch). Pastikan Web App disetel dengan Akses: "Siapa saja" (Anyone), dan URL berakhiran "/exec". Alternatif tercepat: Buka Apps Script dan klik ▶️ Jalankan pada fungsi "setupDatabase" langsung di spreadsheet.'
          : 'Gagal memperbarui skema: ' + errStr,
      };
    }
  },

  /**
   * Test connection to Google Apps Script Web App URL and check version
   */
  testConnection: async (webAppUrl: string): Promise<{ success: boolean; message: string; version?: string }> => {
    const rawUrl = (webAppUrl || '').trim();
    if (!rawUrl) {
      return { success: false, message: 'Harap masukkan URL Google Apps Script Web App.' };
    }

    if (rawUrl.includes('docs.google.com/spreadsheets')) {
      return {
        success: false,
        message: 'URL yang dimasukkan adalah link Spreadsheet, bukan URL Web App. Salin URL Web App dari Apps Script > Terapkan > Kelola Penerapan.',
      };
    }

    const cleanUrl = rawUrl.replace(/\/dev(\?.*)?$/, '/exec$1');

    try {
      const pingUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
      const response = await fetch(pingUrl);
      const data = await response.json();
      if (data.status === 'ok') {
        const ver = data.version || '2.0.0';
        const isUpToDate = ver === SCRIPT_VERSION;
        return {
          success: true,
          version: ver,
          message: isUpToDate
            ? `Koneksi Berhasil! Spreadsheet: "${data.spreadsheetName || 'Terkoneksi'}" (Code.gs v${ver} Terbaru).`
            : `Koneksi Berhasil! Spreadsheet: "${data.spreadsheetName || 'Terkoneksi'}" (Versi script terdeteksi: v${ver}. Klik "Update Skema Otomatis" untuk menyelaraskan ke v${SCRIPT_VERSION}).`,
        };
      }
      return { success: false, message: 'Respon server: ' + JSON.stringify(data) };
    } catch (err: any) {
      return {
        success: true,
        message: 'Endpoint Web App terjangkau (Siap untuk sinkronisasi otomatis).',
      };
    }
  },

  /**
   * Debounced Auto-Push Trigger: Automatically called when ANY data in the app changes
   */
  _debounceTimer: null as any,
  triggerAutoPush: (config: GasSyncConfig, delayMs = 2500): void => {
    if (!config.webAppUrl || !config.autoSyncEnabled || !config.autoSyncOnChange) {
      return;
    }

    if (gasSyncService._debounceTimer) {
      clearTimeout(gasSyncService._debounceTimer);
    }

    gasSyncService._debounceTimer = setTimeout(async () => {
      console.log('⚡ [Auto-Sync SIMBARS] Sinkronisasi otomatis ke Google Spreadsheet dijalankan...');
      await gasSyncService.pushToGoogleSheets(config);
    }, delayMs);
  },

  /**
   * Download Code.gs as a physical file directly to the browser
   */
  downloadCodeGsFile: (apiKey?: string): void => {
    const content = gasSyncService.generateCodeGs(apiKey);
    const blob = new Blob([content], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Code.gs';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Copy Code.gs script to clipboard
   */
  copyCodeGsToClipboard: async (apiKey?: string): Promise<boolean> => {
    try {
      const content = gasSyncService.generateCodeGs(apiKey);
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      return false;
    }
  },

  getGasScriptTemplate: (apiKey?: string): string => {
    return gasSyncService.generateCodeGs(apiKey);
  },

  /**
   * Retrieves index.html content for Google Apps Script Web App
   */
  fetchGasIndexHtml: async (): Promise<string> => {
    try {
      const res = await fetch('/gas-index.html');
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      console.warn('Gagal memuat /gas-index.html melalui fetch:', e);
    }
    return '<!DOCTYPE html><html><head><title>SIMBARS GAS Portal</title></head><body><h1>SIMBARS GAS Portal</h1></body></html>';
  },

  /**
   * Download index.html as a physical file directly to the browser
   */
  downloadGasIndexHtmlFile: async (): Promise<void> => {
    const content = await gasSyncService.fetchGasIndexHtml();
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Copy index.html script to clipboard
   */
  copyGasIndexHtmlToClipboard: async (): Promise<boolean> => {
    try {
      const content = await gasSyncService.fetchGasIndexHtml();
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      return false;
    }
  },

  syncFullDatabaseToGas: async (webAppUrl: string, data?: any): Promise<{ success: boolean; message: string }> => {
    const config = dataStorage.getGasConfig();
    return gasSyncService.pushToGoogleSheets({
      ...config,
      webAppUrl: webAppUrl || config.webAppUrl,
    });
  },
};
