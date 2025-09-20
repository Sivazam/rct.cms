// SMS Template Management System - Updated with Fast2SMS Message IDs
// This version uses Fast2SMS Message IDs for API calls, not DLT Template IDs

/**
 * Fast2SMS Message ID Registry - All approved templates with their correct Message IDs
 * These Message IDs are used in the "message" parameter of Fast2SMS API calls
 */

// Template key to Fast2SMS Message ID mapping (CORRECTED)
export const TEMPLATE_IDS = {
  threeDayReminder: '198607',           // Fast2SMS Message ID
  lastdayRenewal: '198608',             // Fast2SMS Message ID
  renewalConfirmCustomer: '198609',     // Fast2SMS Message ID
  renewalConfirmAdmin: '198610',        // Fast2SMS Message ID
  dispatchConfirmCustomer: '198611',    // Fast2SMS Message ID
  deliveryConfirmAdmin: '198612',      // Fast2SMS Message ID
  finalDisposalReminder: '198613',      // Fast2SMS Message ID (Customer)
  finalDisposalReminderAdmin: '198614', // Fast2SMS Message ID (Admin)
} as const;

// Template key to DLT Template ID mapping (for reference and admin purposes)
export const DLT_TEMPLATE_IDS = {
  threeDayReminder: '1707175786299400837',     // DLT Template ID
  lastdayRenewal: '1707175786326312933',       // DLT Template ID
  renewalConfirmCustomer: '1707175786362862204', // DLT Template ID
  renewalConfirmAdmin: '1707175786389503209',    // DLT Template ID
  dispatchConfirmCustomer: '1707175786420863806', // DLT Template ID
  deliveryConfirmAdmin: '1707175786441865610',  // DLT Template ID
  finalDisposalReminder: '1707175786481540000', // DLT Template ID (Customer)
  finalDisposalReminderAdmin: '1707175786495860000', // DLT Template ID (Admin)
} as const;

// Template key to template name mapping for display purposes
export const TEMPLATE_NAMES = {
  threeDayReminder: '3 Days Expiry Reminder',
  lastdayRenewal: 'Last Day Renewal Reminder',
  renewalConfirmCustomer: 'Renewal Confirmation (Customer)',
  renewalConfirmAdmin: 'Renewal Confirmation (Admin)',
  dispatchConfirmCustomer: 'Dispatch Confirmation (Customer)',
  deliveryConfirmAdmin: 'Delivery Confirmation (Admin)',
  finalDisposalReminder: 'Final Disposal Reminder (Customer)',
  finalDisposalReminderAdmin: 'Final Disposal Reminder (Admin)',
} as const;

// Template variable definitions with strict typing
export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
  position: number;
}

// Template definition interface
export interface SMSTemplate {
  key: keyof typeof TEMPLATE_IDS;
  id: string; // This is now the Fast2SMS Message ID
  dltId: string; // DLT Template ID for reference
  name: string;
  description: string;
  variables: TemplateVariable[];
  variableCount: number;
  isActive: boolean;
  category: 'reminder' | 'confirmation' | 'disposal';
}

// Template variable data interface for sending SMS - DLT Compliant Format
export interface TemplateVariables {
  // DLT templates use positional variables {#var#}, not named variables
  // Variables must be provided in the exact order as per DLT template
  var1: string; // {#var#} - Position 1
  var2: string; // {#var#} - Position 2  
  var3?: string; // {#var#} - Position 3 (optional for some templates)
  var4?: string; // {#var#} - Position 4 (optional for some templates)
  var5?: string; // {#var#} - Position 5 (optional for some templates)
  var6?: string; // {#var#} - Position 6 (optional for some templates)
  var7?: string; // {#var#} - Position 7 (optional for some templates)
}

// SMS request interface
export interface SMSRequest {
  templateKey: keyof typeof TEMPLATE_IDS;
  recipient: string;
  variables: TemplateVariables;
  entryId?: string;
  customerId?: string;
  locationId?: string;
  operatorId?: string;
}

// SMS response interface
export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
  templateUsed: string;
  recipient: string;
}

// Mobile number validation and cleaning utility
export class MobileNumberUtils {
  /**
   * Clean and validate mobile number for Fast2SMS API
   * @param mobileNumber - Raw mobile number input
   * @returns Cleaned 10-digit mobile number
   * @throws Error if mobile number is invalid
   */
  static cleanAndValidate(mobileNumber: string): string {
    if (!mobileNumber || typeof mobileNumber !== 'string') {
      throw new Error('Mobile number is required and must be a string');
    }

    // Remove all non-digit characters
    const cleaned = mobileNumber.replace(/\D/g, '');
    
    // Remove country code if present (91)
    let finalNumber = cleaned;
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      finalNumber = cleaned.substring(2);
    } else if (cleaned.length === 13 && cleaned.startsWith('91')) {
      finalNumber = cleaned.substring(2);
    } else if (cleaned.length > 10) {
      // If longer than 10 digits and doesn't start with 91, take last 10 digits
      finalNumber = cleaned.slice(-10);
    }

    // Validate final format
    if (!/^[6-9]\d{9}$/.test(finalNumber)) {
      throw new Error(`Invalid mobile number format: ${mobileNumber}. Must be 10 digits starting with 6-9`);
    }

    return finalNumber;
  }

  /**
   * Format mobile number for display (with masking for privacy)
   * @param mobileNumber - Clean 10-digit mobile number
   * @returns Masked mobile number for display
   */
  static maskForDisplay(mobileNumber: string): string {
    const cleaned = this.cleanAndValidate(mobileNumber);
    return cleaned.substring(0, 4) + '****' + cleaned.substring(-4);
  }

  /**
   * Check if mobile number is valid (without throwing error)
   * @param mobileNumber - Mobile number to validate
   * @returns True if valid, false otherwise
   */
  static isValid(mobileNumber: string): boolean {
    try {
      this.cleanAndValidate(mobileNumber);
      return true;
    } catch {
      return false;
    }
  }
}

// Fast2SMS Template definitions with exact variable structures as per user requirements
export const FASTSMS_TEMPLATES: SMSTemplate[] = [
  {
    key: 'threeDayReminder',
    id: TEMPLATE_IDS.threeDayReminder,
    dltId: DLT_TEMPLATE_IDS.threeDayReminder,
    name: TEMPLATE_NAMES.threeDayReminder,
    description: 'Send reminder 3 days before expiry',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name (entry name)',
        example: 'రాముడు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location (location this entry got registered)',
        example: 'లాకర్-A',
        required: true,
        position: 2
      },
      {
        name: 'var3',
        description: 'Date of expiry of storage',
        example: '2025-09-25',
        required: true,
        position: 3
      },
      {
        name: 'var4',
        description: 'Admin contact number',
        example: '919014882779',
        required: true,
        position: 4
      },
      {
        name: 'var5',
        description: 'Location (location this entry got registered) - repeated',
        example: 'లాకర్-A',
        required: true,
        position: 5
      }
    ],
    variableCount: 5,
    isActive: true,
    category: 'reminder'
  },
  {
    key: 'lastdayRenewal',
    id: TEMPLATE_IDS.lastdayRenewal,
    dltId: DLT_TEMPLATE_IDS.lastdayRenewal,
    name: TEMPLATE_NAMES.lastdayRenewal,
    description: 'Send reminder on expiry day',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name (entry name)',
        example: 'రాముడు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location (location this entry got registered)',
        example: 'లాకర్-A',
        required: true,
        position: 2
      },
      {
        name: 'var3',
        description: 'Date of expiry of storage',
        example: '2025-09-25',
        required: true,
        position: 3
      },
      {
        name: 'var4',
        description: 'Admin contact number',
        example: '919014882779',
        required: true,
        position: 4
      },
      {
        name: 'var5',
        description: 'Location (location this entry got registered) - repeated',
        example: 'లాకర్-A',
        required: true,
        position: 5
      }
    ],
    variableCount: 5,
    isActive: true,
    category: 'reminder'
  },
  {
    key: 'renewalConfirmCustomer',
    id: TEMPLATE_IDS.renewalConfirmCustomer,
    dltId: DLT_TEMPLATE_IDS.renewalConfirmCustomer,
    name: TEMPLATE_NAMES.renewalConfirmCustomer,
    description: 'Send renewal confirmation to customer',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name (entry name)',
        example: 'రాముడు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location (location this entry got registered)',
        example: 'లాకర్-A',
        required: true,
        position: 2
      },
      {
        name: 'var3',
        description: 'New Date of expiry of storage after renewal',
        example: '2025-12-25',
        required: true,
        position: 3
      },
      {
        name: 'var4',
        description: 'Admin contact number',
        example: '919014882779',
        required: true,
        position: 4
      },
      {
        name: 'var5',
        description: 'Location (location this entry got registered) - repeated',
        example: 'లాకర్-A',
        required: true,
        position: 5
      }
    ],
    variableCount: 5,
    isActive: true,
    category: 'confirmation'
  },
  {
    key: 'renewalConfirmAdmin',
    id: TEMPLATE_IDS.renewalConfirmAdmin,
    dltId: DLT_TEMPLATE_IDS.renewalConfirmAdmin,
    name: TEMPLATE_NAMES.renewalConfirmAdmin,
    description: 'Send renewal confirmation to admin',
    variables: [
      {
        name: 'var1',
        description: 'Location renewal happened',
        example: 'లాకర్-A',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Deceased person name whose renewal has happened',
        example: 'రాముడు',
        required: true,
        position: 2
      }
    ],
    variableCount: 2,
    isActive: true,
    category: 'confirmation'
  },
  {
    key: 'dispatchConfirmCustomer',
    id: TEMPLATE_IDS.dispatchConfirmCustomer,
    dltId: DLT_TEMPLATE_IDS.dispatchConfirmCustomer,
    name: TEMPLATE_NAMES.dispatchConfirmCustomer,
    description: 'Send dispatch confirmation to customer',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name (entry name)',
        example: 'రాముడు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location (location this entry got registered)',
        example: 'లాకర్-A',
        required: true,
        position: 2
      },
      {
        name: 'var3',
        description: 'Date of dispatch happened',
        example: '2025-09-25',
        required: true,
        position: 3
      },
      {
        name: 'var4',
        description: 'Contact person name who handed over the pot',
        example: 'సీత',
        required: true,
        position: 4
      },
      {
        name: 'var5',
        description: 'Contact person mobile number who handed over the pot',
        example: '919876543210',
        required: true,
        position: 5
      },
      {
        name: 'var6',
        description: 'Admin contact number',
        example: '919014882779',
        required: true,
        position: 6
      },
      {
        name: 'var7',
        description: 'Location (location this entry got registered) - repeated',
        example: 'లాకర్-A',
        required: true,
        position: 7
      }
    ],
    variableCount: 7,
    isActive: true,
    category: 'confirmation'
  },
  {
    key: 'deliveryConfirmAdmin',
    id: TEMPLATE_IDS.deliveryConfirmAdmin,
    dltId: DLT_TEMPLATE_IDS.deliveryConfirmAdmin,
    name: TEMPLATE_NAMES.deliveryConfirmAdmin,
    description: 'Send delivery confirmation to admin',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name (entry name) whose dispatch/delivery have happened',
        example: 'రాముడు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location (location this entry got registered) whose dispatched',
        example: 'లాకర్-A',
        required: true,
        position: 2
      }
    ],
    variableCount: 2,
    isActive: true,
    category: 'confirmation'
  },
  {
    key: 'finalDisposalReminder',
    id: TEMPLATE_IDS.finalDisposalReminder,
    dltId: DLT_TEMPLATE_IDS.finalDisposalReminder,
    name: TEMPLATE_NAMES.finalDisposalReminder,
    description: 'Send final disposal reminder to customer',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name (entry name)',
        example: 'రాముడు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location (location this entry got registered)',
        example: 'లాకర్-A',
        required: true,
        position: 2
      },
      {
        name: 'var3',
        description: 'Location (location this entry got registered) - repeated',
        example: 'లాకర్-A',
        required: true,
        position: 3
      }
    ],
    variableCount: 3,
    isActive: true,
    category: 'disposal'
  },
  {
    key: 'finalDisposalReminderAdmin',
    id: TEMPLATE_IDS.finalDisposalReminderAdmin,
    dltId: DLT_TEMPLATE_IDS.finalDisposalReminderAdmin,
    name: TEMPLATE_NAMES.finalDisposalReminderAdmin,
    description: 'Send final disposal reminder to admin',
    variables: [
      {
        name: 'var1',
        description: 'Location name, at which that Deceased person storage renewals hasnt happened for last 2months',
        example: 'లాకర్-A',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'That Deceased person name',
        example: 'రాముడు',
        required: true,
        position: 2
      }
    ],
    variableCount: 2,
    isActive: true,
    category: 'disposal'
  }
];

class SMSTemplatesService {
  private static instance: SMSTemplatesService;

  private constructor() {}

  public static getInstance(): SMSTemplatesService {
    if (!SMSTemplatesService.instance) {
      SMSTemplatesService.instance = new SMSTemplatesService();
    }
    return SMSTemplatesService.instance;
  }

  /**
   * Get all available Fast2SMS templates
   */
  public getAllTemplates(): SMSTemplate[] {
    return FASTSMS_TEMPLATES;
  }

  /**
   * Get template by key
   */
  public getTemplateByKey(key: keyof typeof TEMPLATE_IDS): SMSTemplate | undefined {
    return FASTSMS_TEMPLATES.find(template => template.key === key);
  }

  /**
   * Get template by Fast2SMS Message ID
   */
  public getTemplateById(id: string): SMSTemplate | undefined {
    return FASTSMS_TEMPLATES.find(template => template.id === id);
  }

  /**
   * Get template by DLT Template ID
   */
  public getTemplateByDLTId(dltId: string): SMSTemplate | undefined {
    return FASTSMS_TEMPLATES.find(template => template.dltId === dltId);
  }

  /**
   * Get active templates by category
   */
  public getTemplatesByCategory(category: 'reminder' | 'confirmation' | 'disposal'): SMSTemplate[] {
    return FASTSMS_TEMPLATES.filter(template => template.category === category && template.isActive);
  }

  /**
   * Format variables for FastSMS API (pipe-separated values in exact order)
   */
  public formatVariablesForAPI(templateKey: keyof typeof TEMPLATE_IDS, variables: TemplateVariables): string {
    const template = this.getTemplateByKey(templateKey);
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    const variableValues: string[] = [];
    
    // Sort variables by position and extract values
    const sortedVariables = [...template.variables].sort((a, b) => a.position - b.position);
    
    for (const variable of sortedVariables) {
      const value = variables[variable.name as keyof TemplateVariables];
      if (value === undefined || value === null || value === '') {
        if (variable.required) {
          throw new Error(`Required variable '${variable.name}' is missing or empty for template '${templateKey}'`);
        }
        variableValues.push(''); // Use empty string for optional variables
      } else {
        variableValues.push(value.toString());
      }
    }

    return variableValues.join('|');
  }

  /**
   * Validate template variables with enhanced mobile number validation
   */
  public validateTemplateVariables(templateKey: keyof typeof TEMPLATE_IDS, variables: TemplateVariables): { isValid: boolean; errors: string[] } {
    const template = this.getTemplateByKey(templateKey);
    if (!template) {
      return {
        isValid: false,
        errors: [`Template not found: ${templateKey}`]
      };
    }

    const errors: string[] = [];

    // Check all required variables are present and non-empty
    for (let i = 1; i <= template.variableCount; i++) {
      const varName = `var${i}` as keyof TemplateVariables;
      const value = variables[varName];
      
      if (value === undefined || value === null || value === '') {
        errors.push(`Required variable 'var${i}' is missing or empty for template '${templateKey}'`);
      }
    }

    // Enhanced mobile number validation for variables that contain mobile numbers
    const mobileVarPositions = [4, 5, 6]; // Common positions for mobile numbers
    for (const pos of mobileVarPositions) {
      const varName = `var${pos}` as keyof TemplateVariables;
      const value = variables[varName];
      if (value && typeof value === 'string') {
        try {
          MobileNumberUtils.cleanAndValidate(value);
        } catch (error) {
          errors.push(`Invalid mobile number format for '${varName}': ${error instanceof Error ? error.message : value}`);
        }
      }
    }

    // Validate date format for variables that likely contain dates
    const dateVarPositions = [3]; // Common position for dates
    for (const pos of dateVarPositions) {
      const varName = `var${pos}` as keyof TemplateVariables;
      const value = variables[varName];
      if (value && typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value.trim()) === false) {
        // Only validate if it looks like it could be a date
        if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(value) || /\d{1,2}-\d{1,2}-\d{4}/.test(value)) {
          errors.push(`Invalid date format for '${varName}'. Expected DD/MM/YYYY: ${value}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get template statistics
   */
  public getTemplateStats(): {
    total: number;
    active: number;
    byCategory: {
      reminder: number;
      confirmation: number;
      disposal: number;
    };
  } {
    const templates = FASTSMS_TEMPLATES;
    
    return {
      total: templates.length,
      active: templates.filter(t => t.isActive).length,
      byCategory: {
        reminder: this.getTemplatesByCategory('reminder').length,
        confirmation: this.getTemplatesByCategory('confirmation').length,
        disposal: this.getTemplatesByCategory('disposal').length,
      }
    };
  }

  /**
   * Get template ID mapping information
   */
  public getTemplateIDMapping(): Array<{
    key: string;
    fast2smsId: string;
    dltId: string;
    name: string;
  }> {
    return FASTSMS_TEMPLATES.map(template => ({
      key: template.key,
      fast2smsId: template.id,
      dltId: template.dltId,
      name: template.name
    }));
  }
}

export default SMSTemplatesService;