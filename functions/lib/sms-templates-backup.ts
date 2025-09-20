// SMS Template Management System - Firebase Admin SDK Compatible Version
// This is a simplified version for Firebase Functions use

/**
 * DLT Template Registry - All approved templates with their IDs and variable structures
 * This file contains the official DLT-approved templates for the Cremation Management System
 */

// Template key to template ID mapping
export const TEMPLATE_IDS = {
  threeDayReminder: '1707175786299400837',
  lastdayRenewal: '1707175786326312933',
  renewalConfirmCustomer: '1707175786362862204',
  renewalConfirmAdmin: '1707175786389503209',
  dispatchConfirmCustomer: '1707175786420863806',
  deliveryConfirmAdmin: '1707175786441865610',
  finalDisposalReminder: '1707175786481546224',
  finalDisposalReminderAdmin: '1707175786495860514',
} as const;

// Template key to template name mapping for display purposes
export const TEMPLATE_NAMES = {
  threeDayReminder: '3 Days Expiry Reminder',
  lastdayRenewal: 'Last Day Renewal Reminder',
  renewalConfirmCustomer: 'Renewal Confirmation (Customer)',
  renewalConfirmAdmin: 'Renewal Confirmation (Admin)',
  dispatchConfirmCustomer: 'Dispatch Confirmation (Customer)',
  deliveryConfirmAdmin: 'Delivery Confirmation (Admin)',
  finalDisposalReminder: 'Final Disposal Reminder',
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
  id: string;
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

// DLT Template definitions with exact variable structures as approved
export const DLT_TEMPLATES: SMSTemplate[] = [
  {
    key: 'threeDayReminder',
    id: TEMPLATE_IDS.threeDayReminder,
    name: TEMPLATE_NAMES.threeDayReminder,
    description: 'Send reminder 3 days before expiry',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name',
        example: 'రాఘవ రావు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location name',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      },
      {
        name: 'var3',
        description: 'Expiry date',
        example: '24/09/2025',
        required: true,
        position: 3
      },
      {
        name: 'var4',
        description: 'Mobile number',
        example: '9876543210',
        required: true,
        position: 4
      },
      {
        name: 'var5',
        description: 'Location name (signature)',
        example: 'కోటిలింగలు-కైలాసభూమి',
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
    name: TEMPLATE_NAMES.lastdayRenewal,
    description: 'Send reminder on expiry day',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name',
        example: 'రాఘవ రావు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location name',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      },
      {
        name: 'var3',
        description: 'Expiry date (today)',
        example: '24/09/2025',
        required: true,
        position: 3
      },
      {
        name: 'var4',
        description: 'Mobile number',
        example: '9876543210',
        required: true,
        position: 4
      },
      {
        name: 'var5',
        description: 'Location name (signature)',
        example: 'కోటిలింగలు-కైలాసభూమి',
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
    name: TEMPLATE_NAMES.renewalConfirmCustomer,
    description: 'Send renewal confirmation to customer',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name',
        example: 'రాఘవ రావు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location name',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      },
      {
        name: 'var3',
        description: 'Extended expiry date',
        example: '24/12/2025',
        required: true,
        position: 3
      },
      {
        name: 'var4',
        description: 'Mobile number',
        example: '9876543210',
        required: true,
        position: 4
      },
      {
        name: 'var5',
        description: 'Location name (signature)',
        example: 'కోటిలింగలు-కైలాసభూమి',
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
    name: TEMPLATE_NAMES.renewalConfirmAdmin,
    description: 'Send renewal confirmation to admin',
    variables: [
      {
        name: 'var1',
        description: 'Location name',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Deceased person name',
        example: 'రాఘవ రావు',
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
    name: TEMPLATE_NAMES.dispatchConfirmCustomer,
    description: 'Send dispatch confirmation to customer',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name',
        example: 'రాఘవ రావు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location name',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      },
      {
        name: 'var3',
        description: 'Delivery date',
        example: '27/09/2025',
        required: true,
        position: 3
      },
      {
        name: 'var4',
        description: 'Contact person name',
        example: 'సురేష్ కుమార్',
        required: true,
        position: 4
      },
      {
        name: 'var5',
        description: 'Contact mobile number',
        example: '9876543210',
        required: true,
        position: 5
      },
      {
        name: 'var6',
        description: 'Admin mobile number',
        example: '9876543210',
        required: true,
        position: 6
      },
      {
        name: 'var7',
        description: 'Location name (signature)',
        example: 'కోటిలింగలు-కైలాసభూమి',
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
    name: TEMPLATE_NAMES.deliveryConfirmAdmin,
    description: 'Send delivery confirmation to admin',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name',
        example: 'రాఘవ రావు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location name',
        example: 'కోటిలింగలు-కైలాసభూమి',
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
    name: TEMPLATE_NAMES.finalDisposalReminder,
    description: 'Send final disposal reminder',
    variables: [
      {
        name: 'var1',
        description: 'Deceased person name',
        example: 'రాఘవ రావు',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Location name',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      },
      {
        name: 'var3',
        description: 'Location name (signature)',
        example: 'కోటిలింగలు-కైలాసభూమి',
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
    name: TEMPLATE_NAMES.finalDisposalReminderAdmin,
    description: 'Send final disposal reminder to admin',
    variables: [
      {
        name: 'var1',
        description: 'Location name',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 1
      },
      {
        name: 'var2',
        description: 'Deceased person name',
        example: 'రాఘవ రావు',
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
   * Get all available DLT templates
   */
  public getAllTemplates(): SMSTemplate[] {
    return DLT_TEMPLATES;
  }

  /**
   * Get template by key
   */
  public getTemplateByKey(key: keyof typeof TEMPLATE_IDS): SMSTemplate | undefined {
    return DLT_TEMPLATES.find(template => template.key === key);
  }

  /**
   * Get template by ID
   */
  public getTemplateById(id: string): SMSTemplate | undefined {
    return DLT_TEMPLATES.find(template => template.id === id);
  }

  /**
   * Get active templates by category
   */
  public getTemplatesByCategory(category: 'reminder' | 'confirmation' | 'disposal'): SMSTemplate[] {
    return DLT_TEMPLATES.filter(template => template.category === category && template.isActive);
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
   * Validate template variables
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

    // Validate mobile number format for any variable that contains a mobile number
    // Check var4, var5, var6 as they commonly contain mobile numbers
    const mobileVarPositions = [4, 5, 6];
    for (const pos of mobileVarPositions) {
      const varName = `var${pos}` as keyof TemplateVariables;
      const value = variables[varName];
      if (value && typeof value === 'string' && /^[6-9]\d{9}$/.test(value.trim()) === false) {
        // Only validate if it looks like a mobile number (10 digits starting with 6-9)
        if (/^\d{10}$/.test(value.trim())) {
          errors.push(`Invalid mobile number format for '${varName}': ${value}. Must start with 6-9`);
        }
      }
    }

    // Validate date format for variables that likely contain dates
    // Check var3 as it commonly contains dates
    const dateVarPositions = [3];
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
    const templates = DLT_TEMPLATES;
    
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
}

export default SMSTemplatesService;