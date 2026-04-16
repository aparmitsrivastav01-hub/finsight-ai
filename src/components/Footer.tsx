import { TrendingUp, Twitter, Linkedin, Github } from 'lucide-react';

const footerLinks: Record<string, string[]> = {
  Product: ['Features', 'FinGPT', 'Pricing', 'Changelog', 'Roadmap'],
  Company: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'],
};

const socials = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
];

export default function Footer() {
  return (
    <footer
      className="bg-obsidian border-t border-border-mist"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <a href="#" className="inline-flex items-start gap-2.5 mb-4 group">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-teal-core/10 border border-teal-core/30 flex items-center justify-center group-hover:bg-teal-core/20 transition-all duration-200">
                <TrendingUp className="w-4 h-4 text-teal-core" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-lg leading-tight text-soft-white">
                  Fin<span className="text-teal-core">Sight</span>
                </span>
                <span className="font-body text-[10px] text-muted-ink leading-tight tracking-wide">
                  AI-powered financial insights
                </span>
              </div>
            </a>
            <p className="font-body text-sm text-muted-ink leading-relaxed max-w-xs mb-6">
              The AI-native platform for financial statement analysis. Built for analysts, investors,
              and CFOs who need insight at machine speed.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg border border-border-mist bg-surface-dark flex items-center justify-center text-muted-ink hover:text-teal-core hover:border-teal-core/40 transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-sans font-semibold text-sm text-soft-white mb-4 tracking-wide">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="font-body text-sm text-muted-ink hover:text-soft-white transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border-mist" />

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-muted-ink">
            © {new Date().getFullYear()} FinSight Technologies, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-core animate-pulse-slow" />
            <span className="font-mono text-xs text-muted-ink">
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
