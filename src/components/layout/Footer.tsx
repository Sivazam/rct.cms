"use client"

import Link from "next/link"
import { Phone, Mail, MapPin, Calendar } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-amber-900 text-amber-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Organization Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-amber-700 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-amber-50" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-50">Cremation Management System</h3>
                <p className="text-amber-200 text-sm">Rotary Charitable Trust</p>
              </div>
            </div>
            <p className="text-amber-200 mb-4 leading-relaxed">
              A comprehensive cremation management system dedicated to providing dignified and respectful services 
              for ash pot storage, renewal management, and Dispatch coordination. Serving the community with 
              compassion and excellence.
            </p>
            <div className="flex items-center space-x-2 text-amber-200">
              <span className="text-sm">© {currentYear} All Rights Reserved to CMS</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-amber-50 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-amber-200 hover:text-amber-50 transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-amber-200 hover:text-amber-50 transition-colors text-sm">
                  Login
                </Link>
              </li>
              <li>
                <a href="#" className="text-amber-200 hover:text-amber-50 transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-amber-200 hover:text-amber-50 transition-colors text-sm">
                  Services
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold text-amber-50 mb-4">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-200 text-sm font-medium">Phone</p>
                  <a 
                    href="tel:+919876543210" 
                    className="text-amber-50 hover:text-amber-100 transition-colors text-sm"
                  >
                    +91 98765 43210
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-200 text-sm font-medium">Email</p>
                  <a 
                    href="mailto:info@rotarycremation.org" 
                    className="text-amber-50 hover:text-amber-100 transition-colors text-sm"
                  >
                    info@rotarycremation.org
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-200 text-sm font-medium">Locations</p>
                  <p className="text-amber-50 text-sm">
                    Multiple locations across the city
                  </p>
                  <p className="text-amber-200 text-xs mt-1">
                    Visit any of our service centers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-amber-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-amber-200 text-sm">
                Build by HartTe Labs | Designed with ❤️ for Rotary Charitable Trust
              </p>
            </div>
            <div className="flex items-center justify-center space-x-6 text-amber-200 text-sm">
              <a href="#" className="hover:text-amber-50 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-amber-50 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-amber-50 transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}