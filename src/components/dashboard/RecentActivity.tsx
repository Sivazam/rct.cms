'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  User, 
  RefreshCw, 
  Truck, 
  Package, 
  AlertTriangle,
  Calendar,
  Phone,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFirestoreDate } from '@/lib/date-utils';
import { getEntries, getLocations } from '@/lib/firestore';

interface Activity {
  id: string;
  type: 'entry' | 'renewal' | 'delivery';
  title: string;
  description: string;
  customerName: string;
  customerMobile: string;
  locationName: string;
  timestamp: any;
  status?: string;
  amount?: number;
  operatorName?: string;
}

interface RecentActivityProps {
  locationId?: string;
  dateRange?: { from: Date; to: Date };
  limit?: number;
}

export default function RecentActivity({ locationId, dateRange, limit = 10 }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    fetchLocations();
    fetchActivities();
  }, [locationId, dateRange]);

  const fetchLocations = async () => {
    try {
      const locationsData = await getLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.venueName : 'Unknown Location';
  };

  const fetchActivities = async (showAll: boolean = false) => {
    try {
      setLoading(true);
      
      // Fetch all entries and filter for different activity types
      const allEntries = await getEntries({ 
        locationId: locationId === 'all' ? undefined : locationId 
      });

      const allActivities: Activity[] = [];

      // Process entries with renewals
      allEntries.forEach(entry => {
        // Add the initial entry as an activity
        allActivities.push({
          id: `entry-${entry.id}`,
          type: 'entry',
          title: 'New Entry',
          description: `Ash pot entry created`,
          customerName: entry.customerName,
          customerMobile: entry.customerMobile,
          locationName: getLocationName(entry.locationId),
          timestamp: entry.entryDate,
          status: entry.status,
          operatorName: entry.operatorName
        });

        // Add renewals as separate activities
        if (entry.renewals && Array.isArray(entry.renewals)) {
          entry.renewals.forEach((renewal: any, index: number) => {
            allActivities.push({
              id: `renewal-${entry.id}-${index}`,
              type: 'renewal',
              title: 'Renewal Processed',
              description: `Renewed for ${renewal.months || 1} month(s)`,
              customerName: entry.customerName,
              customerMobile: entry.customerMobile,
              locationName: getLocationName(entry.locationId),
              timestamp: renewal.date,
              amount: renewal.amount,
              operatorName: entry.operatorName
            });
          });
        }

        // Add delivery as activity if dispatched
        if (entry.status === 'dispatched' && entry.deliveryDate) {
          allActivities.push({
            id: `delivery-${entry.id}`,
            type: 'delivery',
            title: 'Ash Pot Dispatched',
            description: entry.dispatchReason || 'Dispatched to family',
            customerName: entry.customerName,
            customerMobile: entry.customerMobile,
            locationName: getLocationName(entry.locationId),
            timestamp: entry.deliveryDate,
            status: entry.status,
            operatorName: entry.operatorName
          });
        }
      });

      // Sort by timestamp (most recent first)
      allActivities.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });

      // Apply date range filtering if specified
      let filteredActivities = allActivities;
      if (dateRange) {
        filteredActivities = allActivities.filter(activity => {
          const activityDate = activity.timestamp?.toDate ? activity.timestamp.toDate() : new Date(activity.timestamp);
          return activityDate >= dateRange.from && activityDate <= dateRange.to;
        });
      }

      // Use a higher limit when showing all activities
      const activityLimit = showAll ? 100 : limit;
      setActivities(filteredActivities.slice(0, activityLimit));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'entry':
        return <Package className="h-4 w-4" />;
      case 'renewal':
        return <RefreshCw className="h-4 w-4" />;
      case 'delivery':
        return <Truck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'entry':
        return 'bg-accent text-primary border-accent';
      case 'renewal':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'delivery':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getActivityBadgeVariant = (type: Activity['type']) => {
    switch (type) {
      case 'entry':
        return 'default';
      case 'renewal':
        return 'secondary';
      case 'delivery':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest entries, renewals, and deliveries across the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No recent activity found</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm text-gray-900">
                      {activity.title}
                    </h4>
                    <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {activity.description}
                  </p>
                  
                  <div className="flex flex-col space-y-1 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <User className="h-3 w-3" />
                      <span>{activity.customerName}</span>
                      <Phone className="h-3 w-3 ml-2" />
                      <span>{activity.customerMobile}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span>{activity.locationName}</span>
                      {activity.operatorName && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span>by {activity.operatorName}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {activity.timestamp ? formatFirestoreDate(activity.timestamp) : 'N/A'}
                        </span>
                      </div>
                      
                      {activity.amount && (
                        <span className="font-medium text-green-600">
                          ₹{activity.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                // Toggle between showing limited and all activities
                if (activities.length >= 100) {
                  // Currently showing all, show limited
                  fetchActivities(false);
                } else {
                  // Currently showing limited, show all
                  fetchActivities(true);
                }
              }}
            >
              {activities.length >= 100 ? 'Show Less Activity' : 'View All Activity'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}