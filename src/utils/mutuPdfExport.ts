import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LaporanMutuIPSRS, RuangInventaris, AppSettings } from '../types/inventory';
import { formatDateIndo } from './formatters';

interface MutuPdfExportOptions {
  filteredList: LaporanMutuIPSRS[];
  ruangList: RuangInventaris[];
  appSettings?: AppSettings;
  selectedBulan: string;
  selectedTahun: string;
  selectedRuang: string;
  selectedStatusRespon: string;
  totalLaporan: number;
  responTepatWaktu: number;
  responTerlambat: number;
  menungguResponCount: number;
  persentaseCapaian: number;
  isTargetTercapai: boolean;
  printedBy?: string;
}

const BULAN_LABELS: Record<string, string> = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember',
};

const formatDateTimeClean = (dtStr?: string): string => {
  if (!dtStr) return '-';
  try {
    const d = new Date(dtStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dtStr;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dtStr;
  }
};

export const exportLaporanMutuPdf = ({
  filteredList,
  ruangList,
  appSettings,
  selectedBulan,
  selectedTahun,
  selectedRuang,
  selectedStatusRespon,
  totalLaporan,
  responTepatWaktu,
  responTerlambat,
  menungguResponCount,
  persentaseCapaian,
  isTargetTercapai,
  printedBy = 'Petugas IPSRS',
}: MutuPdfExportOptions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  const hospitalName = appSettings?.appName || 'RUMAH SAKIT MEDIKA INSANI';
  const hospitalSubtitle = appSettings?.appSubtitle || 'INSTALASI PEMELIHARAAN SARANA RUMAH SAKIT (IPSRS)';
  const hospitalAddress = appSettings?.hospitalAddress || 'Jl. Kesehatan No. 10 Jakarta Pusat';
  const hospitalPhone = appSettings?.hospitalPhone ? `Telp: ${appSettings.hospitalPhone}` : '';

  // 1. KOP SURAT RESMI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(hospitalName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.5;

  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text(hospitalSubtitle.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  const contactText = [hospitalAddress, hospitalPhone].filter(Boolean).join(' | ');
  doc.text(contactText, pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.5;

  // Garis Pembatas Kop
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.8);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 1.2;
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 2. JUDUL DOKUMEN & PERIODE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RINGKASAN PARAMETER INDIKATOR MUTU PELAYANAN IPSRS', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Indikator: Waktu Tanggap Kerusakan Alat Medis & Sarana (Response Time <= 15 Menit)', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  // Metadata Filter Box
  let periodeStr = 'Semua Periode';
  if (selectedBulan !== 'all' && selectedTahun !== 'all') {
    periodeStr = `${BULAN_LABELS[selectedBulan] || selectedBulan} ${selectedTahun}`;
  } else if (selectedBulan !== 'all') {
    periodeStr = `Bulan ${BULAN_LABELS[selectedBulan] || selectedBulan}`;
  } else if (selectedTahun !== 'all') {
    periodeStr = `Tahun ${selectedTahun}`;
  }

  let ruangStr = 'Semua Ruangan / Instalasi';
  if (selectedRuang !== 'all') {
    const foundR = ruangList.find(r => r.id === selectedRuang);
    ruangStr = foundR ? `${foundR.id} - ${foundR.namaRuang}` : selectedRuang;
  }

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 11, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Periode Laporan:', margin + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text(periodeStr, margin + 26, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Unit / Ruang:', margin + 70, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text(ruangStr, margin + 89, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Tgl Cetak:', margin + 3, currentY + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDateIndo(new Date().toISOString())} (${printedBy})`, margin + 26, currentY + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Status Filter:', margin + 70, currentY + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(selectedStatusRespon === 'all' ? 'Semua Status' : selectedStatusRespon, margin + 89, currentY + 8.5);

  currentY += 15;

  // 3. TABEL RINGKASAN PARAMETER INDIKATOR MUTU (KEY METRICS)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('A. RINGKASAN PARAMETER & FORMULASI CAPAIAN MUTU', margin, currentY);
  currentY += 2;

  const kesimpulanStatusText = isTargetTercapai
    ? 'TERCAPAI (Memenuhi Standar SPM RS >= 80%)'
    : 'TIDAK TERCAPAI (Di Bawah Target Standar SPM < 80%)';

  const rekapBody = [
    ['Judul Indikator Mutu', 'Waktu Tanggap Penanganan Kerusakan Alat Medis & Sarana IPSRS'],
    ['Standar / Target Minimal', '>= 80% (Standar Pelayanan Minimal & Akreditasi Rumah Sakit)'],
    ['Total Seluruh Aduan Masuk (N)', `${totalLaporan} Laporan / Tiket Masuk`],
    ['Respon Tepat Waktu (<= 15 Menit) (D)', `${responTepatWaktu} Laporan (${totalLaporan > 0 ? ((responTepatWaktu / totalLaporan) * 100).toFixed(1) : '100'}%)`],
    ['Respon Terlambat (> 15 Menit)', `${responTerlambat} Laporan (${totalLaporan > 0 ? ((responTerlambat / totalLaporan) * 100).toFixed(1) : '0'}%)`],
    ['Menunggu Respon / Tindak Lanjut', `${menungguResponCount} Laporan`],
    ['Rumus / Formulasi Capaian', `(Jumlah Respon <= 15m / Total Laporan) x 100% = (${responTepatWaktu} / ${totalLaporan}) x 100%`],
    ['Persentase Capaian Mutu (%)', `${persentaseCapaian.toFixed(1)}%`],
    ['Kesimpulan Evaluasi Mutu', kesimpulanStatusText],
    [
      'Rekomendasi & Tindak Lanjut (RTL)',
      isTargetTercapai
        ? 'Pertahankan standar response time, monitoring log harian, dan rutin laksanakan pemeliharaan preventif (PM).'
        : 'Segera lakukan evaluasi jalur komunikasi aduan, ketersediaan teknisi siaga cito, dan percepat buffer sparepart alat kritis.'
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Parameter Indikator', 'Nilai / Keterangan Evaluasi']],
    body: rekapBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138], // Navy blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 62, fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      // Highlight row Persentase Capaian and Kesimpulan Status
      if (data.row.index === 7 && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = isTargetTercapai ? [5, 150, 105] : [225, 29, 72];
        data.cell.styles.fontSize = 9;
      }
      if (data.row.index === 8 && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = isTargetTercapai ? [6, 95, 70] : [159, 18, 57];
        data.cell.styles.fillColor = isTargetTercapai ? [236, 253, 245] : [255, 241, 242];
      }
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 4. TABEL DETAIL RINCIAN TIKET LAPORAN MUTU
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('B. RINCIAN DATA LAPORAN & WAKTU TANGGAP KERUSAKAN', margin, currentY);
  currentY += 2;

  const detailHead = [
    [
      'No',
      'ID Tiket',
      'Unit Pelapor',
      'Nama Alat Medis / Sarana',
      'Waktu Lapor',
      'Waktu Respon',
      'Durasi',
      'Status Mutu',
      'Alasan Keterlambatan',
      'Teknisi',
    ],
  ];

  const detailBody = filteredList.map((item, idx) => {
    const r = ruangList.find(ru => ru.id === item.unitPelapor);
    const isTepat = item.statusRespon === 'Tepat Waktu' || (item.durasiRespon !== undefined && item.durasiRespon <= 15 && item.tglJamRespon);
    const isTerlambat = item.statusRespon === 'Terlambat' || (item.durasiRespon !== undefined && item.durasiRespon > 15);
    
    let statusLabel = 'Menunggu';
    if (isTepat) statusLabel = 'Tepat Waktu';
    else if (isTerlambat) statusLabel = 'Terlambat';

    return [
      (idx + 1).toString(),
      item.idLaporan + (item.idPermintaan ? `\n(Ref: ${item.idPermintaan})` : ''),
      r ? `${r.namaRuang}` : item.unitPelapor,
      item.namaBarang + (item.idBarang ? `\n[${item.idBarang}]` : ''),
      formatDateTimeClean(item.tglJamLapor),
      item.tglJamRespon ? formatDateTimeClean(item.tglJamRespon) : 'Belum Respon',
      item.durasiRespon !== undefined ? `${item.durasiRespon} m` : '-',
      statusLabel,
      item.alasanKeterlambatan || '-',
      item.teknisiRespon || '-',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: detailHead,
    body: detailBody.length > 0 ? detailBody : [['-', '-', '-', 'Tidak ada data laporan mutu', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85], // Slate-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 1.8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 28 },
      4: { cellWidth: 19 },
      5: { cellWidth: 19 },
      6: { cellWidth: 11, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 17, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 25 },
      9: { cellWidth: 18 },
    },
    didParseCell: (data) => {
      // Color status mutu
      if (data.column.index === 7 && data.section === 'body') {
        const text = String(data.cell.raw);
        if (text === 'Tepat Waktu') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fillColor = [236, 253, 245];
        } else if (text === 'Terlambat') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fillColor = [255, 241, 242];
        } else if (text === 'Menunggu') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fillColor = [254, 243, 199];
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY + 10;

  // Check if we have enough space on current page for signatures (need ~40mm)
  if (finalTableY + 38 > pageHeight) {
    doc.addPage();
    currentY = margin + 5;
  } else {
    currentY = finalTableY;
  }

  // 5. LEMBAR PENGESAHAN TANDA TANGAN RESMI
  const signatureWidth = 75;
  const leftColX = margin + 10;
  const rightColX = pageWidth - margin - signatureWidth - 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  // Left Signature: PJ Mutu
  doc.text('Mengetahui,', leftColX + (signatureWidth / 2), currentY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Penanggung Jawab Mutu Pelayanan RS', leftColX + (signatureWidth / 2), currentY + 4, { align: 'center' });

  // Right Signature: Ka IPSRS
  doc.setFont('helvetica', 'normal');
  doc.text(`${hospitalAddress.split(',')[1]?.trim() || 'Jakarta'}, ${formatDateIndo(new Date().toISOString())}`, rightColX + (signatureWidth / 2), currentY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Instalasi IPSRS', rightColX + (signatureWidth / 2), currentY + 4, { align: 'center' });

  currentY += 22;

  // Signature lines & names
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  doc.text('( dr. Hj. Nurhidayah, Sp.PK, MARS )', leftColX + (signatureWidth / 2), currentY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('NIP. 19780512 200501 2 004', leftColX + (signatureWidth / 2), currentY + 3.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('( Ir. H. Rahardian, MT )', rightColX + (signatureWidth / 2), currentY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('NIP. 19750918 200212 1 003', rightColX + (signatureWidth / 2), currentY + 3.5, { align: 'center' });

  // Add Page Numbers
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `SIMBARS RS - Dokumen Indikator Mutu IPSRS | Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Save PDF file
  const dateSlug = new Date().toISOString().slice(0, 10);
  const filePeriodSlug = selectedBulan !== 'all' ? `_${selectedBulan}_${selectedTahun}` : `_${selectedTahun}`;
  const filename = `Ringkasan_Indikator_Mutu_IPSRS${filePeriodSlug}_${dateSlug}.pdf`;
  doc.save(filename);
};
