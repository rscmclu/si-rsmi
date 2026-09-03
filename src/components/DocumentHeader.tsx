import React from 'react';
import { AppSettings } from '../types/inventory';
import { AppLogo } from './AppLogo';

interface DocumentHeaderProps {
  settings?: AppSettings;
  title: string;
  documentNumber?: string;
  unitName?: string;
  subtitle?: string;
  extraMeta?: React.ReactNode;
  showLogo?: boolean;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  settings,
  title,
  documentNumber,
  unitName,
  subtitle,
  extraMeta,
  showLogo = true
}) => {
  const appName = settings?.appName || 'RUMAH SAKIT MEDIKA INSANI';
  const defaultSub = unitName || settings?.appSubtitle || 'Instalasi Pemeliharaan Sarana & Prasarana Rumah Sakit (IPSRS)';
  const address = settings?.hospitalAddress || 'Jl. Kesehatan Raya No. 45, Jakarta Selatan';
  const phone = settings?.hospitalPhone || '(021) 7890-1234';
  const email = settings?.hospitalEmail || 'sarpras@rsmedikainsani.co.id';

  return (
    <div className="w-full text-slate-900 mb-4 print-avoid-break">
      {/* 1. KOP SURAT (KEPALA SURAT) */}
      <div className="flex items-center gap-4 pb-2.5">
        {showLogo && (
          <div className="shrink-0">
            <AppLogo settings={settings} size="lg" />
          </div>
        )}
        <div className="text-center flex-1 pr-2">
          <h2 className="text-lg sm:text-xl font-extrabold tracking-wide text-slate-950 uppercase leading-snug">
            {appName}
          </h2>
          <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider mt-0.5">
            {defaultSub}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 leading-tight">
            {address}
            {phone && ` • Telp: ${phone}`}
            {email && ` • Email: ${email}`}
          </p>
        </div>
      </div>

      {/* 2. GARIS KEPALA SURAT (DOUBLE LINE DIVIDER) */}
      <div className="border-t-2 border-b border-slate-900 my-1 pt-[1px]" />

      {/* 3. DI BAWAH GARIS KEPALA SURAT: NAMA SURAT & NOMOR SURAT */}
      <div className="text-center pt-2 pb-1 space-y-1">
        <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-950 underline decoration-slate-400 decoration-1 underline-offset-3">
          {title}
        </h3>
        {documentNumber && (
          <p className="text-[11px] sm:text-xs font-mono font-semibold text-slate-700">
            {documentNumber.startsWith('Nomor') || documentNumber.startsWith('NO') ? documentNumber : `Nomor: ${documentNumber}`}
          </p>
        )}
        {subtitle && (
          <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium">
            {subtitle}
          </p>
        )}
        {extraMeta && (
          <div className="pt-1 text-xs">
            {extraMeta}
          </div>
        )}
      </div>
    </div>
  );
};
