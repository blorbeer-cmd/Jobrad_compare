import { type ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import './PageLayout.css';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="page-layout">
      <Header />
      <main className="page-layout__main">
        <div className="page-layout__container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
