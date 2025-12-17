'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDispatchedLockers } from '@/lib/firestore';
import { formatFirestoreDate } from '@/lib/date-utils';

export default function TestDispatchedLockers() {
  const [dispatchedItems, setDispatchedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🧪 [TestPage] Fetching dispatched lockers...');
      
      const data = await getDispatchedLockers();
      console.log('🧪 [TestPage] Received data:', data);
      console.log('🧪 [TestPage] Data length:', data.length);
      
      setDispatchedItems(data);
    } catch (err: any) {
      console.error('🧪 [TestPage] Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Dispatched Lockers Test</h1>
        <p className="text-muted-foreground">This page tests the dispatched lockers functionality</p>
      </div>

      <div className="mb-4">
        <Button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Results ({dispatchedItems.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : dispatchedItems.length === 0 ? (
            <p>No dispatched items found</p>
          ) : (
            <div className="space-y-4">
              {dispatchedItems.map((item, index) => (
                <div key={item.id} className="border rounded p-4">
                  <h3 className="font-semibold mb-2">
                    {index + 1}. {item.originalEntryData?.customerName || 'Unknown Customer'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Source:</strong> {item.sourceCollection}
                    </div>
                    <div>
                      <strong>Mobile:</strong> {item.originalEntryData?.customerMobile || 'N/A'}
                    </div>
                    <div>
                      <strong>Location:</strong> {item.originalEntryData?.locationName || 'N/A'}
                    </div>
                    <div>
                      <strong>Location ID:</strong> {item.originalEntryData?.locationId || item.locationId || 'N/A'}
                    </div>
                    <div>
                      <strong>Reason:</strong> {item.dispatchInfo?.dispatchReason || 'N/A'}
                    </div>
                    <div>
                      <strong>Dispatch Date:</strong> {item.dispatchInfo?.dispatchDate ? 
                        formatFirestoreDate(item.dispatchInfo.dispatchDate) : 'N/A'}
                    </div>
                    <div>
                      <strong>Pots Dispatched:</strong> {item.dispatchInfo?.potsDispatched || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}