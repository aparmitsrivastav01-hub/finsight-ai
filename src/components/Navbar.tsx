import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';
import { Link } from "react-router-dom";

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '#features' },
  { label: 'FinGPT', href: '/fingpt' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-obsidian/90 backdrop-blur-xl border-b border-border-mist shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-start gap-2.5 group"
          >
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-teal-core/10 border border-teal-core/30 flex items-center justify-center group-hover:bg-teal-core/20 group-hover:border-teal-core/60 transition-all duration-200">
              <img src={logo} alt="FinSight Logo" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-700 text-lg leading-tight text-soft-white tracking-tight">
                Fin<span className="text-teal-core">Sight</span>
              </span>
              <span className="font-body text-[10px] text-muted-ink leading-tight tracking-wide">
                Finance Made Easy
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.href.startsWith('/') ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="relative px-4 py-2 text-sm text-muted-ink hover:text-soft-white transition rounded-lg hover:bg-white/5 group"
                >
                  {link.label}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-teal-core group-hover:w-4 transition-all duration-200" />
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="relative px-4 py-2 text-sm text-muted-ink hover:text-soft-white transition rounded-lg hover:bg-white/5 group"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#login"
              className="px-5 py-2 text-sm text-teal-core border border-teal-core/40 rounded-lg hover:bg-teal-core hover:text-obsidian transition"
            >
              Login
            </a>
          </div>

          {/* Mobile Button */}
          <button
            className="md:hidden p-2 text-muted-ink hover:text-soft-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-obsidian/95 border-t border-border-mist px-4 py-4 space-y-2">
          {navLinks.map((link) =>
            link.href.startsWith('/') ? (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-muted-ink hover:text-soft-white"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-muted-ink hover:text-soft-white"
              >
                {link.label}
              </a>
            )
          )}
        </div>
      )}
    </header>
  );
}