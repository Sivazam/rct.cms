// SMS Template Management System

export interface SMSTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

class SMSTemplatesService {
  private static instance: SMSTemplatesService;

  private constructor() {}

  public static getInstance(): SMSTemplatesService {
    if (!SMSTemplatesService.instance) {
      SMSTemplatesService.instance = new SMSTemplatesService();
    }
    return SMSTemplatesService.instance;
  }

  // Define available template variables
  public getAvailableVariables(): TemplateVariable[] {
    return [
      {
        name: 'customer_name',
        description: 'Full name of the deceased person',
        example: 'Raghav Rao',
        required: true
      },
      {
        name: 'location_name',
        description: 'Name of the cremation location',
        example: 'కోటిలింగలు-కైలాసభూమి',
        required: true
      },
      {
        name: 'expiry_date',
        description: 'Date when the entry expires',
        example: '24/09/2025',
        required: true
      },
      {
        name: 'contact_number',
        description: 'Contact number for the location',
        example: '9876543210',
        required: false
      },
      {
        name: 'disposal_date',
        description: 'Date when the pots will be disposed',
        example: '27/09/2025',
        required: false
      },
      {
        name: 'river_name',
        description: 'Name of the river for disposal',
        example: 'River Godavari',
        required: false
      },
      {
        name: 'operator_name',
        description: 'Name of the operator processing the request',
        example: 'John Doe',
        required: false
      },
      {
        name: 'amount',
        description: 'Payment amount',
        example: '300',
        required: false
      }
    ];
  }

  // Get default templates
  public getDefaultTemplates(): SMSTemplate[] {
    return [
      {
        id: 'ENTRY_REMINDER_7_DAYS',
        name: '7 Days Expiry Reminder',
        description: 'Send reminder 7 days before expiry',
        content: 'నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లో {#var#} న గడువు ముగుస్తుంది. కొనసాగింపు కోసం {#var#} కి సంప్రదించండి లేదా మా వద్దకు రండి. – {#var#}',
        variables: ['customer_name', 'location_name', 'expiry_date', 'contact_number', 'location_name'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ENTRY_REMINDER_3_DAYS',
        name: '3 Days Expiry Reminder',
        description: 'Send reminder 3 days before expiry',
        content: 'నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లో {#var#} న గడువు ముగుస్తుంది. కొనసాగింపు కోసం {#var#} కి సంప్రదించండి లేదా మా వద్దకు రండి. – {#var#}',
        variables: ['customer_name', 'location_name', 'expiry_date', 'contact_number', 'location_name'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ENTRY_REMINDER_0_DAYS',
        name: '0 Days Expiry Reminder',
        description: 'Send reminder on expiry day',
        content: 'నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లో {#var#} న గడువు ముగుస్తుంది. కొనసాగింపు కోసం {#var#} కి సంప్రదించండి లేదా మా వద్దకు రండి. – {#var#}',
        variables: ['customer_name', 'location_name', 'expiry_date', 'contact_number', 'location_name'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'DISPOSAL_WARNING_60_DAYS',
        name: '60 Days Disposal Warning',
        description: 'Send warning 60 days after expiry (3 days before disposal)',
        content: 'నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} నుండి 3 రోజుల్లో పంపిణీ చేయబడతాయి. దయచేసి చివరి గడువు ముందు సేకరించండి.',
        variables: ['customer_name', 'disposal_date'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'FINAL_DISPOSAL_NOTICE',
        name: 'Final Disposal Notice',
        description: 'Send final disposal notice (63 days after expiry)',
        content: 'నమస్తే, దివంగత {#var#} గారి అస్థికలు నేడు {#var#} లో పంపిణీ చేయబడతాయి.',
        variables: ['customer_name', 'river_name'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'RENEWAL_NOTIFICATION',
        name: 'Renewal Notification (Admin)',
        description: 'Send notification to admin when renewal is processed',
        content: 'పునరుద్ధరణ: {#var#} - {#var#} - ₹{#var#}',
        variables: ['customer_name', 'location_name', 'amount'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'DISPATCH_NOTIFICATION',
        name: 'Dispatch Notification (Admin)',
        description: 'Send notification to admin when dispatch is processed',
        content: 'పంపిణీ: {#var#} - {#var#} - {#var#}',
        variables: ['customer_name', 'location_name', 'operator_name'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  // Format template with variables
  public formatTemplate(template: string, variables: Record<string, string>): string {
    let formattedContent = template;
    
    // Replace each {#var#} placeholder with the corresponding variable value
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{#var#}`;
      formattedContent = formattedContent.replace(placeholder, value);
    });
    
    return formattedContent;
  }

  // Validate template variables
  public validateTemplate(template: SMSTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if content has required variables
    const variableCount = (template.content.match(/{#var#}/g) || []).length;
    if (variableCount !== template.variables.length) {
      errors.push(`Template content has ${variableCount} placeholders but defines ${template.variables.length} variables`);
    }
    
    // Check if all required variables are present
    const availableVars = this.getAvailableVariables();
    template.variables.forEach(variable => {
      const varDef = availableVars.find(v => v.name === variable);
      if (!varDef) {
        errors.push(`Unknown variable: ${variable}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get template by ID
  public getTemplateById(id: string): SMSTemplate | undefined {
    return this.getDefaultTemplates().find(template => template.id === id);
  }

  // Get all active templates
  public getActiveTemplates(): SMSTemplate[] {
    return this.getDefaultTemplates().filter(template => template.isActive);
  }

  // Get templates by type
  public getTemplatesByType(type: 'reminder' | 'disposal' | 'notification'): SMSTemplate[] {
    const typeMapping = {
      reminder: ['ENTRY_REMINDER_7_DAYS', 'ENTRY_REMINDER_3_DAYS', 'ENTRY_REMINDER_0_DAYS'],
      disposal: ['DISPOSAL_WARNING_60_DAYS', 'FINAL_DISPOSAL_NOTICE'],
      notification: ['RENEWAL_NOTIFICATION', 'DISPATCH_NOTIFICATION']
    };
    
    return this.getDefaultTemplates().filter(template => 
      typeMapping[type].includes(template.id)
    );
  }

  // Preview template with sample data
  public previewTemplate(templateId: string, sampleData?: Record<string, string>): string {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return 'Template not found';
    }
    
    // Use sample data if provided, otherwise use defaults
    const defaultSampleData: Record<string, string> = {
      customer_name: 'Raghav Rao',
      location_name: 'కోటిలింగలు-కైలాసభూమి',
      expiry_date: '24/09/2025',
      contact_number: '9876543210',
      disposal_date: '27/09/2025',
      river_name: 'River Godavari',
      operator_name: 'John Doe',
      amount: '300'
    };
    
    const data = { ...defaultSampleData, ...sampleData };
    
    return this.formatTemplate(template.content, template.variables.map(varName => data[varName]));
  }

  // Get template statistics
  public getTemplateStats(): {
    total: number;
    active: number;
    inactive: number;
    byType: {
      reminder: number;
      disposal: number;
      notification: number;
    };
  } {
    const templates = this.getDefaultTemplates();
    
    return {
      total: templates.length,
      active: templates.filter(t => t.isActive).length,
      inactive: templates.filter(t => !t.isActive).length,
      byType: {
        reminder: this.getTemplatesByType('reminder').length,
        disposal: this.getTemplatesByType('disposal').length,
        notification: this.getTemplatesByType('notification').length
      }
    };
  }
}

export default SMSTemplatesService.getInstance();