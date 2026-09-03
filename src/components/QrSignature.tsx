import React, { useState, useEffect } from 'react';
import { generateQrDataUrl, formatSignatureQrText } from '../utils/formatters';
import { ShieldCheck } from 'lucide-react';

export interface QrSignatureProps {
  role: string;
  name: string;
  nip?: string;
  jabatan?: string;
  docName: string;
  docNumber?: string;
  date?: string;
  hospitalName?: string;
  locationDate?: string;
  compact?: boolean;
}

export const QrSignature: React.FC<QrSignatureProps> = ({
  role,
  name,
  nip,
  jabatan,
  docName,
  docNumber,
  date,
  hospitalName,
  locationDate,
  compact = false
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const payload = formatSignatureQrText(
      role,
      name,
      docName,
      docNumber,
      hospitalName,
      date
    );

    generateQrDataUrl(payload).then(url => {
      if (isMounted && url) {
        setQrUrl(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [role, name, docName, docNumber, hospitalName, date]);

  return (
    <div className="flex flex-col items-center text-center text-slate-800 print-avoid-break">
      {/* Location / Date Header */}
      {locationDate && (
        <p className="text-[10px] sm:text-[11px] text-slate-600 mb-0.5">
          {locationDate}
        </p>
      )}

      {/* Role / Jabatan Title */}
      <p className="text-xs font-semibold text-slate-800 leading-tight mb-2">
        {role}
      </p>

      {/* QR Code Container */}
      <div className="p-1.5 bg-white rounded-lg border border-slate-300 shadow-2xs inline-flex flex-col items-center justify-center my-1">
        {qrUrl ? (
          <img
            src={qrUrl}
            alt={`TTE ${role} - ${name}`}
            className={compact ? "w-16 h-16 object-contain" : "w-20 h-20 object-contain"}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`${compact ? "w-16 h-16" : "w-20 h-20"} bg-slate-100 flex items-center justify-center text-[9px] text-slate-400 font-mono`}>
            Memuat QR...
          </div>
        )}
        <div className="flex items-center gap-1 text-[8px] font-semibold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 mt-1">
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
          <span>TTE TERVERIFIKASI</span>
        </div>
      </div>

      {/* Signee Name & Identity */}
      <div className="mt-1.5 space-y-0.5">
        <p className="text-xs font-bold text-slate-950 underline decoration-slate-400">
          {name.startsWith('(') ? name : `( ${name} )`}
        </p>
        {nip && (
          <p className="text-[10px] text-slate-600 font-mono">
            {nip.startsWith('NIP') ? nip : `NIP. ${nip}`}
          </p>
        )}
        {jabatan && !nip && (
          <p className="text-[10px] text-slate-500">
            {jabatan}
          </p>
        )}
      </div>
    </div>
  );
};
