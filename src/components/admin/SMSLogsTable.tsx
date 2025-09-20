'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedDateRangePicker } from '@/components/ui/enhanced-date-range-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  RefreshCw, 
  Download, 
  Search, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Phone,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';
import SMSLogsService, { SMSLog, SMSLogFilters } from '@/lib/sms-logs';
const smsLogsService = new SMSLogsService();
import { formatFirestoreDate } from '@/lib/date-utils';
import { useAuth } from '@/contexts/AuthContext';

interface SMSLogsTableProps {
  className?: string;
}

export default function SMSLogsTable({ className }: SMSLogsTableProps) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<SMSLogFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    fetchSMSLogs();
  }, [filters]);

  const fetchSMSLogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const logsData = await smsLogsService.getSMSLogs(filters);
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      setError('Failed to load SMS logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailedSMS = async () => {
    try {
      setRetryLoading(true);
      
      // Call the retry function (this would be implemented as a Firebase Function)
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh the logs
      await fetchSMSLogs();
    } catch (error) {
      console.error('Error retrying failed SMS:', error);
      setError('Failed to retry SMS messages');
    } finally {
      setRetryLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Date', 'Type', 'Recipient', 'Status', 'Message', 'Error'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        formatFirestoreDate(log.timestamp),
        log.type,
        log.recipient,
        log.status,
        `"${log.message.replace(/"/g, '""')}"`,
        log.errorMessage || ''
      ].join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.recipient.toLowerCase().includes(searchLower) ||
      log.message.toLowerCase().includes(searchLower) ||
      log.type.toLowerCase().includes(searchLower) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(searchLower))
    );
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ENTRY_REMINDER_7_DAYS':
      case 'ENTRY_REMINDER_3_DAYS':
      case 'ENTRY_REMINDER_0_DAYS':
        return <Calendar className="h-4 w-4" />;
      case 'DISPOSAL_WARNING_60_DAYS':
      case 'FINAL_DISPOSAL_NOTICE':
        return <AlertTriangle className="h-4 w-4" />;
      case 'RENEWAL_NOTIFICATION':
      case 'DISPATCH_NOTIFICATION':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const failedSMSCount = logs.filter(log => log.status === 'failed').length;
  const totalSMSCount = logs.length;
  const successRate = totalSMSCount > 0 ? ((totalSMSCount - failedSMSCount) / totalSMSCount * 100).toFixed(1) : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`space-y-6 ${className}`}
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>SMS Logs</span>
          </CardTitle>
          <CardDescription>
            View and manage all SMS communications sent through the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalSMSCount}</div>
              <div className="text-sm text-blue-800">Total SMS</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalSMSCount - failedSMSCount}</div>
              <div className="text-sm text-green-800">Successful</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedSMSCount}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
              <div className="text-sm text-purple-800">Success Rate</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type || 'all'} onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? undefined : value })}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ENTRY_REMINDER_7_DAYS">7 Days Reminder</SelectItem>
                <SelectItem value="ENTRY_REMINDER_3_DAYS">3 Days Reminder</SelectItem>
                <SelectItem value="ENTRY_REMINDER_0_DAYS">0 Days Reminder</SelectItem>
                <SelectItem value="DISPOSAL_WARNING_60_DAYS">Disposal Warning</SelectItem>
                <SelectItem value="FINAL_DISPOSAL_NOTICE">Final Disposal</SelectItem>
                <SelectItem value="RENEWAL_NOTIFICATION">Renewal Notification</SelectItem>
                <SelectItem value="DISPATCH_NOTIFICATION">Dispatch Notification</SelectItem>
              </SelectContent>
            </Select>

            <EnhancedDateRangePicker
              value={filters.dateRange}
              onChange={(range) => setFilters({ ...filters, dateRange: range })}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button onClick={fetchSMSLogs} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {failedSMSCount > 0 && (
              <Button onClick={handleRetryFailedSMS} disabled={retryLoading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${retryLoading ? 'animate-spin' : ''}`} />
                Retry Failed ({failedSMSCount})
              </Button>
            )}
            
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="w-32">Recipient</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-48">Message</TableHead>
                  <TableHead className="w-32">Error</TableHead>
                  <TableHead className="w-16">Retry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        Loading SMS logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">No SMS logs found</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatFirestoreDate(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(log.type)}
                          <span className="text-sm">{log.type.replace(/_/g, ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{log.recipient}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs truncate" title={log.message}>
                          {log.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.errorMessage ? (
                          <div className="text-sm text-red-600 max-w-xs truncate" title={log.errorMessage}>
                            {log.errorMessage}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {log.retryCount > 0 ? `${log.retryCount}x` : '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredLogs.length > itemsPerPage && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredLogs.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredLogs.length / itemsPerPage)}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}