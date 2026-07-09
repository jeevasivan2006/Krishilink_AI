import { Link } from 'react-router-dom';
import { Sprout, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { ROUTES, APP_NAME } from '@/constants';

const footerLinks = {
  Platform: [
    { label: 'For Farmers', to: ROUTES.REGISTER },
    { label: 'For Drivers', to: ROUTES.REGISTER },
    { label: 'Live Tracking', to: ROUTES.HOME },
    { label: 'Pricing',       to: ROUTES.HOME },
  ],
  Company: [
    { label: 'About Us',   to: ROUTES.HOME },
    { label: 'Careers',    to: ROUTES.HOME },
    { label: 'Blog',       to: ROUTES.HOME },
    { label: 'Press',      to: ROUTES.HOME },
  ],
  Support: [
    { label: 'Help Center', to: ROUTES.HOME },
    { label: 'Contact Us',  to: ROUTES.HOME },
    { label: 'Privacy',     to: ROUTES.HOME },
    { label: 'Terms',       to: ROUTES.HOME },
  ],
};

const socials = [
  { icon: <Twitter size={18} />,   href: '#', label: 'Twitter'   },
  { icon: <Instagram size={18} />, href: '#', label: 'Instagram' },
  { icon: <Linkedin size={18} />,  href: '#', label: 'LinkedIn'  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Link to={ROUTES.HOME} className="flex items-center gap-2 w-fit">
              <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <Sprout size={20} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Krishi<span className="text-primary-400">Link</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-xs text-gray-400">
              Intelligent transportation platform connecting farmers with trusted transport providers.
              Fresh produce, on time, every time.
            </p>

            {/* Contact */}
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <Mail size={14} className="shrink-0 text-primary-500" />
                support@krishilink.com
              </span>
              <span className="flex items-center gap-2">
                <Phone size={14} className="shrink-0 text-primary-500" />
                +91 98765 43210
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={14} className="shrink-0 text-primary-500" />
                Bengaluru, Karnataka, India
              </span>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-3">
              {socials.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link to={ROUTES.HOME} className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link to={ROUTES.HOME} className="hover:text-gray-300 transition-colors">Terms of Service</Link>
            <Link to={ROUTES.HOME} className="hover:text-gray-300 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
