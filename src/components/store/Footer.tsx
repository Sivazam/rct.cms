import Link from 'next/link';


export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section with Logo */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img
                    src="/logo-original.png"
                    alt="Sanathan Rudraksha Logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="text-center">
                  <span
                    className="block text-lg font-bold font-spiritual leading-none"
                    style={{ color: '#d4a574' }}
                  >
                    SANATHAN
                  </span>
                  <span
                    className="block text-xs font-bold font-spiritual -mt-1 leading-tight"
                    style={{ color: '#d4a574' }}
                  >
                    RUDRAKSHA
                  </span>
                </div>
              </div>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Authentic Rudraksha beads and spiritual products for your journey towards inner peace and enlightenment.
            </p>
          </div>
         
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-amber-400 transition-colors">Home</Link></li>
              <li><Link href="/my-favorites" className="hover:text-amber-400 transition-colors">My Favorites</Link></li>
              <li><Link href="/my-orders" className="hover:text-amber-400 transition-colors">My Orders</Link></li>
              <li><Link href="/profile" className="hover:text-amber-400 transition-colors">My Profile</Link></li>
            </ul>
          </div>
         
          {/* Account & Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Account & Support</h3>
            <ul className="space-y-2">
              <li><Link href="/auth/login" className="hover:text-amber-400 transition-colors">Login / Signup</Link></li>
              <li><Link href="/addresses" className="hover:text-amber-400 transition-colors">Manage Addresses</Link></li>
              <li><Link href="/cart" className="hover:text-amber-400 transition-colors">Shopping Cart</Link></li>
              <li><Link href="/checkout" className="hover:text-amber-400 transition-colors">Checkout</Link></li>
            </ul>
          </div>
         
          {/* Contact Info */} 
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Get In Touch</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2">
                <span className="text-amber-400">📧</span>
                <span>sanathanrudraksha@gmail.com</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400">📞</span>
                <span>+91 9177227726</span>
              </li>
              <li className="flex items-start space-x-2">
                <span>No Return | No Exchange</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2025 Sanathan Rudraksha. Built by FactInMedia.
            </p>
            <div className="flex space-x-4 text-sm text-gray-400">
              <Link href="/" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
              <Link href="/" className="hover:text-amber-400 transition-colors">Terms of Service</Link>
              <Link href="/" className="hover:text-amber-400 transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
