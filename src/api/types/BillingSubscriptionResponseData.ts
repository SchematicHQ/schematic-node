/**
 * This file was auto-generated by Fern from our API Definition.
 */

export interface BillingSubscriptionResponseData {
    companyId?: string;
    createdAt: Date;
    currency: string;
    customerExternalId: string;
    expiredAt?: Date;
    id: string;
    interval: string;
    metadata?: Record<string, unknown>;
    periodEnd: number;
    periodStart: number;
    status: string;
    subscriptionExternalId: string;
    totalPrice: number;
    trialEnd?: number;
    trialEndSetting?: string;
}
