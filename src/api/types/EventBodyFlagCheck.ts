/**
 * This file was auto-generated by Fern from our API Definition.
 */

export interface EventBodyFlagCheck {
    /** Schematic company ID (starting with 'comp_') of the company evaluated, if any */
    companyId?: string;
    /** Report an error that occurred during the flag check */
    error?: string;
    /** Schematic flag ID (starting with 'flag_') for the flag matching the key, if any */
    flagId?: string;
    /** The key of the flag being checked */
    flagKey: string;
    /** The reason why the value was returned */
    reason: string;
    /** Key-value pairs used to to identify company for which the flag was checked */
    reqCompany?: Record<string, string>;
    /** Key-value pairs used to to identify user for which the flag was checked */
    reqUser?: Record<string, string>;
    /** Schematic rule ID (starting with 'rule_') of the rule that matched for the flag, if any */
    ruleId?: string;
    /** Schematic user ID (starting with 'user_') of the user evaluated, if any */
    userId?: string;
    /** The value of the flag for the given company and/or user */
    value: boolean;
}
