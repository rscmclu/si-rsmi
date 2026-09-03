import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  QrCode, 
  Sparkles, 
  Search, 
  Copy,
  Database
} from 'lucide-react';
import { gasSyncService } from '../services/gasSyncService';

export const PetunjukPenggunaanView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gasSyncService.getGasScriptTemplate());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const sections = [
    {
      id: 'flow',
      title: '1. Siklus Lengkap Manajemen Inventaris RS Medika Insani',
      icon: <Sparkles className="w-4 h-4 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 leading-relaxed text-xs">
            Sistem dirancang mengadopsi <b>Standar Akreditasi Rumah Sakit (STARKES)</b> dan SOP Pengelolaan Barang Milik Rumah Sakit (BMRS). Alur data mengalir secara otomatis tanpa perlu input manual berulang:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-blue-700 block text-xs">Tahap 1: Pengadaan</span>
              <p className="text-slate-600 mt-1 text-[11px]">Pengajuan Ruangan &rarr; PO Pengadaan &rarr; BAST Penerimaan Barang.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-blue-700 block text-xs">Tahap 2: Registrasi DIR</span>
              <p className="text-slate-600 mt-1 text-[11px]">Tombol <b>+ Masukkan ke DIR</b> otomatis membuat ID Barang & QR Code.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-blue-700 block text-xs">Tahap 3: Operasional</span>
              <p className="text-slate-600 mt-1 text-[11px]">Mutasi Sirkulasi antar ruang, Perbaikan IPSRS, dan Kalibrasi berkala.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-blue-700 block text-xs">Tahap 4: Penghapusan</span>
              <p className="text-slate-600 mt-1 text-[11px]">Usulan afkir &rarr; Eksekusi &rarr; Update status DIR menjadi Dimusnahkan.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'id-formula',
      title: '2. Rumus Kode ID Otomatis & QR Code Identitas Barang',
      icon: <QrCode className="w-4 h-4 text-blue-600" />,
      content: (
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Setiap alat medis dan barang inventaris di RS Medika Insani memiliki <b>Nomor Identitas Tunggal (Unique Asset ID)</b> yang dirangkai otomatis dari kode master:
          </p>
          
          {/* Visual Formula Diagram */}
          <div className="p-3.5 rounded-lg bg-slate-900 text-white font-mono text-center flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-blue-600 font-semibold">[ID Jenis]</span>
            <span>-</span>
            <span className="px-2 py-0.5 rounded bg-slate-700 font-semibold">[ID Kategori]</span>
            <span>-</span>
            <span className="px-2 py-0.5 rounded bg-slate-700 font-semibold">[ID Ruang]</span>
            <span>-</span>
            <span className="px-2 py-0.5 rounded bg-amber-600 font-semibold">[No Urut]</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-800">Contoh Kasus 1: Defibrillator di IGD</span>
              <p className="text-slate-600 font-mono text-blue-700 font-bold">J01-K01-R01-001</p>
              <p className="text-[11px] text-slate-500">J01 (Medis) + K01 (Life Support) + R01 (IGD) + Urut 001</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-800">Contoh Kasus 2: Komputer Server di IT</span>
              <p className="text-slate-600 font-mono text-blue-700 font-bold">J02-K04-R07-001</p>
              <p className="text-[11px] text-slate-500">J02 (Elektronik) + K04 (Server) + R07 (IT) + Urut 001</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'modules',
      title: '3. Penjelasan Fitur Setiap Menu',
      icon: <Layers className="w-4 h-4 text-blue-600" />,
      content: (
        <div className="space-y-3 text-xs">
          <div className="border border-slate-200/80 rounded-lg p-3 space-y-1">
            <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>1. Master Inventaris</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              Pusat data referensi: Jenis (kode otomatis 3 karakter seperti <code>J01</code>), Kategori (<code>K01</code>), Merk (<code>MRK-001</code>), Ruangan (<code>R01</code>), dan Rekanan Supplier resmi dengan alamat dan kontak.
            </p>
          </div>

          <div className="border border-slate-200/80 rounded-lg p-3 space-y-1">
            <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>2. Data Inventaris</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              <b>Data Inventaris Ruangan (DIR):</b> Tempat utama input & manajemen barang per ruangan dengan QR generator.<br />
              <b>Semua Data Inventaris:</b> Agregasi seluruh aset RS, scanner QR kamera langsung, filter kondisi, dan cetak label QR massal.<br />
              <b>Sirkulasi Inventaris:</b> Mutasi perpindahan alat antar ruangan yang otomatis memindahkan lokasi barang di database dan mencetak Surat Jalan Mutasi.
            </p>
          </div>

          <div className="border border-slate-200/80 rounded-lg p-3 space-y-1">
            <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>3. Kegiatan Inventaris (IPSRS)</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              Pelaporan kerusakan dari ruangan, pengerjaan perbaikan teknisi IPSRS / vendor eksternal, pembuatan Berita Acara Perbaikan (BAP), dan penjadwalan Preventive Maintenance (kalibrasi rutin).
            </p>
          </div>

          <div className="border border-slate-200/80 rounded-lg p-3 space-y-1">
            <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>4. Pengadaan Inventaris</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              Pengajuan alkes dari kepala unit &rarr; Penerbitan Purchase Order (PO) &rarr; Berita Acara Penerimaan (BAST). Tombol <b>"+ Masukkan ke Inventaris Ruangan"</b> langsung memasukkan barang yang diterima ke database tanpa ketik ulang.
            </p>
          </div>

          <div className="border border-slate-200/80 rounded-lg p-3 space-y-1">
            <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>5. Pemusnahan Aset</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              Pengusulan aset afkir/rusak berat, persetujuan direksi, penghancuran fisik dengan saksi SPI, dan tombol satu-klik untuk memperbarui status aset menjadi <code>Dimusnahkan</code>.
            </p>
          </div>

          <div className="border border-slate-200/80 rounded-lg p-3 space-y-1">
            <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>6. Setting & Pengguna</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              Manajemen akun 3 level (Admin, Inputer, Viewer), sinkronisasi Google Spreadsheet real-time via Google Apps Script, dan backup/restore database lengkap (.json).
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'gas-tutorial',
      title: '4. Panduan Menghubungkan Google Spreadsheet (Google Apps Script)',
      icon: <Database className="w-4 h-4 text-blue-600" />,
      content: (
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Ikuti 4 langkah mudah berikut untuk menghubungkan sistem ini ke Google Sheets gratis tanpa server:
          </p>

          <ol className="list-decimal pl-4 space-y-2 text-slate-700 font-medium">
            <li>Buka <b>Google Spreadsheet</b> baru di Google Drive Anda.</li>
            <li>Klik menu <b>Ekstensi (Extensions) &rarr; Apps Script</b>.</li>
            <li>Hapus semua kode di editor <code>Code.gs</code>, lalu klik tombol di bawah untuk menyalin script yang sudah kami siapkan:</li>
          </ol>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Script Google Apps Script (Code.gs)'}</span>
            </button>
          </div>

          <ol start={4} className="list-decimal pl-4 space-y-2 text-slate-700 font-medium">
            <li>Klik <b>Deploy (Terapkan) &rarr; New Deployment (Penerapan baru)</b>, pilih jenis <b>Web App</b>, set <i>Who has access (Siapa yang memiliki akses)</i> ke <b>Anyone (Siapa saja)</b>.</li>
            <li>Salin <b>Web App URL</b> yang dihasilkan, lalu masukkan ke menu <b>6. Setting &rarr; Database & Google Sheets Sync</b> di aplikasi ini. Selesai!</li>
          </ol>
        </div>
      )
    }
  ];

  const q = (searchTerm || '').trim().toLowerCase();
  const filteredSections = sections.filter(s =>
    q === '' ||
    (s.title || '').toLowerCase().includes(q) ||
    (s.id || '').toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>7. PETUNJUK PENGGUNAAN & MANUAL SISTEM</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Panduan operasional resmi Sistem Inventaris Barang & Aset Rumah Sakit Medika Insani.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari petunjuk..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Accordion / Cards */}
      <div className="space-y-4">
        {filteredSections.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 pb-2.5 border-b border-slate-100">
              {s.icon}
              <span>{s.title}</span>
            </h3>
            {s.content}
          </div>
        ))}
      </div>

      {/* Hospital Footer note */}
      <div className="p-3.5 rounded-lg bg-slate-100 border border-slate-200 text-center space-y-0.5 text-xs text-slate-800">
        <p className="font-semibold">Sistem Inventaris & Aset Rumah Sakit Medika Insani (SIM-ASET RSMI)</p>
        <p className="text-[11px] text-slate-500">Dikelola oleh Instalasi Pemeliharaan Sarana Rumah Sakit (IPSRS) & Bagian Logistik Aset Medis</p>
      </div>

    </div>
  );
};
