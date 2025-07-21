import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Header />
      <main className="relative z-10 pb-8">
        {children}
      </main>
    </>
  );
};