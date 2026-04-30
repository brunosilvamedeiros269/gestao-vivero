'use client';
import { Truck, Package, Tag, ArrowLeft, LayoutDashboard, Settings, Flower2, Briefcase, Map as MapIcon, Wifi, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import NotificationBell from '@/components/NotificationBell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const links = [
    { href: '/admin', label: t('dashboard'), icon: <LayoutDashboard size={20} /> },
    { href: '/admin/vendas', label: t('sales'), icon: <ShoppingBag size={20} /> },
    { href: '/admin/mapa', label: t('map'), icon: <MapIcon size={20} /> },
    { href: '/admin/iot', label: t('iot'), icon: <Wifi size={20} /> },
    { href: '/admin/especies', label: t('species'), icon: <Flower2 size={20} /> },
    { href: '/admin/clientes', label: t('customers'), icon: <Briefcase size={20} /> },
    { href: '/admin/compras', label: t('inventory'), icon: <Package size={20} /> },
    { href: '/admin/fornecedores', label: t('suppliers'), icon: <Truck size={20} /> },
    { href: '/admin/categorias', label: t('categories'), icon: <Tag size={20} /> },
    { href: '/admin/configuracoes', label: t('settings'), icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-container-lowest border-r border-surface-container-highest">
        <div className="p-6 border-b border-surface-container-highest flex items-center gap-2">
          <LeafLogo />
          <span className="font-bold text-lg text-primary tracking-tight">Admin Vivero</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 text-on-surface">
          {links.map(link => {
            const isActive = pathname.startsWith(link.href) && (link.href !== '/admin' || pathname === '/admin');
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                  isActive 
                  ? 'bg-primary-container text-on-primary-container' 
                  : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-container-highest">
          <Link href="/" className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition font-medium px-4 py-2">
            <ArrowLeft size={16} /> Voltar p/ o App
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="hidden md:flex items-center justify-end bg-surface border-b border-surface-container-highest p-4 px-8 sticky top-0 z-[100] shadow-md">
           <NotificationBell role="admin" />
        </div>
        
        <div className="flex-1 overflow-auto">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden bg-surface-container-lowest border-t border-surface-container-highest flex p-2 pb-6 justify-around">
          {links.map(link => {
             const isActive = pathname === link.href;
             return (
               <Link 
                 key={link.href} 
                 href={link.href}
                 className={`flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
               >
                 {link.icon}
                 <span className="text-[10px] mt-1 font-medium">{link.label}</span>
               </Link>
             );
          })}
        </nav>
      </div>
    </div>
  );
}

function LeafLogo() {
  return (
    <div className="bg-primary/20 p-1.5 rounded-lg">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
    </div>
  );
}
