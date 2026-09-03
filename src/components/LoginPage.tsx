import React, { useState } from 'react';
import { UserAccount, AppSettings } from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { AppLogo } from './AppLogo';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Wrench,
  Package,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';

interface LoginPageProps {
  onLogin?: (user: UserAccount) => void;
  onLoginSuccess?: (user: UserAccount) => void;
  appSettings?: AppSettings;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLogin, 
  onLoginSuccess,
  appSettings: propAppSettings 
}) => {
  const settings = propAppSettings || dataStorage.getAppSettings();
  const [users] = useState<UserAccount[]>(() => dataStorage.getUsers());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const notifyLogin = (user: UserAccount) => {
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess(user);
    } else if (typeof onLogin === 'function') {
      onLogin(user);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim()) {
      setErrorMsg('Silakan masukkan Username / ID Pengguna.');
      return;
    }
    if (!password) {
      setErrorMsg('Silakan masukkan Kata Sandi (Password).');
      return;
    }
    setIsLoading(true);

    setTimeout(() => {
      const targetUsername = (username || '').trim().toLowerCase();
      const user = users.find(
        u => (u.username || '').toLowerCase() === targetUsername && u.password === password
      );

      if (user) {
        if (!user.isActive) {
          setErrorMsg('Akun pengguna ini dinonaktifkan oleh administrator.');
          setIsLoading(false);
          return;
        }

        const updatedUser = {
          ...user,
          lastLogin: new Date().toLocaleString('id-ID'),
        };
        dataStorage.saveCurrentUser(updatedUser);
        notifyLogin(updatedUser);
      } else {
        setErrorMsg('Username atau password tidak sesuai. Silakan periksa kembali.');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleSelectUser = (selectedUser: UserAccount) => {
    setUsername(selectedUser.username);
    setPassword('');
    setErrorMsg('');
    const pwdInput = document.getElementById('login-password-input');
    if (pwdInput) {
      pwdInput.focus();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return <ShieldCheck className="w-4 h-4 text-blue-400" />;
      case 'Kepala Instalasi Sarpras / IPSRS':
        return <Layers className="w-4 h-4 text-sky-400" />;
      case 'Petugas Ruangan / Perawat':
        return <Stethoscope className="w-4 h-4 text-indigo-400" />;
      case 'Teknisi Elektromedik / Umum':
        return <Wrench className="w-4 h-4 text-amber-400" />;
      case 'Tim Pengadaan Logistik':
        return <Package className="w-4 h-4 text-teal-400" />;
      default:
        return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans">
      {/* Top Banner */}
      <header className="px-6 sm:px-8 py-4 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AppLogo settings={settings} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                {(settings.appName || 'RS MEDIKA INSANI').toUpperCase()}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20 uppercase tracking-wider">
                {settings.systemShortName || 'SIMBARS'} {settings.appVersion || 'v2.5'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {settings.appSubtitle || 'Sistem Informasi Manajemen Inventaris & Aset Rumah Sakit'}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Sistem Keamanan Aktif</span>
        </div>
      </header>

      {/* Center Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Mandatory Login Notice & Quick Demo Selectors */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Autentikasi Diperlukan • Wajib Login Sebelum Entry Data
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                Sistem Manajemen Inventaris & Aset Terpadu
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                Demi integritas data dan jejak audit inventaris, seluruh aktivitas pencatatan (entry data ruangan, mutasi sirkulasi, pemeliharaan IPSRS, pengajuan pengadaan, hingga pemusnahan aset) wajib melalui login resmi sesuai hak akses yang diberikan.
              </p>
            </div>

            {/* Role Profile Selection */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Pilih Profil Akun:
                </p>
                <span className="text-[10px] text-slate-500">Klik akun untuk mengisi username</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {users.slice(0, 4).map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 transition-all text-left group shadow-xs cursor-pointer"
                  >
                    <div className="p-2 rounded bg-slate-800 border border-slate-700/60 shrink-0">
                      {getRoleIcon(u.role)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white group-hover:text-blue-400 truncate">
                        {u.namaLengkap}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {u.role}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        <span className="text-slate-400 font-medium">Akun Terdaftar</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-7 shadow-xl relative">
              <div className="mb-6 text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">Masuk ke {settings.systemShortName || 'SIMBARS'}</h2>
                <p className="text-xs text-slate-400 mt-1">Masukkan kredensial akun {settings.appName || 'Rumah Sakit'} Anda</p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username / ID Pengguna
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="login-username-input"
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Masukkan Username..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Ketik kata sandi akun..."
                      className="w-full pl-9 pr-10 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Masuk & Buka Aplikasi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">
                  Wajib memasukkan kata sandi terdaftar untuk autentikasi keamanan sistem.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 sm:px-8 py-3.5 border-t border-slate-800 text-center text-[11px] text-slate-500">
        &copy; {new Date().getFullYear()} {settings.appName || 'Rumah Sakit Medika Insani'} • {settings.systemShortName || 'SIMBARS'} Inventory & Asset Management
      </footer>
    </div>
  );
};
