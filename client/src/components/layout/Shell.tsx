import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Upload, 
  TrendingUp, 
  GitCompare, 
  Tags, 
  Settings,
  Activity
} from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/trends', label: 'Trends', icon: TrendingUp },
    { href: '/correlations', label: 'Correlations', icon: GitCompare },
    { href: '/tags', label: 'Context Tags', icon: Tags },
    { href: '/import', label: 'Import Data', icon: Upload },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <Activity size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight">JoshHealthHub</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <Icon size={18} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs font-mono text-muted-foreground">Local-first mode</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">v0.1.0 • Alpha</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="md:hidden h-14 border-b border-border flex items-center px-4 bg-card">
           <span className="font-bold">JoshHealthHub</span>
           {/* Mobile menu toggle would go here */}
        </header>
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
