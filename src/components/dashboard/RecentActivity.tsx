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
import { getEntries, getLocations, getDispatchedLockers } from '@/lib/firestore';

interface Activity {
  id: string;
  type: 'entry' | 'renewal' | 'delivery' | 'partial-dispatch';
  title: string;
  description: string;
  customerName: string;
  customerMobile: string;
  locationName: string;
  timestamp: any;
  status?: string;
  amount?: number;
  operatorName?: string;
  potsDispatched?: number;
  remainingPots?: number;
}

interface RecentActivityProps {
  locationId?: string;
  dateRange?: { from: Date; to: Date };
  limit?: number;
}

export default function RecentActivity({ locationId, dateRange, limit = 5 }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);

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
      
      // Fetch all entries and dispatched lockers
      const allEntries = await getEntries({ 
        locationId: locationId === 'all' ? undefined : locationId 
      });
      
      const dispatchedLockers = await getDispatchedLockers({ 
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

      // Process partial dispatches from dispatchedLockers collection
      dispatchedLockers.forEach((dispatchedLocker: any) => {
        const dispatchInfo = dispatchedLocker.dispatchInfo;
        const originalEntryData = dispatchedLocker.originalEntryData;
        
        if (dispatchInfo && originalEntryData) {
          allActivities.push({
            id: `partial-dispatch-${dispatchedLocker.id}`,
            type: 'partial-dispatch',
            title: 'Partial Dispatch',
            description: `${dispatchInfo.potsDispatched} pot(s) dispatched, ${dispatchInfo.totalRemainingPots} remaining`,
            customerName: originalEntryData.customerName,
            customerMobile: originalEntryData.customerMobile,
            locationName: getLocationName(originalEntryData.locationId),
            timestamp: dispatchInfo.dispatchDate,
            status: dispatchInfo.dispatchType,
            operatorName: dispatchInfo.dispatchedBy,
            potsDispatched: dispatchInfo.potsDispatched,
            remainingPots: dispatchInfo.totalRemainingPots
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

      // Always fetch more data but limit display
      const activityLimit = 100; // Fetch more data for better sorting
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
      case 'partial-dispatch':
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
        return 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'delivery':
        return 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'partial-dispatch':
        return 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
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
      case 'partial-dispatch':
        return 'secondary';
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
                <div className="h-16 bg-muted rounded"></div>
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
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No recent activity found</p>
            </div>
          ) : (
            activities.slice(0, showAll ? activities.length : limit).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm text-foreground">
                      {activity.title}
                    </h4>
                    <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {activity.description}
                  </p>
                  
                  <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
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
                          <span className="text-muted-foreground">•</span>
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
                        <span className="font-medium text-green-600 dark:text-green-400">
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
        
        {activities.length > limit && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less Activity' : 'View All Activity'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}