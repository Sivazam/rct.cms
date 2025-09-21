"use strict";
// SMS Template Management System - Updated with Fast2SMS Message IDs
// This version uses Fast2SMS Message IDs for API calls, not DLT Template IDs
Object.defineProperty(exports, "__esModule", { value: true });
exports.FASTSMS_TEMPLATES = exports.TEMPLATE_NAMES = exports.TEMPLATE_IDS = void 0;
/**
 * Fast2SMS Message ID Registry - All approved templates with their correct Message IDs
 * These Message IDs are used in the "message" parameter of Fast2SMS API calls
 */
// Template key to Fast2SMS Message ID mapping (CORRECTED)
exports.TEMPLATE_IDS = {
    threeDayReminder: '198607', // Fast2SMS Message ID
    lastdayRenewal: '198608', // Fast2SMS Message ID
    renewalConfirmCustomer: '198609', // Fast2SMS Message ID
    renewalConfirmAdmin: '198610', // Fast2SMS Message ID
    dispatchConfirmCustomer: '198611', // Fast2SMS Message ID
    deliveryConfirmAdmin: '198612', // Fast2SMS Message ID
    finalDisposalReminderAdmin: '198613', // Fast2SMS Message ID
};
// Template key to template name mapping for display purposes
exports.TEMPLATE_NAMES = {
    threeDayReminder: '3 Days Expiry Reminder',
    lastdayRenewal: 'Last Day Renewal Reminder',
    renewalConfirmCustomer: 'Renewal Confirmation (Customer)',
    renewalConfirmAdmin: 'Renewal Confirmation (Admin)',
    dispatchConfirmCustomer: 'Dispatch Confirmation (Customer)',
    deliveryConfirmAdmin: 'Delivery Confirmation (Admin)',
    finalDisposalReminderAdmin: 'Final Disposal Reminder (Admin)',
};
// Fast2SMS Template definitions with exact variable structures as per user requirements
exports.FASTSMS_TEMPLATES = [
    {
        key: 'threeDayReminder',
        id: exports.TEMPLATE_IDS.threeDayReminder,
        name: exports.TEMPLATE_NAMES.threeDayReminder,
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
        id: exports.TEMPLATE_IDS.lastdayRenewal,
        name: exports.TEMPLATE_NAMES.lastdayRenewal,
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
        id: exports.TEMPLATE_IDS.renewalConfirmCustomer,
        name: exports.TEMPLATE_NAMES.renewalConfirmCustomer,
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
        id: exports.TEMPLATE_IDS.renewalConfirmAdmin,
        name: exports.TEMPLATE_NAMES.renewalConfirmAdmin,
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
        id: exports.TEMPLATE_IDS.dispatchConfirmCustomer,
        name: exports.TEMPLATE_NAMES.dispatchConfirmCustomer,
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
        id: exports.TEMPLATE_IDS.deliveryConfirmAdmin,
        name: exports.TEMPLATE_NAMES.deliveryConfirmAdmin,
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
        key: 'finalDisposalReminderAdmin',
        id: exports.TEMPLATE_IDS.finalDisposalReminderAdmin,
        name: exports.TEMPLATE_NAMES.finalDisposalReminderAdmin,
        description: 'Send final disposal reminder to admin',
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
    }
];
class SMSTemplatesService {
    constructor() { }
    static getInstance() {
        if (!SMSTemplatesService.instance) {
            SMSTemplatesService.instance = new SMSTemplatesService();
        }
        return SMSTemplatesService.instance;
    }
    /**
     * Get all available Fast2SMS templates
     */
    getAllTemplates() {
        return exports.FASTSMS_TEMPLATES;
    }
    /**
     * Get template by key
     */
    getTemplateByKey(key) {
        return exports.FASTSMS_TEMPLATES.find(template => template.key === key);
    }
    /**
     * Get template by ID
     */
    getTemplateById(id) {
        return exports.FASTSMS_TEMPLATES.find(template => template.id === id);
    }
    /**
     * Get active templates by category
     */
    getTemplatesByCategory(category) {
        return exports.FASTSMS_TEMPLATES.filter(template => template.category === category && template.isActive);
    }
    /**
     * Format variables for FastSMS API (pipe-separated values in exact order)
     */
    formatVariablesForAPI(templateKey, variables) {
        const template = this.getTemplateByKey(templateKey);
        if (!template) {
            throw new Error(`Template not found: ${templateKey}`);
        }
        const variableValues = [];
        // Sort variables by position and extract values
        const sortedVariables = [...template.variables].sort((a, b) => a.position - b.position);
        for (const variable of sortedVariables) {
            const value = variables[variable.name];
            if (value === undefined || value === null || value === '') {
                if (variable.required) {
                    throw new Error(`Required variable '${variable.name}' is missing or empty for template '${templateKey}'`);
                }
                variableValues.push(''); // Use empty string for optional variables
            }
            else {
                variableValues.push(value.toString());
            }
        }
        return variableValues.join('|');
    }
    /**
     * Validate template variables
     */
    validateTemplateVariables(templateKey, variables) {
        const template = this.getTemplateByKey(templateKey);
        if (!template) {
            return {
                isValid: false,
                errors: [`Template not found: ${templateKey}`]
            };
        }
        const errors = [];
        // Check all required variables are present and non-empty
        for (let i = 1; i <= template.variableCount; i++) {
            const varName = `var${i}`;
            const value = variables[varName];
            if (value === undefined || value === null || value === '') {
                errors.push(`Required variable 'var${i}' is missing or empty for template '${templateKey}'`);
            }
        }
        // Validate mobile number format for any variable that contains a mobile number
        // Check var4, var5, var6 as they commonly contain mobile numbers
        const mobileVarPositions = [4, 5, 6];
        for (const pos of mobileVarPositions) {
            const varName = `var${pos}`;
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
            const varName = `var${pos}`;
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
    getTemplateStats() {
        const templates = exports.FASTSMS_TEMPLATES;
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
exports.default = SMSTemplatesService;
