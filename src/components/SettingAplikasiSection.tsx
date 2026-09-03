import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, ActionPermission } from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { AppLogo, PRESET_ICONS, COLOR_PALETTES, getPresetIconComponent } from './AppLogo';
import {
  Building2,
  Image,
  Palette,
  Type,
  Upload,
  Link,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Eye,
  Phone,
  Mail,
  MapPin,
  FileText,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface SettingAplikasiSectionProps {
  appSettings?: AppSettings;
  actionAccess: ActionPermission;
  onAppSettingsChange?: (newSettings: AppSettings) => void;
}

export const SettingAplikasiSection: React.FC<SettingAplikasiSectionProps> = ({
  appSettings: initialPropsSettings,
  actionAccess,
  onAppSettingsChange,
}) => {
  const currentSaved = initialPropsSettings || dataStorage.getAppSettings();

  const [formData, setFormData] = useState<AppSettings>({
    appName: currentSaved.appName ?? 'RS Medika Insani',
    appSubtitle: currentSaved.appSubtitle ?? 'Sistem Informasi Manajemen Inventaris & Aset Rumah Sakit',
    systemShortName: currentSaved.systemShortName ?? 'SIMBARS',
    appVersion: currentSaved.appVersion ?? 'v2.5',
    logoType: currentSaved.logoType ?? 'initials',
    logoInitials: currentSaved.logoInitials ?? 'MI',
    logoImageUrl: currentSaved.logoImageUrl ?? '',
    logoBgColor: currentSaved.logoBgColor ?? 'bg-blue-600',
    logoTextColor: currentSaved.logoTextColor ?? 'text-white',
    logoPresetIcon: currentSaved.logoPresetIcon ?? 'Building2',
    hospitalAddress: currentSaved.hospitalAddress ?? 'Jl. Kesehatan Raya No. 45, Jakarta Selatan',
    hospitalPhone: currentSaved.hospitalPhone ?? '(021) 7890-1234',
    hospitalEmail: currentSaved.hospitalEmail ?? 'sarpras@rsmedikainsani.co.id',
  });

  useEffect(() => {
    if (initialPropsSettings) {
      setFormData(initialPropsSettings);
    }
  }, [initialPropsSettings]);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof AppSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setSaveSuccessMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('File yang diunggah harus berupa gambar (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError('Ukuran file maksimal 2 MB');
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        logoType: 'image',
        logoImageUrl: base64,
      }));
      setSaveSuccessMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    dataStorage.saveAppSettings(formData);
    if (onAppSettingsChange) {
      onAppSettingsChange(formData);
    }

    setSaveSuccessMsg('Pengaturan aplikasi, nama perusahaan, dan logo berhasil disimpan!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan nama aplikasi, nama perusahaan, dan logo ke pengaturan default bawaan sistem?')) {
      const def = dataStorage.resetAppSettings();
      setFormData(def);
      if (onAppSettingsChange) {
        onAppSettingsChange(def);
      }
      setSaveSuccessMsg('Pengaturan telah dikembalikan ke default bawaan!');
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Container (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 1. KARTU IDENTITAS APLIKASI & PERUSAHAAN */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      1. Identitas Aplikasi & Rumah Sakit / Perusahaan
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Ubah nama aplikasi, nama instansi/RS, versi, dan informasi kontak resmi
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Aplikasi / Rumah Sakit / Perusahaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.appName}
                    onChange={e => handleInputChange('appName', e.target.value)}
                    placeholder="e.g. RS Medika Insani / PT Rumah Sakit Sehat"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ditampilkan di Header aplikasi, Sidebar atas, dan KOP surat dokumen inventaris.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Singkatan / Nama Singkat Sistem <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.systemShortName}
                      onChange={e => handleInputChange('systemShortName', e.target.value)}
                      placeholder="e.g. SIMBARS / SIM-ASET"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Versi Aplikasi
                    </label>
                    <input
                      type="text"
                      value={formData.appVersion}
                      onChange={e => handleInputChange('appVersion', e.target.value)}
                      placeholder="e.g. v2.5 / v3.0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deskripsi / Sub-judul Sistem
                  </label>
                  <input
                    type="text"
                    value={formData.appSubtitle}
                    onChange={e => handleInputChange('appSubtitle', e.target.value)}
                    placeholder="e.g. Sistem Informasi Manajemen Inventaris & Aset Rumah Sakit"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-semibold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Informasi KOP Surat Dokumen Cetak (KIRC, BAST, Laporan)</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Alamat Lengkap Rumah Sakit / Perusahaan
                      </label>
                      <input
                        type="text"
                        value={formData.hospitalAddress || ''}
                        onChange={e => handleInputChange('hospitalAddress', e.target.value)}
                        placeholder="e.g. Jl. Kesehatan Raya No. 45, Jakarta Selatan"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Nomor Telepon / Kontak
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={formData.hospitalPhone || ''}
                            onChange={e => handleInputChange('hospitalPhone', e.target.value)}
                            placeholder="(021) 7890-1234"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Email Resmi
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            value={formData.hospitalEmail || ''}
                            onChange={e => handleInputChange('hospitalEmail', e.target.value)}
                            placeholder="sarpras@rsmedikainsani.co.id"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. KARTU PENGATURAN LOGO APLIKASI */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      2. Ganti Logo Aplikasi
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pilih format logo: Upload gambar logo sendiri, preset icon medis, atau inisial warna
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5 text-xs">
                {/* Logo Type Selector Tabs */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-2">
                    Pilih Jenis / Mode Logo:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleInputChange('logoType', 'image')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                        formData.logoType === 'image'
                          ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20 font-bold'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Image className={`w-5 h-5 ${formData.logoType === 'image' ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="text-xs">1. Upload Gambar</span>
                      <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, SVG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInputChange('logoType', 'preset')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                        formData.logoType === 'preset'
                          ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20 font-bold'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Sparkles className={`w-5 h-5 ${formData.logoType === 'preset' ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="text-xs">2. Preset Icon Medis</span>
                      <span className="text-[10px] text-slate-400 font-normal">Ikon RS & IPSRS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInputChange('logoType', 'initials')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                        formData.logoType === 'initials'
                          ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20 font-bold'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Type className={`w-5 h-5 ${formData.logoType === 'initials' ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="text-xs">3. Inisial Huruf</span>
                      <span className="text-[10px] text-slate-400 font-normal">Otomatis dari Nama</span>
                    </button>
                  </div>
                </div>

                {/* OPTION 1: IMAGE LOGO UPLOAD & URL */}
                {formData.logoType === 'image' && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        Upload File Gambar Logo (Disimpan di Browser / Local):
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center bg-white hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">
                            Klik untuk memilih file logo dari komputer
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Format PNG, JPG, SVG, WebP (Rekomendasi rasio 1:1 atau kotak transparan)
                          </p>
                        </div>
                      </div>
                      {imageError && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1">
                          ⚠️ {imageError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">atau via Link URL</span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        URL Gambar Logo Eksternal:
                      </label>
                      <div className="relative">
                        <Link className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="url"
                          value={formData.logoImageUrl}
                          onChange={e => handleInputChange('logoImageUrl', e.target.value)}
                          placeholder="https://example.com/logo-rs.png"
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {formData.logoImageUrl && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center gap-3">
                          <img
                            src={formData.logoImageUrl}
                            alt="Logo Preview"
                            className="w-10 h-10 object-contain rounded border border-slate-200 p-0.5 bg-slate-50"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-semibold text-slate-800 text-xs block">Logo Gambar Terpilih</span>
                            <span className="text-[10px] text-slate-400">Siap diterapkan ke seluruh sistem</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('logoImageUrl', '');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* OPTION 2: PRESET ICONS */}
                {formData.logoType === 'preset' && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-2">
                        Pilih Icon Preset:
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                        {PRESET_ICONS.map(item => {
                          const IconComp = item.icon;
                          const isSelected = formData.logoPresetIcon === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleInputChange('logoPresetIcon', item.id)}
                              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-blue-600 bg-white shadow-xs text-blue-900 font-bold ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded flex items-center justify-center ${formData.logoBgColor} ${formData.logoTextColor}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] truncate">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-2">
                        Pilihan Warna Latar Logo:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PALETTES.map(c => {
                          const isSelected = formData.logoBgColor === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleInputChange('logoBgColor', c.id)}
                              title={c.name}
                              className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${c.id} ${
                                isSelected ? 'scale-110 ring-2 ring-offset-2 ring-slate-900 shadow-sm' : 'hover:opacity-85'
                              }`}
                            >
                              {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* OPTION 3: INITIALS MONOGRAM */}
                {formData.logoType === 'initials' && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-2">
                        Pilihan Warna Latar Logo:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PALETTES.map(c => {
                          const isSelected = formData.logoBgColor === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleInputChange('logoBgColor', c.id)}
                              title={c.name}
                              className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${c.id} ${
                                isSelected ? 'scale-110 ring-2 ring-offset-2 ring-slate-900 shadow-sm' : 'hover:opacity-85'
                              }`}
                            >
                              {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kembalikan Default Pabrikan</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Aplikasi</span>
              </button>
            </div>

          </form>
        </div>

        {/* Live Preview Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-5 sticky top-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Live Real-Time Preview
                </h3>
              </div>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                LIVE MOCKUP
              </span>
            </div>

            {/* 1. Preview Logo Sizes */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                A. Pratinjau Skala Logo:
              </span>
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60 justify-around">
                <div className="text-center space-y-1">
                  <div className="flex justify-center">
                    <AppLogo settings={formData} size="sm" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Kecil (28px)</span>
                </div>

                <div className="text-center space-y-1">
                  <div className="flex justify-center">
                    <AppLogo settings={formData} size="md" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Sedang (32px)</span>
                </div>

                <div className="text-center space-y-1">
                  <div className="flex justify-center">
                    <AppLogo settings={formData} size="lg" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Besar (40px)</span>
                </div>

                <div className="text-center space-y-1">
                  <div className="flex justify-center">
                    <AppLogo settings={formData} size="xl" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">KOP (64px)</span>
                </div>
              </div>
            </div>

            {/* 2. Preview Header Bar Mockup */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                B. Pratinjau Tampilan Header Bar Atas:
              </span>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <AppLogo settings={formData} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {formData.appName || 'Nama Aplikasi'}
                      </span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {formData.systemShortName || 'SIMBARS'} {formData.appVersion || 'v2.5'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {formData.appSubtitle || 'Deskripsi Sistem'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Preview Sidebar Header Mockup */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                C. Pratinjau Tampilan Sidebar Menu:
              </span>
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-white shadow-xs">
                <div className="flex items-center gap-3">
                  <AppLogo settings={formData} size="md" />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-white text-xs block truncate tracking-tight">
                      {formData.appName ? formData.appName.toUpperCase() : 'MEDIKA INSANI'}
                    </span>
                    <p className="text-[9px] text-slate-400 font-medium tracking-widest uppercase truncate">
                      {formData.systemShortName ? `${formData.systemShortName} ASET` : 'INVENTORY & ASSET SYSTEM'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Preview Official Document Header (KIRC / BAST) */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                D. Pratinjau KOP Surat Dokumen Resmi (KIRC & BAST):
              </span>
              <div className="p-4 bg-amber-50/20 rounded-xl border border-dashed border-slate-300 text-slate-800 text-[11px] space-y-2">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-800">
                  <AppLogo settings={formData} size="lg" />
                  <div className="text-center flex-1">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                      {formData.appName ? formData.appName.toUpperCase() : 'RUMAH SAKIT MEDIKA INSANI'}
                    </h4>
                    <p className="text-[10px] text-slate-600">
                      {formData.hospitalAddress || 'Jl. Kesehatan Raya No. 45, Jakarta Selatan'}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Telp: {formData.hospitalPhone || '(021) 7890-1234'} | Email: {formData.hospitalEmail || 'sarpras@rsmedikainsani.co.id'}
                    </p>
                  </div>
                </div>
                <div className="text-center py-1">
                  <span className="font-bold text-[11px] text-slate-900 underline block">
                    KARTU INVENTARIS RUANGAN CETAK (KIRC)
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    Dokumen Resmi Terstandarisasi {formData.systemShortName || 'SIMBARS'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
