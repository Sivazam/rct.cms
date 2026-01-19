'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileUp, X, Check, AlertTriangle, Download, Loader2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getEntries, getLocations, getOccupiedLockers } from '@/lib/firestore';

interface CSVRow {
  deceased_person_name: string;
  mobile_number: string;
  city: string;
  additional_details: string;
  total_pots: number;
  payment_method: string;
  entry_date: string;
  location: string;
  locker_number: number;
}

interface ValidationResult {
  valid: boolean;
  error: string;
}

interface ParsedEntry {
  rowNumber: number;
  deceasedPersonName: string;
  mobile: string;
  city: string;
  additionalDetails: string;
  totalPots: number;
  paymentMethod: 'cash' | 'upi';
  entryDate: Date;
  locationName: string;
  lockerNumber: number;
  errors: string[];
  isDuplicate: boolean;
  hasLockerConflict: boolean;
  conflictDetails?: string;
}

interface BulkEntryUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BulkEntryUpload({ onSuccess, onCancel }: BulkEntryUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    lockerConflicts: number;
    duplicates: number;
    errors: { row: number; error: string }[];
  }>({ successful: 0, failed: 0, lockerConflicts: 0, duplicates: 0, errors: [] });
  const [locations, setLocations] = useState<any[]>([]);
  const [occupiedLockers, setOccupiedLockers] = useState<Map<string, number[]>>(new Map());

  // Load locations on mount
  useState(() => {
    getLocations().then(locs => {
      setLocations(locs.filter(loc => loc.isActive));
    });
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    // Parse CSV character by character to handle quoted fields with embedded newlines
    const lines = text.split('\n');
    const headers: string[] = [];
    const rows: CSVRow[] = [];

    // Parse headers - collect all quoted fields until we have 9 headers
    let headerIndex = 0;
    const expectedHeaders = 9;
    let currentHeader = '';
    let inQuotes = false;

    for (const line of lines) {
      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          headers.push(currentHeader.trim().replace(/\n/g, '').replace(/\r/g, ''));
          currentHeader = '';
          headerIndex++;
        } else {
          currentHeader += char;
        }
      }

      // Add the last header field when ending a quoted section
      if (inQuotes) {
        // Continue to next line for embedded newline
        continue;
      } else if (currentHeader.trim()) {
        headers.push(currentHeader.trim().replace(/\n/g, '').replace(/\r/g, ''));
        currentHeader = '';
        headerIndex++;
      }

      // Stop when we have all expected headers
      if (headers.length >= expectedHeaders) {
        break;
      }
    }

    // Find the line index where data starts (after headers)
    let dataStartLine = 0;
    for (let i = 0; i < lines.length; i++) {
      // Skip header lines - find first line with actual data
      // Data lines will have multiple commas (at least 8)
      const commaCount = (lines[i].match(/,/g) || []).length;
      if (commaCount >= 8 && !lines[i].trim().startsWith('"')) {
        dataStartLine = i;
        break;
      }
    }

    // Parse data rows
    for (let i = dataStartLine; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Skip rows that are mostly empty
      const nonEmptyCount = line.split(',').filter(cell => cell.trim() && cell.trim() !== 'Cash').length;
      if (nonEmptyCount < 2) continue;

      // Parse row handling quoted values
      const values: string[] = [];
      let current = '';
      inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      // Create row object
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Only add rows that have at least a name
      if (row.deceased_person_name && row.deceased_person_name.trim()) {
        rows.push(row as CSVRow);
      }
    }

    setCsvData(rows);
    validateAndParseEntries(rows);
  };

  const validateAndParseEntries = async (rows: CSVRow[]) => {
    const parsed: ParsedEntry[] = [];
    const existingEntries = await getEntries();

    // Create a map of duplicate key (deceased_person_name + mobile)
    const duplicateKeys = new Set(
      existingEntries
        .filter(e => e.customerName && e.customerMobile)
        .map(e => `${e.customerName.toLowerCase().trim()}_${e.customerMobile.replace(/\D/g, '')}`)
    );

    // Fetch occupied lockers for all locations
    const occupiedLockersMap = new Map<string, number[]>();
    for (const location of locations) {
      const occupied = await getOccupiedLockers(location.id);
      occupiedLockersMap.set(location.id, occupied);
    }
    setOccupiedLockers(occupiedLockersMap);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];

      // Validate required fields
      if (!row.deceased_person_name?.trim()) {
        errors.push('Deceased person name is required');
      }
      if (!row.mobile_number?.trim()) {
        errors.push('Mobile number is required');
      }
      if (!row.city?.trim()) {
        errors.push('City is required');
      }
      if (!row.total_pots || row.total_pots < 1 || row.total_pots > 50) {
        errors.push('Total pots must be between 1 and 50');
      }
      if (!row.payment_method?.trim()) {
        errors.push('Payment method is required');
      }
      if (!row.entry_date?.trim()) {
        errors.push('Entry date is required');
      }
      if (!row.location?.trim()) {
        errors.push('Location is required');
      }
      if (!row.locker_number || row.locker_number < 1) {
        errors.push('Valid locker number is required');
      }

      // Validate payment method
      if (row.payment_method && !['cash', 'upi'].includes(row.payment_method.toLowerCase().trim())) {
        errors.push('Payment method must be either "cash" or "upi"');
      }

      // Parse date
      let entryDate: Date;
      try {
        entryDate = parseDate(row.entry_date);
        if (isNaN(entryDate.getTime())) {
          errors.push('Invalid entry date format');
        }
      } catch (e) {
        errors.push('Invalid entry date format (use DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD)');
      }

      // Find location by name
      const location = locations.find(loc =>
        loc.venueName.toLowerCase() === (row.location || '').toLowerCase().trim()
      );

      if (!location) {
        errors.push(`Location "${row.location || 'N/A'}" not found`);
      }

      // Check for duplicates
      const duplicateKey = `${(row.deceased_person_name || '').toLowerCase().trim()}_${(row.mobile_number || '').replace(/\D/g, '')}`;
      const isDuplicate = duplicateKeys.has(duplicateKey);

      // Check for locker conflicts
      let hasLockerConflict = false;
      let conflictDetails = '';
      if (location) {
        const occupied = occupiedLockersMap.get(location.id) || [];
        if (occupied.includes(row.locker_number)) {
          hasLockerConflict = true;
          conflictDetails = `Locker ${row.locker_number} is already occupied at ${location.venueName}`;
        }

        // Check locker number within valid range
        if (row.locker_number < 1 || row.locker_number > (location.numberOfLockers || 100)) {
          hasLockerConflict = true;
          conflictDetails = `Locker number must be between 1 and ${location.numberOfLockers || 100}`;
        }
      }

      parsed.push({
        rowNumber: i + 2, // +2 because row 1 is header
        deceasedPersonName: row.deceased_person_name?.trim() || '',
        mobile: row.mobile_number?.trim() || '',
        city: row.city?.trim() || '',
        additionalDetails: row.additional_details?.trim() || '',
        totalPots: parseInt(row.total_pots?.toString()) || 1,
        paymentMethod: row.payment_method?.toLowerCase().trim() === 'upi' ? 'upi' : 'cash',
        entryDate: entryDate || new Date(),
        locationName: row.location?.trim() || '',
        lockerNumber: parseInt(row.locker_number?.toString()) || 1,
        errors,
        isDuplicate,
        hasLockerConflict,
        conflictDetails
      });
    }

    setParsedEntries(parsed);
    setShowConfirmation(true);
  };

  const parseDate = (dateStr: string): Date => {
    const trimmed = dateStr.trim();

    // Try YYYY-MM-DD first
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
      const parts = trimmed.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }

    // Try DD/MM/YYYY or D/M/YYYY (day/month/year - common in India)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      // Treat as DD/MM/YYYY format (day/month/year)
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const date = new Date(year, month, day);

      // Validate the date is valid
      if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        throw new Error('Invalid date');
      }
      return date;
    }

    // Try MM/DD/YYYY (month/day/year)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      const date = new Date(year, month, day);

      // Validate the date is valid
      if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        throw new Error('Invalid date');
      }
      return date;
    }

    throw new Error('Invalid date format');
  };

  const handleConfirmImport = async () => {
    if (!user) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: 0 });

    const validEntries = parsedEntries.filter(e => e.errors.length === 0 && !e.isDuplicate && !e.hasLockerConflict);
    const uniqueValidEntries = validEntries.filter((entry, index, self) =>
      index === self.findIndex(e =>
        e.deceasedPersonName.toLowerCase() === entry.deceasedPersonName.toLowerCase() &&
        e.mobile === entry.mobile
      )
    );

    setProgress({ current: 0, total: uniqueValidEntries.length });

    const results = {
      successful: 0,
      failed: 0,
      lockerConflicts: 0,
      duplicates: 0,
      errors: [] as { row: number; error: string }[]
    };

    try {
      for (let i = 0; i < uniqueValidEntries.length; i++) {
        const entry = uniqueValidEntries[i];
        setProgress({ current: i + 1, total: uniqueValidEntries.length });

        try {
          const response = await fetch('/api/entries/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              entries: [entry],
              operatorId: user.uid
            })
          });

          const result = await response.json();

          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push({
              row: entry.rowNumber,
              error: result.error || 'Failed to create entry'
            });
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: entry.rowNumber,
            error: error.message || 'Failed to create entry'
          });
        }

        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setImportResults({
        successful: results.successful,
        failed: results.failed,
        lockerConflicts: parsedEntries.filter(e => e.hasLockerConflict).length,
        duplicates: parsedEntries.filter(e => e.isDuplicate).length,
        errors: results.errors
      });

      // Log the import to settings
      await fetch('/api/admin/log-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalRows: csvData.length,
          successful: results.successful,
          failed: results.failed,
          duplicateRows: parsedEntries.filter(e => e.isDuplicate).length,
          lockerConflicts: parsedEntries.filter(e => e.hasLockerConflict).length,
          importedBy: user.uid,
          timestamp: new Date().toISOString()
        })
      });

      setTimeout(() => {
        setIsProcessing(false);
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Bulk import failed:', error);
      setIsProcessing(false);
      alert('Import failed. Please try again.');
    }
  };

  const getStats = () => {
    const total = parsedEntries.length;
    const valid = parsedEntries.filter(e => e.errors.length === 0 && !e.isDuplicate && !e.hasLockerConflict);
    const duplicates = parsedEntries.filter(e => e.isDuplicate);
    const lockerConflicts = parsedEntries.filter(e => e.hasLockerConflict);
    const errors = parsedEntries.filter(e => e.errors.length > 0);

    return { total, valid: valid.length, duplicates: duplicates.length, lockerConflicts: lockerConflicts.length, errors: errors.length };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        {/* <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileUp className="h-5 w-5" />
            <span>Bulk Entry Import</span>
          </CardTitle>
          <CardDescription>
            Upload a CSV file to create multiple entries at once
          </CardDescription>
        </CardHeader> */}
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <FileUp className="h-5 w-5 mr-2" />
                Select CSV File
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground mt-3">
              CSV must contain: deceased_person_name, mobile_number, city, additional_details, total_pots, payment_method, entry_date, location, locker_number
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Import</DialogTitle>
            <DialogDescription>
              Review the parsed entries before confirming the import
            </DialogDescription>
          </DialogHeader>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-y flex-shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
              <div className="text-xs text-muted-foreground">Valid Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.duplicates}</div>
              <div className="text-xs text-muted-foreground">Duplicates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.lockerConflicts}</div>
              <div className="text-xs text-muted-foreground">Locker Conflicts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              <div className="text-xs text-muted-foreground">Errors</div>
            </div>
          </div>

          {/* Entries List */}
          <div className="flex-1 min-h-0 overflow-hidden flex-shrink-0">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {parsedEntries.map((entry, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      entry.errors.length > 0 || entry.isDuplicate || entry.hasLockerConflict
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Row {entry.rowNumber}
                        </Badge>
                        {entry.errors.length === 0 && !entry.isDuplicate && !entry.hasLockerConflict && (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        )}
                        {entry.isDuplicate && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Duplicate
                          </Badge>
                        )}
                        {entry.hasLockerConflict && (
                          <Badge variant="destructive" className="text-xs bg-orange-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Locker Conflict
                          </Badge>
                        )}
                        {entry.errors.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <X className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{' '}
                        <span className="font-medium">{entry.deceasedPersonName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mobile:</span>{' '}
                        <span className="font-medium">{entry.mobile}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">City:</span>{' '}
                        <span className="font-medium">{entry.city}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pots:</span>{' '}
                        <span className="font-medium">{entry.totalPots}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>{' '}
                        <span className="font-medium">{entry.locationName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Locker:</span>{' '}
                        <span className="font-medium">{entry.lockerNumber}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payment:</span>{' '}
                        <span className="font-medium uppercase">{entry.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>{' '}
                        <span className="font-medium">{entry.entryDate.toLocaleDateString()}</span>
                      </div>
                    </div>

                    {entry.conflictDetails && (
                      <Alert className="mt-2 bg-orange-50 border-orange-200">
                        <AlertDescription className="text-sm text-orange-800">
                          {entry.conflictDetails}
                        </AlertDescription>
                      </Alert>
                    )}

                    {entry.errors.length > 0 && (
                      <Alert className="mt-2">
                        <AlertDescription className="text-sm">
                          <strong>Errors:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {entry.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 flex-shrink-0 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmation(false);
                setCsvData([]);
                setParsedEntries([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="text-sm text-muted-foreground">
                {stats.valid} entries will be created
              </div>
              <Button
                onClick={handleConfirmImport}
                disabled={stats.valid === 0 || isProcessing}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing ({progress.current}/{progress.total})...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm & Create {stats.valid} Entries
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Processing Indicator */}
      {isProcessing && (
        <Dialog open={isProcessing} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Creating Entries</DialogTitle>
              <DialogDescription>
                Processing your bulk import
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-16 w-16 text-primary" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Creating Entries...</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Processing {progress.current} of {progress.total} entries
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((progress.current / progress.total) * 100)}% complete
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Results Dialog */}
      <Dialog open={!isProcessing && importResults.successful > 0} onOpenChange={() => setImportResults({ successful: 0, failed: 0, lockerConflicts: 0, duplicates: 0, errors: [] })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Complete</DialogTitle>
            <DialogDescription>
              {importResults.successful} entries created successfully
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{importResults.lockerConflicts}</div>
                <div className="text-sm text-muted-foreground">Locker Conflicts</div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-2xl font-bold text-amber-600">{importResults.duplicates}</div>
                <div className="text-sm text-muted-foreground">Duplicates</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            {importResults.lockerConflicts > 0 && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm text-orange-800">
                  <strong>{importResults.lockerConflicts}</strong> entries were skipped due to locker conflicts (already occupied or invalid locker number).
                </AlertDescription>
              </Alert>
            )}

            {importResults.duplicates > 0 && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm text-amber-800">
                  <strong>{importResults.duplicates}</strong> entries were skipped as duplicates (same name and mobile already exist).
                </AlertDescription>
              </Alert>
            )}

            {importResults.errors.length > 0 && (
              <div>
                <Alert className="mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>{importResults.errors.length}</strong> entries failed to create:
                  </AlertDescription>
                </Alert>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {importResults.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertDescription>
                          Row {error.row}: {error.error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={onSuccess} className="w-full sm:w-auto">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
