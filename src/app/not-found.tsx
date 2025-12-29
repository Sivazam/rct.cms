import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-6xl mb-4">🙏</div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          
          <p className="text-gray-600 mb-6">
            The spiritual product or page you're looking for seems to have wandered off on its own journey.
          </p>
          
          <div className="space-y-3">
            <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Return to Homepage
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/categories">
                <Search className="h-4 w-4 mr-2" />
                Browse Categories
              </Link>
            </Button>
          </div>
          
          <div className="mt-8 p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              Looking for something specific? Try searching or browse our collection of authentic spiritual products.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}