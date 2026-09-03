import React from 'react';
import { AppSettings } from '../types/inventory';
import { 
  Building2, 
  Activity, 
  ShieldCheck, 
  Boxes, 
  Heart, 
  Stethoscope, 
  Wrench,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

interface AppLogoProps {
  settings?: AppSettings;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PRESET_ICONS = [
  { id: 'Building2', name: 'Gedung / RS', icon: Building2 },
  { id: 'Activity', name: 'Elektromedik / Pulse', icon: Activity },
  { id: 'ShieldCheck', name: 'Keamanan & K3', icon: ShieldCheck },
  { id: 'Boxes', name: 'Logistik & Inventaris', icon: Boxes },
  { id: 'Heart', name: 'Kesehatan / Medis', icon: Heart },
  { id: 'Stethoscope', name: 'Klinis & Perawatan', icon: Stethoscope },
  { id: 'Wrench', name: 'IPSRS / Teknisi', icon: Wrench },
  { id: 'Package', name: 'Paket Aset', icon: Package },
  { id: 'Layers', name: 'Sarana & Prasarana', icon: Layers },
];

export const COLOR_PALETTES = [
  { id: 'bg-blue-600', name: 'Medical Blue', preview: '#2563eb' },
  { id: 'bg-emerald-600', name: 'Hospital Emerald', preview: '#059669' },
  { id: 'bg-teal-600', name: 'Clinical Teal', preview: '#0d9488' },
  { id: 'bg-indigo-600', name: 'Deep Indigo', preview: '#4f46e5' },
  { id: 'bg-violet-600', name: 'Royal Violet', preview: '#7c3aed' },
  { id: 'bg-rose-600', name: 'Emergency Rose', preview: '#e11d48' },
  { id: 'bg-amber-600', name: 'Golden Amber', preview: '#d97706' },
  { id: 'bg-cyan-600', name: 'Modern Cyan', preview: '#0891b2' },
  { id: 'bg-slate-800', name: 'Corporate Dark', preview: '#1e293b' },
];

export const getPresetIconComponent = (iconName?: string) => {
  const found = PRESET_ICONS.find(p => p.id === iconName);
  return found ? found.icon : Building2;
};

export const AppLogo: React.FC<AppLogoProps> = ({
  settings,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-16 h-16 text-lg',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-8 h-8',
  };

  const logoType = settings?.logoType || 'initials';
  const bgColor = settings?.logoBgColor || 'bg-blue-600';
  const textColor = settings?.logoTextColor || 'text-white';
  const rawInitials = settings?.logoInitials !== undefined && settings?.logoInitials !== null ? settings.logoInitials.trim() : '';
  const initials = rawInitials || (settings?.appName ? settings.appName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() : 'MI') || 'MI';

  if (logoType === 'image' && settings?.logoImageUrl) {
    return (
      <div className={`overflow-hidden rounded-lg border border-slate-200/40 flex items-center justify-center bg-white shadow-xs ${sizeClasses[size]} ${className}`}>
        <img
          src={settings.logoImageUrl}
          alt={settings.appName || 'Logo Aplikasi'}
          className="w-full h-full object-contain p-0.5"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // fallback
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  if (logoType === 'preset') {
    const IconComp = getPresetIconComponent(settings?.logoPresetIcon);
    return (
      <div className={`rounded-lg flex items-center justify-center ${bgColor} ${textColor} shadow-xs font-bold ${sizeClasses[size]} ${className}`}>
        <IconComp className={iconSizes[size]} />
      </div>
    );
  }

  // default: initials
  return (
    <div className={`rounded-lg flex items-center justify-center font-bold tracking-tight ${bgColor} ${textColor} shadow-xs ${sizeClasses[size]} ${className}`}>
      {initials.slice(0, 4)}
    </div>
  );
};
