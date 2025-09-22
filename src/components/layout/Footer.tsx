"use client"

import Link from "next/link"
import { Phone, Mail, MapPin, Calendar } from "lucide-react"
import Image from "next/image"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Organization Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              {/* Logo Container */}
              <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center drop-shadow-lg flex-shrink-0">
                <div className="w-12 h-12">
                  <Image
                    src="/logo.webp"
                    alt="Cremation Management System Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'absolute inset-0 flex items-center justify-center text-muted-foreground text-xl font-bold';
                      fallback.textContent = 'CMS';
                      target.parentNode?.appendChild(fallback);
                    }}
                  />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-primary-foreground truncate">Cremation Management System</h3>
                <p className="text-primary-foreground/80 text-sm">Rotary Charitable Trust</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 mb-4 leading-relaxed text-sm sm:text-base">
              A comprehensive cremation management system dedicated to providing dignified and respectful services 
              for ash pot storage, renewal management, and Dispatch coordination. Serving the community with 
              compassion and excellence.
            </p>
            <div className="flex items-center space-x-2 text-primary-foreground/80">
              <span className="text-xs sm:text-sm">© {currentYear} All Rights Reserved to CMS</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-primary-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                  Login
                </Link>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm">
                  Services
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold text-primary-foreground mb-4">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-primary-foreground/80 text-sm font-medium">Phone</p>
                  <a 
                    href="tel:+919876543210" 
                    className="text-primary-foreground hover:text-primary-foreground/90 transition-colors text-sm break-all"
                  >
                    +91 98765 43210
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-primary-foreground/80 text-sm font-medium">Email</p>
                  <a 
                    href="mailto:info@rotarycremation.org" 
                    className="text-primary-foreground hover:text-primary-foreground/90 transition-colors text-sm break-all"
                  >
                    info@rotarycremation.org
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-primary-foreground/80 text-sm font-medium">Locations</p>
                  <p className="text-primary-foreground text-sm">
                    Multiple locations across the city
                  </p>
                  <p className="text-primary-foreground/80 text-xs mt-1">
                    Visit any of our service centers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary mt-8 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="text-center lg:text-left">
              <p className="text-primary-foreground/80 text-sm">
                Build by HartTe Labs | Designed with ❤️ for Rotary Charitable Trust
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-primary-foreground/80 text-sm">
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}