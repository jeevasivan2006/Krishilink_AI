import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useScrollTop } from '@/hooks';

/**
 * Primary layout: Navbar → <Outlet/> → Footer
 * Used for all public-facing and authenticated routes.
 */
export default function MainLayout() {
  useScrollTop();
  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
