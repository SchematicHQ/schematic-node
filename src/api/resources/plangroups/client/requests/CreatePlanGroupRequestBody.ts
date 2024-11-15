/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {
 *         addOnIds: ["add_on_ids"],
 *         planIds: ["plan_ids"]
 *     }
 */
export interface CreatePlanGroupRequestBody {
    addOnIds: string[];
    defaultPlanId?: string;
    planIds: string[];
    trialDays?: number;
    trialPaymentMethodRequired?: boolean;
}
