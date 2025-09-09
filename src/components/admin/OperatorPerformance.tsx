'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  RefreshCw,
  Truck,
  Download,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { getActiveOperators, getOperatorStats, getOperatorTransactions } from '@/lib/firestore';
import { motion } from 'framer-motion';

interface OperatorPerformance {
  operatorId: string;
  operatorName: string;
  operatorEmail: string;
  totalEntries: number;
  totalRenewals: number;
  totalDeliveries: number;
  totalRevenue: number;
  todayEntries: number;
  todayRevenue: number;
  thisWeekEntries: number;
  thisWeekRevenue: number;
  thisMonthEntries: number;
  thisMonthRevenue: number;
}

interface Transaction {
  id: string;
  type: 'entry' | 'renewal' | 'delivery';
  amount: number;
  date: Date | null;
  customerName: string;
  operatorName: string;
  locationName: string;
}

type TimeRange = 'today' | 'week' | 'month' | 'custom';

export default function OperatorPerformance() {
  const [operators, setOperators] = useState<OperatorPerformance[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchOperatorsPerformance();
  }, []);

  useEffect(() => {
    if (selectedOperator) {
      fetchOperatorTransactions();
    }
  }, [selectedOperator, timeRange, dateRange]);

  const fetchOperatorsPerformance = async () => {
    try {
      setLoading(true);
      const activeOperators = await getActiveOperators();
      
      const performanceData = await Promise.all(
        activeOperators.map(async (operator) => {
          const stats = await getOperatorStats(operator.id);
          return {
            operatorId: operator.id,
            operatorName: operator.name,
            operatorEmail: operator.email,
            totalEntries: stats.totalEntries || 0,
            totalRenewals: stats.totalRenewals || 0,
            totalDeliveries: stats.totalDeliveries || 0,
            totalRevenue: stats.totalRevenue || 0,
            todayEntries: stats.todayEntries || 0,
            todayRevenue: stats.todayRevenue || 0,
            thisWeekEntries: stats.thisWeekEntries || 0,
            thisWeekRevenue: stats.thisWeekRevenue || 0,
            thisMonthEntries: stats.thisMonthEntries || 0,
            thisMonthRevenue: stats.thisMonthRevenue || 0
          };
        })
      );
      
      setOperators(performanceData);
      
      // Auto-select first operator
      if (performanceData.length > 0 && !selectedOperator) {
        setSelectedOperator(performanceData[0].operatorId);
      }
    } catch (error) {
      console.error('Error fetching operators performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatorTransactions = async () => {
    if (!selectedOperator) return;
    
    try {
      setStatsLoading(true);
      const transactionsData = await getOperatorTransactions(selectedOperator, timeRange, dateRange);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching operator transactions:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const getSelectedOperatorData = () => {
    return operators.find(op => op.operatorId === selectedOperator);
  };

  const getDateRangeLabel = () => {
    switch (timeRange) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom':
        return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
      default:
        return 'This Month';
    }
  };

  const getStatForTimeRange = (operator: OperatorPerformance) => {
    switch (timeRange) {
      case 'today':
        return { entries: operator.todayEntries, revenue: operator.todayRevenue };
      case 'week':
        return { entries: operator.thisWeekEntries, revenue: operator.thisWeekRevenue };
      case 'month':
      case 'custom':
      default:
        return { entries: operator.thisMonthEntries, revenue: operator.thisMonthRevenue };
    }
  };

  const exportData = () => {
    const operator = getSelectedOperatorData();
    if (!operator) return;

    const csvContent = [
      ['Date', 'Type', 'Customer', 'Amount', 'Location'],
      ...transactions.map(t => [
        t.date ? format(t.date, 'yyyy-MM-dd') : 'Unknown',
        t.type,
        t.customerName,
        t.amount.toString(),
        t.locationName
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${operator.operatorName}_transactions_${getDateRangeLabel()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedOperatorData = getSelectedOperatorData();
  const currentStats = selectedOperatorData ? getStatForTimeRange(selectedOperatorData) : { entries: 0, revenue: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">Operator Performance</h2>
          <p className="text-sm text-gray-600">Track operator performance and collections</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={fetchOperatorsPerformance}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Operator Selection and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Select Operator</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Operator</label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an operator" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((operator) => (
                    <SelectItem key={operator.operatorId} value={operator.operatorId}>
                      {operator.operatorName} ({operator.operatorEmail})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timeRange === 'custom' && (
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(dateRange.from, 'MMM dd')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(dateRange.to, 'MMM dd')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      {selectedOperatorData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entries</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{currentStats.entries}</div>
                <p className="text-xs text-gray-500">
                  {getDateRangeLabel()}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{currentStats.revenue.toLocaleString()}</div>
                <p className="text-xs text-gray-500">
                  {getDateRangeLabel()}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Renewals</CardTitle>
                <RefreshCw className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{selectedOperatorData.totalRenewals}</div>
                <p className="text-xs text-gray-500">
                  Total
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
                <Truck className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{selectedOperatorData.totalDeliveries}</div>
                <p className="text-xs text-gray-500">
                  Total
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Transaction History</span>
            <Badge variant="outline">{getDateRangeLabel()}</Badge>
          </CardTitle>
          <CardDescription>
            Detailed transaction history for the selected operator
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.date ? format(transaction.date, 'MMM dd, yyyy') : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            transaction.type === 'entry' ? 'default' :
                            transaction.type === 'renewal' ? 'secondary' : 'outline'
                          }>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.customerName}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          +₹{transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-500">{transaction.locationName}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No transactions found for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}