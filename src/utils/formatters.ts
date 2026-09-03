import QRCode from 'qrcode';

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDateIndo = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const generateQrDataUrl = async (text: string): Promise<string> => {
  try {
    const url = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return url;
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
};

/**
 * Format string payload QR code inventaris tanpa tanda kurung kurawal { } dan tanda petik "
 * serta menampilkan Nama Ruangan asli secara jelas (bukan ID Ruangan).
 */
export const formatAssetQrText = (
  asset: {
    idBarang: string;
    namaBarang: string;
    idRuang?: string;
    nomorSeri?: string;
    tahunPerolehan?: number;
    kondisi?: string;
    status?: string;
    spesifikasi?: string;
    sumberDana?: string;
  },
  namaRuang?: string,
  hospitalName?: string
): string => {
  const rs = hospitalName || 'RS MEDIKA INSANI';
  const roomName = namaRuang || asset.idRuang || '-';
  
  const lines: string[] = [
    rs,
    `ID: ${asset.idBarang}`,
    `Nama: ${asset.namaBarang}`,
    `Ruang: ${roomName}`,
  ];

  if (asset.nomorSeri && asset.nomorSeri !== '-') {
    lines.push(`No Seri: ${asset.nomorSeri}`);
  }
  if (asset.tahunPerolehan) {
    lines.push(`Tahun: ${asset.tahunPerolehan}`);
  }
  if (asset.kondisi) {
    lines.push(`Kondisi: ${asset.kondisi}`);
  }
  if (asset.status) {
    lines.push(`Status: ${asset.status}`);
  }
  if (asset.sumberDana) {
    lines.push(`Sumber Dana: ${asset.sumberDana}`);
  }

  return lines.join('\n');
};

/**
 * Format payload teks untuk QR Code Tanda Tangan Elektronik (TTE) Dokumen Resmi
 */
export const formatSignatureQrText = (
  role: string,
  name: string,
  docName: string,
  docNumber?: string,
  hospitalName?: string,
  date?: string
): string => {
  const rs = hospitalName || 'RUMAH SAKIT MEDIKA INSANI';
  const lines: string[] = [
    `TANDA TANGAN ELEKTRONIK RESMI (TTE)`,
    `Instansi: ${rs}`,
    `Dokumen: ${docName}`,
  ];

  if (docNumber) {
    lines.push(`Nomor: ${docNumber}`);
  }
  lines.push(`Penandatangan: ${name}`);
  lines.push(`Jabatan/Peran: ${role}`);
  lines.push(`Tanggal Validasi: ${date || formatDateIndo(new Date().toISOString())}`);
  lines.push(`Status: TERVERIFIKASI DIGITAL & SAH`);

  return lines.join('\n');
};

export const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const stringified = String(str).replace(/"/g, '""');
    return `"${stringified}"`;
  };

  const csvContent =
    '\uFEFF' +
    [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(',')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export interface ExcelExportOptions {
  filename: string;
  title?: string;
  hospitalName?: string;
  subtitle?: string;
  unitName?: string;
  metaInfo?: { label: string; value: string }[];
  headers: string[];
  rows: (string | number)[][];
  summaryRows?: { label: string; value: string | number; colSpan?: number }[];
}

export const exportToExcel = ({
  filename,
  title = 'Rekapitulasi Inventaris & Aset Rumah Sakit',
  hospitalName = 'RUMAH SAKIT MEDIKA INSANI',
  subtitle = 'Sistem Informasi Manajemen Barang & Aset Rumah Sakit (SIMBARS)',
  unitName = 'Instalasi Pemeliharaan Sarana & Prasarana Rumah Sakit (IPSRS)',
  metaInfo = [],
  headers,
  rows,
  summaryRows = [],
}: ExcelExportOptions) => {
  const colCount = Math.max(headers.length, 6);

  const metaHtml = metaInfo.length > 0
    ? metaInfo.map(m => `
      <tr>
        <td style="font-weight:bold;color:#475569;font-size:11px;padding:3px 6px;" colspan="2">${m.label}:</td>
        <td colspan="${colCount - 2}" style="color:#0f172a;font-size:11px;padding:3px 6px;">${m.value}</td>
      </tr>
    `).join('')
    : '';

  const headerHtml = `
    <tr style="background-color:#1e3a8a;">
      ${headers.map(h => `<th style="background-color:#1e3a8a;color:#ffffff;font-weight:bold;border:1px solid #94a3b8;padding:8px 10px;text-align:left;font-size:11px;white-space:nowrap;">${h}</th>`).join('')}
    </tr>
  `;

  const rowsHtml = rows.map((row, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    return `<tr style="background-color:${bg};">` + row.map(cell => {
      const isNumber = typeof cell === 'number';
      const align = isNumber ? 'right' : 'left';
      return `<td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:${align};font-size:11px;mso-number-format:'\\@';">${cell !== undefined && cell !== null ? cell : '-'}</td>`;
    }).join('') + `</tr>`;
  }).join('');

  const summaryHtml = summaryRows.length > 0
    ? summaryRows.map(s => {
        const span = s.colSpan || (colCount - 1);
        const remSpan = Math.max(1, colCount - span);
        return `
          <tr style="background-color:#e2e8f0;font-weight:bold;">
            <td colspan="${span}" style="border:1px solid #94a3b8;padding:8px 10px;text-align:right;font-size:11px;color:#0f172a;">${s.label}</td>
            <td colspan="${remSpan}" style="border:1px solid #94a3b8;padding:8px 10px;text-align:right;font-size:12px;color:#1e3a8a;font-weight:bold;">${s.value}</td>
          </tr>
        `;
      }).join('')
    : '';

  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Rekap_Inventaris_RS</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${colCount}" style="font-size:16px;font-weight:bold;color:#1e3a8a;text-align:center;padding:12px 6px 4px 6px;">${hospitalName}</td>
        </tr>
        <tr>
          <td colspan="${colCount}" style="font-size:13px;font-weight:bold;color:#0f172a;text-align:center;padding:2px 6px;">${title}</td>
        </tr>
        <tr>
          <td colspan="${colCount}" style="font-size:11px;color:#475569;text-align:center;padding:2px 6px;">${unitName}</td>
        </tr>
        <tr>
          <td colspan="${colCount}" style="font-size:10px;color:#64748b;text-align:center;padding:2px 6px 12px 6px;">${subtitle} | Tanggal Ekspor Rekap: ${formatDateIndo(new Date().toISOString())}</td>
        </tr>
        <tr><td colspan="${colCount}" style="height:10px;"></td></tr>
        ${metaHtml}
        <tr><td colspan="${colCount}" style="height:8px;"></td></tr>
        ${headerHtml}
        ${rowsHtml}
        ${summaryHtml}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJson = (filename: string, data: any) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printDiv = (divId: string, title = 'Cetak Dokumen SIMBARS RS Medika Insani') => {
  const elem = document.getElementById(divId);
  if (!elem) {
    window.print();
    return;
  }

  // Try opening standalone print window first; fallback to window.print() if popups are blocked (e.g. in iframe)
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 portrait; margin: 12mm 10mm 15mm 10mm; }
            @media print {
              .no-print, button, input, select { display: none !important; }
              table { width: 100% !important; border-collapse: collapse !important; }
              tr { page-break-inside: avoid !important; break-inside: avoid !important; }
              .print-avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
            }
          </style>
        </head>
        <body class="bg-white text-slate-900 p-4 sm:p-6">
          ${elem.innerHTML}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch {
    window.print();
  }
};

/**
 * Menghitung jarak durasi waktu (Lama Respon) antara Tanggal & Jam Permintaan dengan Tanggal & Jam Respon
 */
export const calculateLamaRespon = (
  tglPermintaan?: string,
  jamPermintaan?: string,
  tglRespon?: string,
  jamRespon?: string
): { formatted: string; totalMinutes: number; isFast: boolean } => {
  if (!tglPermintaan || !tglRespon) {
    return { formatted: '-', totalMinutes: 0, isFast: false };
  }

  try {
    const cleanJamMulai = (jamPermintaan || '08:00').trim().replace('.', ':');
    const [hMulai, mMulai] = cleanJamMulai.split(':').map(n => parseInt(n, 10) || 0);

    const cleanJamRespon = (jamRespon || '08:15').trim().replace('.', ':');
    const [hRespon, mRespon] = cleanJamRespon.split(':').map(n => parseInt(n, 10) || 0);

    const dateMulai = new Date(tglPermintaan);
    dateMulai.setHours(hMulai, mMulai, 0, 0);

    const dateRespon = new Date(tglRespon);
    dateRespon.setHours(hRespon, mRespon, 0, 0);

    const diffMs = dateRespon.getTime() - dateMulai.getTime();
    if (isNaN(diffMs) || diffMs < 0) {
      return { formatted: '< 1 Menit', totalMinutes: 0, isFast: true };
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const isFast = totalMinutes <= 15; // SPM Standar Respon Cepat Alkes / Sarpras (<= 15 menit)

    if (totalMinutes === 0) {
      return { formatted: '< 1 Menit', totalMinutes: 0, isFast: true };
    }
    if (totalMinutes < 60) {
      return { formatted: `${totalMinutes} Menit`, totalMinutes, isFast };
    }

    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const mins = totalMinutes % 60;

    if (days > 0) {
      const parts = [`${days} Hari`];
      if (hours > 0) parts.push(`${hours} Jam`);
      if (mins > 0) parts.push(`${mins} Mnt`);
      return { formatted: parts.join(' '), totalMinutes, isFast: false };
    }

    const parts = [`${hours} Jam`];
    if (mins > 0) parts.push(`${mins} Menit`);
    return { formatted: parts.join(' '), totalMinutes, isFast: false };
  } catch {
    return { formatted: '-', totalMinutes: 0, isFast: false };
  }
};
