"use strict";
// SMS Template Management System - Firebase Admin SDK Compatible Version
// This is a simplified version for Firebase Functions use
Object.defineProperty(exports, "__esModule", { value: true });
exports.DLT_TEMPLATES = exports.TEMPLATE_NAMES = exports.TEMPLATE_IDS = void 0;
/**
 * DLT Template Registry - All approved templates with their IDs and variable structures
 * This file contains the official DLT-approved templates for the Cremation Management System
 */
// Template key to template ID mapping
exports.TEMPLATE_IDS = {
    threeDayReminder: '1707175786299400837',
    lastdayRenewal: '1707175786326312933',
    renewalConfirmCustomer: '1707175786362862204',
    renewalConfirmAdmin: '1707175786389503209',
    dispatchConfirmCustomer: '1707175786420863806',
    deliveryConfirmAdmin: '1707175786441865610',
    finalDisposalReminder: '1707175786481546224',
    finalDisposalReminderAdmin: '1707175786495860514',
};
// Template key to template name mapping for display purposes
exports.TEMPLATE_NAMES = {
    threeDayReminder: '3 Days Expiry Reminder',
    lastdayRenewal: 'Last Day Renewal Reminder',
    renewalConfirmCustomer: 'Renewal Confirmation (Customer)',
    renewalConfirmAdmin: 'Renewal Confirmation (Admin)',
    dispatchConfirmCustomer: 'Dispatch Confirmation (Customer)',
    deliveryConfirmAdmin: 'Delivery Confirmation (Admin)',
    finalDisposalReminder: 'Final Disposal Reminder',
    finalDisposalReminderAdmin: 'Final Disposal Reminder (Admin)',
};
// DLT Template definitions with exact variable structures as approved
exports.DLT_TEMPLATES = [
    {
        key: 'threeDayReminder',
        id: exports.TEMPLATE_IDS.threeDayReminder,
        name: exports.TEMPLATE_NAMES.threeDayReminder,
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
        category: 'reminder'
    },
    {
        key: 'lastdayRenewal',
        id: exports.TEMPLATE_IDS.lastdayRenewal,
        name: exports.TEMPLATE_NAMES.lastdayRenewal,
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
        category: 'reminder'
    },
    {
        key: 'renewalConfirmCustomer',
        id: exports.TEMPLATE_IDS.renewalConfirmCustomer,
        name: exports.TEMPLATE_NAMES.renewalConfirmCustomer,
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
        category: 'confirmation'
    },
    {
        key: 'renewalConfirmAdmin',
        id: exports.TEMPLATE_IDS.renewalConfirmAdmin,
        name: exports.TEMPLATE_NAMES.renewalConfirmAdmin,
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
        category: 'confirmation'
    },
    {
        key: 'dispatchConfirmCustomer',
        id: exports.TEMPLATE_IDS.dispatchConfirmCustomer,
        name: exports.TEMPLATE_NAMES.dispatchConfirmCustomer,
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
        category: 'confirmation'
    },
    {
        key: 'deliveryConfirmAdmin',
        id: exports.TEMPLATE_IDS.deliveryConfirmAdmin,
        name: exports.TEMPLATE_NAMES.deliveryConfirmAdmin,
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
        category: 'confirmation'
    },
    {
        key: 'finalDisposalReminder',
        id: exports.TEMPLATE_IDS.finalDisposalReminder,
        name: exports.TEMPLATE_NAMES.finalDisposalReminder,
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
        category: 'disposal'
    },
    {
        key: 'finalDisposalReminderAdmin',
        id: exports.TEMPLATE_IDS.finalDisposalReminderAdmin,
        name: exports.TEMPLATE_NAMES.finalDisposalReminderAdmin,
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
     * Get all available DLT templates
     */
    getAllTemplates() {
        return exports.DLT_TEMPLATES;
    }
    /**
     * Get template by key
     */
    getTemplateByKey(key) {
        return exports.DLT_TEMPLATES.find(template => template.key === key);
    }
    /**
     * Get template by ID
     */
    getTemplateById(id) {
        return exports.DLT_TEMPLATES.find(template => template.id === id);
    }
    /**
     * Get active templates by category
     */
    getTemplatesByCategory(category) {
        return exports.DLT_TEMPLATES.filter(template => template.category === category && template.isActive);
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
        // Check all required variables are present
        for (const variable of template.variables) {
            if (variable.required) {
                const value = variables[variable.name];
                if (value === undefined || value === null || value === '') {
                    errors.push(`Required variable '${variable.name}' is missing or empty`);
                }
            }
        }
        // Validate mobile number format (basic validation)
        const mobileFields = ['mobile', 'adminMobile'];
        for (const field of mobileFields) {
            const value = variables[field];
            if (value && !/^[6-9]\d{9}$/.test(value.toString())) {
                errors.push(`Invalid mobile number format for '${field}': ${value}`);
            }
        }
        // Validate date format (basic validation)
        const dateFields = ['date'];
        for (const field of dateFields) {
            const value = variables[field];
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
    getTemplateStats() {
        const templates = exports.DLT_TEMPLATES;
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
