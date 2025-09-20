// SMS Template Management System - DLT Compliant Templates for FastSMS

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
  createdAt: Date;
  updatedAt: Date;
}

// Template variable data interface for sending SMS
export interface TemplateVariables {
  // Common variables
  deceasedPersonName: string; // {#pname#} - Name of deceased person
  locationName: string; // {#pname#} - Name of cremation location
  date: string; // {#date#} - Date field (expiry/delivery)
  mobile: string; // {#mobile#} - Mobile number
  
  // Additional variables for specific templates
  contactPersonName?: string; // For dispatch confirmation
  adminMobile?: string; // Admin mobile number
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

// DLT Template definitions with exact variable structures as approved
export const DLT_TEMPLATES: SMSTemplate[] = [
  {
    key: 'threeDayReminder',
    id: TEMPLATE_IDS.threeDayReminder,
    name: TEMPLATE_NAMES.threeDayReminder,
    description: 'Send reminder 3 days before expiry',
    variables: [
      {
        name: 'deceasedPersonName',
        description: 'Name of the deceased person',
        example: 'Raghav Rao',
        required: true,
        position: 1
      },
      {
        name: 'locationName',
        description: 'Name of the cremation location',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      },
      {
        name: 'date',
        description: 'Expiry date',
        example: '24/09/2025',
        required: true,
        position: 3
      },
      {
        name: 'mobile',
        description: 'Admin mobile number',
        example: '9876543210',
        required: true,
        position: 4
      },
      {
        name: 'locationName',
        description: 'Location name (signature)',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 5
      }
    ],
    variableCount: 5,
    isActive: true,
    category: 'reminder',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'lastdayRenewal',
    id: TEMPLATE_IDS.lastdayRenewal,
    name: TEMPLATE_NAMES.lastdayRenewal,
    description: 'Send reminder on expiry day',
    variables: [
      {
        name: 'deceasedPersonName',
        description: 'Name of the deceased person',
        example: 'Raghav Rao',
        required: true,
        position: 1
      },
      {
        name: 'locationName',
        description: 'Name of the cremation location',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      },
      {
        name: 'date',
        description: 'Expiry date',
        example: '24/09/2025',
        required: true,
        position: 3
      },
      {
        name: 'mobile',
        description: 'Admin mobile number',
        example: '9876543210',
        required: true,
        position: 4
      },
      {
        name: 'locationName',
        description: 'Location name (signature)',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 5
      }
    ],
    variableCount: 5,
    isActive: true,
    category: 'reminder',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'renewalConfirmCustomer',
    id: TEMPLATE_IDS.renewalConfirmCustomer,
    name: TEMPLATE_NAMES.renewalConfirmCustomer,
    description: 'Send renewal confirmation to customer',
    variables: [
      {
        name: 'deceasedPersonName',
        description: 'Name of the deceased person',
        example: 'Raghav Rao',
        required: true,
        position: 1
      },
      {
        name: 'locationName',
        description: 'Name of the cremation location',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      },
      {
        name: 'date',
        description: 'Extended expiry date',
        example: '24/12/2025',
        required: true,
        position: 3
      },
      {
        name: 'mobile',
        description: 'Admin mobile number',
        example: '9876543210',
        required: true,
        position: 4
      },
      {
        name: 'locationName',
        description: 'Location name (signature)',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 5
      }
    ],
    variableCount: 5,
    isActive: true,
    category: 'confirmation',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'renewalConfirmAdmin',
    id: TEMPLATE_IDS.renewalConfirmAdmin,
    name: TEMPLATE_NAMES.renewalConfirmAdmin,
    description: 'Send renewal confirmation to admin',
    variables: [
      {
        name: 'locationName',
        description: 'Name of the cremation location',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 1
      },
      {
        name: 'deceasedPersonName',
        description: 'Name of the deceased person',
        example: 'Raghav Rao',
        required: true,
        position: 2
      }
    ],
    variableCount: 2,
    isActive: true,
    category: 'confirmation',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'dispatchConfirmCustomer',
    id: TEMPLATE_IDS.dispatchConfirmCustomer,
    name: TEMPLATE_NAMES.dispatchConfirmCustomer,
    description: 'Send dispatch confirmation to customer',
    variables: [
      {
        name: 'deceasedPersonName',
        description: 'Name of the deceased person',
        example: 'Raghav Rao',
        required: true,
        position: 1
      },
      {
        name: 'locationName',
        description: 'Name of the cremation location',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      },
      {
        name: 'date',
        description: 'Delivery date',
        example: '27/09/2025',
        required: true,
        position: 3
      },
      {
        name: 'contactPersonName',
        description: 'Contact person name',
        example: 'Suresh Kumar',
        required: true,
        position: 4
      },
      {
        name: 'mobile',
        description: 'Contact mobile number',
        example: '9876543210',
        required: true,
        position: 5
      },
      {
        name: 'mobile',
        description: 'Admin mobile number',
        example: '9876543210',
        required: true,
        position: 6
      },
      {
        name: 'locationName',
        description: 'Location name (signature)',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 7
      }
    ],
    variableCount: 7,
    isActive: true,
    category: 'confirmation',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'deliveryConfirmAdmin',
    id: TEMPLATE_IDS.deliveryConfirmAdmin,
    name: TEMPLATE_NAMES.deliveryConfirmAdmin,
    description: 'Send delivery confirmation to admin',
    variables: [
      {
        name: 'deceasedPersonName',
        description: 'Name of the deceased person',
        example: 'Raghav Rao',
        required: true,
        position: 1
      },
      {
        name: 'locationName',
        description: 'Name of the cremation location',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      }
    ],
    variableCount: 2,
    isActive: true,
    category: 'confirmation',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'finalDisposalReminder',
    id: TEMPLATE_IDS.finalDisposalReminder,
    name: TEMPLATE_NAMES.finalDisposalReminder,
    description: 'Send final disposal reminder',
    variables: [
      {
        name: 'deceasedPersonName',
        description: 'Name of the deceased person',
        example: 'Raghav Rao',
        required: true,
        position: 1
      },
      {
        name: 'locationName',
        description: 'Name of the cremation location',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 2
      },
      {
        name: 'locationName',
        description: 'Location name (signature)',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 3
      }
    ],
    variableCount: 3,
    isActive: true,
    category: 'disposal',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'finalDisposalReminderAdmin',
    id: TEMPLATE_IDS.finalDisposalReminderAdmin,
    name: TEMPLATE_NAMES.finalDisposalReminderAdmin,
    description: 'Send final disposal reminder to admin',
    variables: [
      {
        name: 'locationName',
        description: 'Name of the cremation location',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true,
        position: 1
      },
      {
        name: 'deceasedPersonName',
        description: 'Name of the deceased person',
        example: 'Raghav Rao',
        required: true,
        position: 2
      }
    ],
    variableCount: 2,
    isActive: true,
    category: 'disposal',
    createdAt: new Date(),
    updatedAt: new Date()
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

    // Check all required variables are present
    for (const variable of template.variables) {
      if (variable.required) {
        const value = variables[variable.name as keyof TemplateVariables];
        if (value === undefined || value === null || value === '') {
          errors.push(`Required variable '${variable.name}' is missing or empty`);
        }
      }
    }

    // Validate mobile number format (basic validation)
    const mobileFields = ['mobile', 'adminMobile'];
    for (const field of mobileFields) {
      const value = variables[field as keyof TemplateVariables];
      if (value && !/^[6-9]\d{9}$/.test(value.toString())) {
        errors.push(`Invalid mobile number format for '${field}': ${value}`);
      }
    }

    // Validate date format (basic validation)
    const dateFields = ['date'];
    for (const field of dateFields) {
      const value = variables[field as keyof TemplateVariables];
      if (value && !/^\d{2}\/\d{2}\/\d{4}$/.test(value.toString())) {
        errors.push(`Invalid date format for '${field}'. Expected DD/MM/YYYY: ${value}`);
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

  /**
   * Preview template with sample data
   */
  public previewTemplate(templateKey: keyof typeof TEMPLATE_IDS, sampleData?: Partial<TemplateVariables>): string {
    const template = this.getTemplateByKey(templateKey);
    if (!template) {
      return 'Template not found';
    }

    // Default sample data
    const defaultSampleData: TemplateVariables = {
      deceasedPersonName: 'Raghav Rao',
      locationName: 'కోటిలింగలు-కైలాసభూమి',
      date: '24/09/2025',
      mobile: '9876543210',
      contactPersonName: 'Suresh Kumar',
      adminMobile: '9876543210'
    };

    const data = { ...defaultSampleData, ...sampleData };
    
    try {
      const formattedVariables = this.formatVariablesForAPI(templateKey, data);
      const variableArray = formattedVariables.split('|');
      
      // Create a generic preview message structure
      let preview = '';
      switch (template.category) {
        case 'reminder':
          preview = `Reminder: ${variableArray[0]} - ${variableArray[1]} - Expiry: ${variableArray[2]}`;
          break;
        case 'confirmation':
          if (templateKey.includes('renewal')) {
            preview = `Renewal Confirmed: ${variableArray[0]} at ${variableArray[1]}`;
          } else if (templateKey.includes('dispatch') || templateKey.includes('delivery')) {
            preview = `Delivery Confirmed: ${variableArray[0]} from ${variableArray[1]} on ${variableArray[2]}`;
          }
          break;
        case 'disposal':
          preview = `Disposal Notice: ${variableArray[0]} - ${variableArray[1]}`;
          break;
        default:
          preview = `SMS Preview: ${formattedVariables}`;
      }
      
      return preview;
    } catch (error) {
      return `Preview Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export default SMSTemplatesService;