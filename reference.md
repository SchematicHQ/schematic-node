# Reference
<details><summary><code>client.<a href="/src/Client.ts">putPlanAudiencesPlanAudienceId</a>(plan_audience_id) -> void</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.putPlanAudiencesPlanAudienceId("plan_audience_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_audience_id:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SchematicClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.<a href="/src/Client.ts">deletePlanAudiencesPlanAudienceId</a>(plan_audience_id) -> void</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.deletePlanAudiencesPlanAudienceId("plan_audience_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_audience_id:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SchematicClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## accounts
<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">listApiKeys</a>({ ...params }) -> Schematic.ListApiKeysResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.listApiKeys({
    environmentId: "environment_id",
    requireEnvironment: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListApiKeysRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">createApiKey</a>({ ...params }) -> Schematic.CreateApiKeyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.createApiKey({
    name: "name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateApiKeyRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">getApiKey</a>(api_key_id) -> Schematic.GetApiKeyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.getApiKey("api_key_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**api_key_id:** `string` — api_key_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">updateApiKey</a>(api_key_id, { ...params }) -> Schematic.UpdateApiKeyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.updateApiKey("api_key_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**api_key_id:** `string` — api_key_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateApiKeyRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">deleteApiKey</a>(api_key_id) -> Schematic.DeleteApiKeyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.deleteApiKey("api_key_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**api_key_id:** `string` — api_key_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">countApiKeys</a>({ ...params }) -> Schematic.CountApiKeysResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.countApiKeys({
    environmentId: "environment_id",
    requireEnvironment: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountApiKeysRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">listApiRequests</a>({ ...params }) -> Schematic.ListApiRequestsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.listApiRequests({
    q: "q",
    requestType: "request_type",
    environmentId: "environment_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListApiRequestsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">getApiRequest</a>(api_request_id) -> Schematic.GetApiRequestResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.getApiRequest("api_request_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**api_request_id:** `string` — api_request_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">countApiRequests</a>({ ...params }) -> Schematic.CountApiRequestsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.countApiRequests({
    q: "q",
    requestType: "request_type",
    environmentId: "environment_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountApiRequestsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">listEnvironments</a>({ ...params }) -> Schematic.ListEnvironmentsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.listEnvironments({
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListEnvironmentsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">createEnvironment</a>({ ...params }) -> Schematic.CreateEnvironmentResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.createEnvironment({
    environmentType: "development",
    name: "name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateEnvironmentRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">getEnvironment</a>(environment_id) -> Schematic.GetEnvironmentResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.getEnvironment("environment_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**environment_id:** `string` — environment_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">updateEnvironment</a>(environment_id, { ...params }) -> Schematic.UpdateEnvironmentResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.updateEnvironment("environment_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**environment_id:** `string` — environment_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateEnvironmentRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">deleteEnvironment</a>(environment_id) -> Schematic.DeleteEnvironmentResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.deleteEnvironment("environment_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**environment_id:** `string` — environment_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">quickstart</a>() -> Schematic.QuickstartResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accounts.quickstart();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `AccountsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## billing
<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">listCoupons</a>({ ...params }) -> Schematic.ListCouponsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.listCoupons({
    isActive: true,
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListCouponsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">upsertBillingCoupon</a>({ ...params }) -> Schematic.UpsertBillingCouponResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.upsertBillingCoupon({
    amountOff: 1,
    duration: "duration",
    durationInMonths: 1,
    externalId: "external_id",
    maxRedemptions: 1,
    name: "name",
    percentOff: 1.1,
    timesRedeemed: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateCouponRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">upsertBillingCustomer</a>({ ...params }) -> Schematic.UpsertBillingCustomerResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.upsertBillingCustomer({
    email: "email",
    externalId: "external_id",
    failedToImport: true,
    meta: {
        "key": "value"
    },
    name: "name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateBillingCustomerRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">listCustomersWithSubscriptions</a>({ ...params }) -> Schematic.ListCustomersWithSubscriptionsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.listCustomersWithSubscriptions({
    name: "name",
    failedToImport: true,
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListCustomersWithSubscriptionsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">countCustomers</a>({ ...params }) -> Schematic.CountCustomersResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.countCustomers({
    name: "name",
    failedToImport: true,
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountCustomersRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">listInvoices</a>({ ...params }) -> Schematic.ListInvoicesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.listInvoices({
    companyId: "company_id",
    customerExternalId: "customer_external_id",
    subscriptionExternalId: "subscription_external_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListInvoicesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">upsertInvoice</a>({ ...params }) -> Schematic.UpsertInvoiceResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.upsertInvoice({
    amountDue: 1,
    amountPaid: 1,
    amountRemaining: 1,
    collectionMethod: "collection_method",
    currency: "currency",
    customerExternalId: "customer_external_id",
    subtotal: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateInvoiceRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">listMeters</a>({ ...params }) -> Schematic.ListMetersResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.listMeters({
    displayName: "display_name",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListMetersRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">upsertBillingMeter</a>({ ...params }) -> Schematic.UpsertBillingMeterResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.upsertBillingMeter({
    displayName: "display_name",
    eventName: "event_name",
    eventPayloadKey: "event_payload_key",
    externalId: "external_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateMeterRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">listPaymentMethods</a>({ ...params }) -> Schematic.ListPaymentMethodsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.listPaymentMethods({
    companyId: "company_id",
    customerExternalId: "customer_external_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListPaymentMethodsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">upsertPaymentMethod</a>({ ...params }) -> Schematic.UpsertPaymentMethodResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.upsertPaymentMethod({
    customerExternalId: "customer_external_id",
    externalId: "external_id",
    paymentMethodType: "payment_method_type"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreatePaymentMethodRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">listBillingPrices</a>({ ...params }) -> Schematic.ListBillingPricesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.listBillingPrices({
    forInitialPlan: true,
    forTrialExpiryPlan: true,
    interval: "interval",
    isActive: true,
    price: 1,
    productId: "product_id",
    q: "q",
    tiersMode: "graduated",
    usageType: "licensed",
    withMeter: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListBillingPricesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">upsertBillingPrice</a>({ ...params }) -> Schematic.UpsertBillingPriceResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.upsertBillingPrice({
    billingScheme: "per_unit",
    currency: "currency",
    externalAccountId: "external_account_id",
    interval: "interval",
    isActive: true,
    price: 1,
    priceExternalId: "price_external_id",
    priceTiers: [{
            priceExternalId: "price_external_id"
        }],
    productExternalId: "product_external_id",
    usageType: "licensed"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateBillingPriceRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">deleteBillingProduct</a>(billing_id) -> Schematic.DeleteBillingProductResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.deleteBillingProduct("billing_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**billing_id:** `string` — billing_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">listBillingProductPrices</a>({ ...params }) -> Schematic.ListBillingProductPricesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.listBillingProductPrices({
    forInitialPlan: true,
    forTrialExpiryPlan: true,
    interval: "interval",
    isActive: true,
    price: 1,
    productId: "product_id",
    q: "q",
    tiersMode: "graduated",
    usageType: "licensed",
    withMeter: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListBillingProductPricesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">deleteProductPrice</a>(billing_id) -> Schematic.DeleteProductPriceResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.deleteProductPrice("billing_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**billing_id:** `string` — billing_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">upsertBillingProduct</a>({ ...params }) -> Schematic.UpsertBillingProductResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.upsertBillingProduct({
    externalId: "external_id",
    name: "name",
    price: 1.1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateBillingProductRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">listBillingProducts</a>({ ...params }) -> Schematic.ListBillingProductsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.listBillingProducts({
    name: "name",
    q: "q",
    priceUsageType: "licensed",
    withoutLinkedToPlan: true,
    withOneTimeCharges: true,
    withZeroPrice: true,
    withPricesOnly: true,
    isActive: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListBillingProductsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">countBillingProducts</a>({ ...params }) -> Schematic.CountBillingProductsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.countBillingProducts({
    name: "name",
    q: "q",
    priceUsageType: "licensed",
    withoutLinkedToPlan: true,
    withOneTimeCharges: true,
    withZeroPrice: true,
    withPricesOnly: true,
    isActive: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountBillingProductsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">upsertBillingSubscription</a>({ ...params }) -> Schematic.UpsertBillingSubscriptionResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.upsertBillingSubscription({
    cancelAtPeriodEnd: true,
    currency: "currency",
    customerExternalId: "customer_external_id",
    discounts: [{
            couponExternalId: "coupon_external_id",
            externalId: "external_id",
            isActive: true,
            startedAt: new Date("2024-01-15T09:30:00.000Z")
        }],
    expiredAt: new Date("2024-01-15T09:30:00.000Z"),
    productExternalIds: [{
            currency: "currency",
            interval: "interval",
            price: 1,
            priceExternalId: "price_external_id",
            productExternalId: "product_external_id",
            quantity: 1,
            usageType: "licensed"
        }],
    subscriptionExternalId: "subscription_external_id",
    totalPrice: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateBillingSubscriptionRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BillingClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## credits
<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">listBillingCredits</a>({ ...params }) -> Schematic.ListBillingCreditsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.listBillingCredits({
    name: "name",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListBillingCreditsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">createBillingCredit</a>({ ...params }) -> Schematic.CreateBillingCreditResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.createBillingCredit({
    currency: "currency",
    description: "description",
    name: "name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateBillingCreditRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">getSingleBillingCredit</a>(credit_id) -> Schematic.GetSingleBillingCreditResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.getSingleBillingCredit("credit_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**credit_id:** `string` — credit_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">updateBillingCredit</a>(credit_id, { ...params }) -> Schematic.UpdateBillingCreditResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.updateBillingCredit("credit_id", {
    description: "description",
    name: "name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**credit_id:** `string` — credit_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateBillingCreditRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">softDeleteBillingCredit</a>(credit_id) -> Schematic.SoftDeleteBillingCreditResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.softDeleteBillingCredit("credit_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**credit_id:** `string` — credit_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">listCreditBundles</a>({ ...params }) -> Schematic.ListCreditBundlesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.listCreditBundles({
    creditId: "credit_id",
    status: "active",
    bundleType: "fixed",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListCreditBundlesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">createCreditBundle</a>({ ...params }) -> Schematic.CreateCreditBundleResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.createCreditBundle({
    bundleName: "bundle_name",
    creditId: "credit_id",
    currency: "currency",
    pricePerUnit: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateCreditBundleRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">getCreditBundle</a>(bundle_id) -> Schematic.GetCreditBundleResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.getCreditBundle("bundle_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**bundle_id:** `string` — bundle_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">updateCreditBundleDetails</a>(bundle_id, { ...params }) -> Schematic.UpdateCreditBundleDetailsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.updateCreditBundleDetails("bundle_id", {
    bundleName: "bundle_name",
    pricePerUnit: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**bundle_id:** `string` — bundle_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateCreditBundleDetailsRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">deleteCreditBundle</a>(bundle_id) -> Schematic.DeleteCreditBundleResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.deleteCreditBundle("bundle_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**bundle_id:** `string` — bundle_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">countCreditBundles</a>({ ...params }) -> Schematic.CountCreditBundlesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.countCreditBundles({
    creditId: "credit_id",
    status: "active",
    bundleType: "fixed",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountCreditBundlesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">countBillingCredits</a>({ ...params }) -> Schematic.CountBillingCreditsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.countBillingCredits({
    name: "name",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountBillingCreditsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">zeroOutGrant</a>(grant_id, { ...params }) -> Schematic.ZeroOutGrantResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.zeroOutGrant("grant_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**grant_id:** `string` — grant_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.ZeroOutGrantRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">grantBillingCreditsToCompany</a>({ ...params }) -> Schematic.GrantBillingCreditsToCompanyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.grantBillingCreditsToCompany({
    companyId: "company_id",
    creditId: "credit_id",
    quantity: 1,
    reason: "billing_credit_auto_topup"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateCompanyCreditGrant` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">listCompanyGrants</a>({ ...params }) -> Schematic.ListCompanyGrantsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.listCompanyGrants({
    companyId: "company_id",
    order: "created_at",
    dir: "asc",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListCompanyGrantsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">countBillingCreditsGrants</a>({ ...params }) -> Schematic.CountBillingCreditsGrantsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.countBillingCreditsGrants({
    creditId: "credit_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountBillingCreditsGrantsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">listGrantsForCredit</a>({ ...params }) -> Schematic.ListGrantsForCreditResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.listGrantsForCredit({
    creditId: "credit_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListGrantsForCreditRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">getEnrichedCreditLedger</a>({ ...params }) -> Schematic.GetEnrichedCreditLedgerResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.getEnrichedCreditLedger({
    companyId: "company_id",
    billingCreditId: "billing_credit_id",
    featureId: "feature_id",
    period: "daily",
    startTime: "start_time",
    endTime: "end_time",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.GetEnrichedCreditLedgerRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">countCreditLedger</a>({ ...params }) -> Schematic.CountCreditLedgerResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.countCreditLedger({
    companyId: "company_id",
    billingCreditId: "billing_credit_id",
    featureId: "feature_id",
    period: "daily",
    startTime: "start_time",
    endTime: "end_time",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountCreditLedgerRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">listBillingPlanCreditGrants</a>({ ...params }) -> Schematic.ListBillingPlanCreditGrantsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.listBillingPlanCreditGrants({
    creditId: "credit_id",
    planId: "plan_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListBillingPlanCreditGrantsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">createBillingPlanCreditGrant</a>({ ...params }) -> Schematic.CreateBillingPlanCreditGrantResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.createBillingPlanCreditGrant({
    creditAmount: 1,
    creditId: "credit_id",
    planId: "plan_id",
    resetCadence: "daily",
    resetStart: "billing_period"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateBillingPlanCreditGrantRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">updateBillingPlanCreditGrant</a>(plan_grant_id, { ...params }) -> Schematic.UpdateBillingPlanCreditGrantResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.updateBillingPlanCreditGrant("plan_grant_id", {
    resetCadence: "daily",
    resetStart: "billing_period"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_grant_id:** `string` — plan_grant_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateBillingPlanCreditGrantRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">deleteBillingPlanCreditGrant</a>(plan_grant_id, { ...params }) -> Schematic.DeleteBillingPlanCreditGrantResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.deleteBillingPlanCreditGrant("plan_grant_id", {
    applyToExisting: true
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_grant_id:** `string` — plan_grant_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.DeleteBillingPlanCreditGrantRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.credits.<a href="/src/api/resources/credits/client/Client.ts">countBillingPlanCreditGrants</a>({ ...params }) -> Schematic.CountBillingPlanCreditGrantsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.credits.countBillingPlanCreditGrants({
    creditId: "credit_id",
    planId: "plan_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountBillingPlanCreditGrantsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CreditsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## checkout
<details><summary><code>client.checkout.<a href="/src/api/resources/checkout/client/Client.ts">internal</a>({ ...params }) -> Schematic.CheckoutInternalResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.checkout.internal({
    addOnIds: [{
            addOnId: "add_on_id",
            priceId: "price_id"
        }],
    companyId: "company_id",
    creditBundles: [{
            bundleId: "bundle_id",
            quantity: 1
        }],
    newPlanId: "new_plan_id",
    newPriceId: "new_price_id",
    payInAdvance: [{
            priceId: "price_id",
            quantity: 1
        }],
    skipTrial: true
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ChangeSubscriptionInternalRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CheckoutClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.checkout.<a href="/src/api/resources/checkout/client/Client.ts">getCheckoutData</a>({ ...params }) -> Schematic.GetCheckoutDataResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.checkout.getCheckoutData({
    companyId: "company_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CheckoutDataRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CheckoutClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.checkout.<a href="/src/api/resources/checkout/client/Client.ts">previewCheckoutInternal</a>({ ...params }) -> Schematic.PreviewCheckoutInternalResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.checkout.previewCheckoutInternal({
    addOnIds: [{
            addOnId: "add_on_id",
            priceId: "price_id"
        }],
    companyId: "company_id",
    creditBundles: [{
            bundleId: "bundle_id",
            quantity: 1
        }],
    newPlanId: "new_plan_id",
    newPriceId: "new_price_id",
    payInAdvance: [{
            priceId: "price_id",
            quantity: 1
        }],
    skipTrial: true
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ChangeSubscriptionInternalRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CheckoutClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.checkout.<a href="/src/api/resources/checkout/client/Client.ts">managePlan</a>({ ...params }) -> Schematic.ManagePlanResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.checkout.managePlan({
    addOnSelections: [{
            planId: "plan_id"
        }],
    companyId: "company_id",
    creditBundles: [{
            bundleId: "bundle_id",
            quantity: 1
        }],
    payInAdvanceEntitlements: [{
            priceId: "price_id",
            quantity: 1
        }]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ManagePlanRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CheckoutClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.checkout.<a href="/src/api/resources/checkout/client/Client.ts">previewManagePlan</a>({ ...params }) -> Schematic.PreviewManagePlanResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.checkout.previewManagePlan({
    addOnSelections: [{
            planId: "plan_id"
        }],
    companyId: "company_id",
    creditBundles: [{
            bundleId: "bundle_id",
            quantity: 1
        }],
    payInAdvanceEntitlements: [{
            priceId: "price_id",
            quantity: 1
        }]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ManagePlanRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CheckoutClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.checkout.<a href="/src/api/resources/checkout/client/Client.ts">cancelSubscription</a>({ ...params }) -> Schematic.CancelSubscriptionResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.checkout.cancelSubscription({
    companyId: "company_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CancelSubscriptionRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CheckoutClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.checkout.<a href="/src/api/resources/checkout/client/Client.ts">updateCustomerSubscriptionTrialEnd</a>(subscription_id, { ...params }) -> Schematic.UpdateCustomerSubscriptionTrialEndResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.checkout.updateCustomerSubscriptionTrialEnd("subscription_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**subscription_id:** `string` — subscription_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateTrialEndRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CheckoutClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## companies
<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">listCompanies</a>({ ...params }) -> Schematic.ListCompaniesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.listCompanies({
    planId: "plan_id",
    q: "q",
    withoutFeatureOverrideFor: "without_feature_override_for",
    withoutPlan: true,
    withSubscription: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListCompaniesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">upsertCompany</a>({ ...params }) -> Schematic.UpsertCompanyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.upsertCompany({
    keys: {
        "key": "value"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.UpsertCompanyRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getCompany</a>(company_id) -> Schematic.GetCompanyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.getCompany("company_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**company_id:** `string` — company_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">deleteCompany</a>(company_id, { ...params }) -> Schematic.DeleteCompanyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.deleteCompany("company_id", {
    cancelSubscription: true,
    prorate: true
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**company_id:** `string` — company_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.DeleteCompanyRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">countCompanies</a>({ ...params }) -> Schematic.CountCompaniesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.countCompanies({
    planId: "plan_id",
    q: "q",
    withoutFeatureOverrideFor: "without_feature_override_for",
    withoutPlan: true,
    withSubscription: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountCompaniesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">countCompaniesForAdvancedFilter</a>({ ...params }) -> Schematic.CountCompaniesForAdvancedFilterResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.countCompaniesForAdvancedFilter({
    monetizedSubscriptions: true,
    q: "q",
    withoutPlan: true,
    withoutSubscription: true,
    sortOrderColumn: "sort_order_column",
    sortOrderDirection: "asc",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountCompaniesForAdvancedFilterRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">createCompany</a>({ ...params }) -> Schematic.CreateCompanyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.createCompany({
    keys: {
        "key": "value"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.UpsertCompanyRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">deleteCompanyByKeys</a>({ ...params }) -> Schematic.DeleteCompanyByKeysResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.deleteCompanyByKeys({
    keys: {
        "key": "value"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.KeysRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">listCompaniesForAdvancedFilter</a>({ ...params }) -> Schematic.ListCompaniesForAdvancedFilterResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.listCompaniesForAdvancedFilter({
    monetizedSubscriptions: true,
    q: "q",
    withoutPlan: true,
    withoutSubscription: true,
    sortOrderColumn: "sort_order_column",
    sortOrderDirection: "asc",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListCompaniesForAdvancedFilterRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">lookupCompany</a>({ ...params }) -> Schematic.LookupCompanyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.lookupCompany({
    keys: {
        "keys": "keys"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.LookupCompanyRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">listCompanyMemberships</a>({ ...params }) -> Schematic.ListCompanyMembershipsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.listCompanyMemberships({
    companyId: "company_id",
    userId: "user_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListCompanyMembershipsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getOrCreateCompanyMembership</a>({ ...params }) -> Schematic.GetOrCreateCompanyMembershipResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.getOrCreateCompanyMembership({
    companyId: "company_id",
    userId: "user_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.GetOrCreateCompanyMembershipRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">deleteCompanyMembership</a>(company_membership_id) -> Schematic.DeleteCompanyMembershipResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.deleteCompanyMembership("company_membership_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**company_membership_id:** `string` — company_membership_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getActiveCompanySubscription</a>({ ...params }) -> Schematic.GetActiveCompanySubscriptionResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.getActiveCompanySubscription({
    companyId: "company_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.GetActiveCompanySubscriptionRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">upsertCompanyTrait</a>({ ...params }) -> Schematic.UpsertCompanyTraitResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.upsertCompanyTrait({
    keys: {
        "key": "value"
    },
    trait: "trait"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.UpsertTraitRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">listEntityKeyDefinitions</a>({ ...params }) -> Schematic.ListEntityKeyDefinitionsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.listEntityKeyDefinitions({
    entityType: "company",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListEntityKeyDefinitionsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">countEntityKeyDefinitions</a>({ ...params }) -> Schematic.CountEntityKeyDefinitionsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.countEntityKeyDefinitions({
    entityType: "company",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountEntityKeyDefinitionsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">listEntityTraitDefinitions</a>({ ...params }) -> Schematic.ListEntityTraitDefinitionsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.listEntityTraitDefinitions({
    entityType: "company",
    q: "q",
    traitType: "boolean",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListEntityTraitDefinitionsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getOrCreateEntityTraitDefinition</a>({ ...params }) -> Schematic.GetOrCreateEntityTraitDefinitionResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.getOrCreateEntityTraitDefinition({
    entityType: "company",
    hierarchy: ["hierarchy"],
    traitType: "boolean"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateEntityTraitDefinitionRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getEntityTraitDefinition</a>(entity_trait_definition_id) -> Schematic.GetEntityTraitDefinitionResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.getEntityTraitDefinition("entity_trait_definition_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**entity_trait_definition_id:** `string` — entity_trait_definition_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">updateEntityTraitDefinition</a>(entity_trait_definition_id, { ...params }) -> Schematic.UpdateEntityTraitDefinitionResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.updateEntityTraitDefinition("entity_trait_definition_id", {
    traitType: "boolean"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**entity_trait_definition_id:** `string` — entity_trait_definition_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateEntityTraitDefinitionRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">countEntityTraitDefinitions</a>({ ...params }) -> Schematic.CountEntityTraitDefinitionsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.countEntityTraitDefinitions({
    entityType: "company",
    q: "q",
    traitType: "boolean",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountEntityTraitDefinitionsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getEntityTraitValues</a>({ ...params }) -> Schematic.GetEntityTraitValuesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.getEntityTraitValues({
    definitionId: "definition_id",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.GetEntityTraitValuesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">listPlanChanges</a>({ ...params }) -> Schematic.ListPlanChangesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.listPlanChanges({
    action: "action",
    basePlanAction: "base_plan_action",
    companyId: "company_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListPlanChangesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getPlanChange</a>(plan_change_id) -> Schematic.GetPlanChangeResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.getPlanChange("plan_change_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_change_id:** `string` — plan_change_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">listPlanTraits</a>({ ...params }) -> Schematic.ListPlanTraitsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.listPlanTraits({
    planId: "plan_id",
    traitId: "trait_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListPlanTraitsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">createPlanTrait</a>({ ...params }) -> Schematic.CreatePlanTraitResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.createPlanTrait({
    planId: "plan_id",
    traitId: "trait_id",
    traitValue: "trait_value"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreatePlanTraitRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getPlanTrait</a>(plan_trait_id) -> Schematic.GetPlanTraitResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.getPlanTrait("plan_trait_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_trait_id:** `string` — plan_trait_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">updatePlanTrait</a>(plan_trait_id, { ...params }) -> Schematic.UpdatePlanTraitResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.updatePlanTrait("plan_trait_id", {
    planId: "plan_id",
    traitValue: "trait_value"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_trait_id:** `string` — plan_trait_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdatePlanTraitRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">deletePlanTrait</a>(plan_trait_id) -> Schematic.DeletePlanTraitResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.deletePlanTrait("plan_trait_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_trait_id:** `string` — plan_trait_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">updatePlanTraitsBulk</a>({ ...params }) -> Schematic.UpdatePlanTraitsBulkResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.updatePlanTraitsBulk({
    applyToExistingCompanies: true,
    planId: "plan_id",
    traits: [{
            traitId: "trait_id",
            traitValue: "trait_value"
        }]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.UpdatePlanTraitBulkRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">countPlanTraits</a>({ ...params }) -> Schematic.CountPlanTraitsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.countPlanTraits({
    planId: "plan_id",
    traitId: "trait_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountPlanTraitsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">upsertUserTrait</a>({ ...params }) -> Schematic.UpsertUserTraitResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.upsertUserTrait({
    keys: {
        "key": "value"
    },
    trait: "trait"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.UpsertTraitRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">listUsers</a>({ ...params }) -> Schematic.ListUsersResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.listUsers({
    companyId: "company_id",
    planId: "plan_id",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListUsersRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">upsertUser</a>({ ...params }) -> Schematic.UpsertUserResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.upsertUser({
    keys: {
        "key": "value"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.UpsertUserRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getUser</a>(user_id) -> Schematic.GetUserResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.getUser("user_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**user_id:** `string` — user_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">deleteUser</a>(user_id) -> Schematic.DeleteUserResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.deleteUser("user_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**user_id:** `string` — user_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">countUsers</a>({ ...params }) -> Schematic.CountUsersResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.countUsers({
    companyId: "company_id",
    planId: "plan_id",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountUsersRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">createUser</a>({ ...params }) -> Schematic.CreateUserResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.createUser({
    keys: {
        "key": "value"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.UpsertUserRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">deleteUserByKeys</a>({ ...params }) -> Schematic.DeleteUserByKeysResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.deleteUserByKeys({
    keys: {
        "key": "value"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.KeysRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">lookupUser</a>({ ...params }) -> Schematic.LookupUserResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.lookupUser({
    keys: {
        "keys": "keys"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.LookupUserRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CompaniesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## entitlements
<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">listCompanyOverrides</a>({ ...params }) -> Schematic.ListCompanyOverridesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.listCompanyOverrides({
    companyId: "company_id",
    featureId: "feature_id",
    withoutExpired: true,
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListCompanyOverridesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">createCompanyOverride</a>({ ...params }) -> Schematic.CreateCompanyOverrideResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.createCompanyOverride({
    companyId: "company_id",
    featureId: "feature_id",
    valueType: "boolean"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateCompanyOverrideRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">getCompanyOverride</a>(company_override_id) -> Schematic.GetCompanyOverrideResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.getCompanyOverride("company_override_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**company_override_id:** `string` — company_override_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">updateCompanyOverride</a>(company_override_id, { ...params }) -> Schematic.UpdateCompanyOverrideResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.updateCompanyOverride("company_override_id", {
    valueType: "boolean"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**company_override_id:** `string` — company_override_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateCompanyOverrideRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">deleteCompanyOverride</a>(company_override_id) -> Schematic.DeleteCompanyOverrideResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.deleteCompanyOverride("company_override_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**company_override_id:** `string` — company_override_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">countCompanyOverrides</a>({ ...params }) -> Schematic.CountCompanyOverridesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.countCompanyOverrides({
    companyId: "company_id",
    featureId: "feature_id",
    withoutExpired: true,
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountCompanyOverridesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">listFeatureCompanies</a>({ ...params }) -> Schematic.ListFeatureCompaniesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.listFeatureCompanies({
    featureId: "feature_id",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListFeatureCompaniesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">countFeatureCompanies</a>({ ...params }) -> Schematic.CountFeatureCompaniesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.countFeatureCompanies({
    featureId: "feature_id",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountFeatureCompaniesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">listFeatureUsage</a>({ ...params }) -> Schematic.ListFeatureUsageResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.listFeatureUsage({
    companyId: "company_id",
    q: "q",
    withoutNegativeEntitlements: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListFeatureUsageRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">countFeatureUsage</a>({ ...params }) -> Schematic.CountFeatureUsageResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.countFeatureUsage({
    companyId: "company_id",
    q: "q",
    withoutNegativeEntitlements: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountFeatureUsageRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">listFeatureUsers</a>({ ...params }) -> Schematic.ListFeatureUsersResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.listFeatureUsers({
    featureId: "feature_id",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListFeatureUsersRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">countFeatureUsers</a>({ ...params }) -> Schematic.CountFeatureUsersResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.countFeatureUsers({
    featureId: "feature_id",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountFeatureUsersRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">listPlanEntitlements</a>({ ...params }) -> Schematic.ListPlanEntitlementsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.listPlanEntitlements({
    featureId: "feature_id",
    planId: "plan_id",
    q: "q",
    withMeteredProducts: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListPlanEntitlementsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">createPlanEntitlement</a>({ ...params }) -> Schematic.CreatePlanEntitlementResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.createPlanEntitlement({
    featureId: "feature_id",
    planId: "plan_id",
    valueType: "boolean"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreatePlanEntitlementRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">getPlanEntitlement</a>(plan_entitlement_id) -> Schematic.GetPlanEntitlementResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.getPlanEntitlement("plan_entitlement_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_entitlement_id:** `string` — plan_entitlement_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">updatePlanEntitlement</a>(plan_entitlement_id, { ...params }) -> Schematic.UpdatePlanEntitlementResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.updatePlanEntitlement("plan_entitlement_id", {
    valueType: "boolean"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_entitlement_id:** `string` — plan_entitlement_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdatePlanEntitlementRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">deletePlanEntitlement</a>(plan_entitlement_id) -> Schematic.DeletePlanEntitlementResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.deletePlanEntitlement("plan_entitlement_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_entitlement_id:** `string` — plan_entitlement_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">countPlanEntitlements</a>({ ...params }) -> Schematic.CountPlanEntitlementsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.countPlanEntitlements({
    featureId: "feature_id",
    planId: "plan_id",
    q: "q",
    withMeteredProducts: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountPlanEntitlementsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">duplicatePlanEntitlements</a>({ ...params }) -> Schematic.DuplicatePlanEntitlementsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.duplicatePlanEntitlements({
    sourcePlanId: "source_plan_id",
    targetPlanId: "target_plan_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.DuplicatePlanEntitlementsRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">getFeatureUsageByCompany</a>({ ...params }) -> Schematic.GetFeatureUsageByCompanyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.getFeatureUsageByCompany({
    keys: {
        "keys": "keys"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.GetFeatureUsageByCompanyRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EntitlementsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## plans
<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">updateCompanyPlans</a>(company_plan_id, { ...params }) -> Schematic.UpdateCompanyPlansResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.updateCompanyPlans("company_plan_id", {
    addOnIds: ["add_on_ids"]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**company_plan_id:** `string` — company_plan_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateCompanyPlansRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlansClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">listPlans</a>({ ...params }) -> Schematic.ListPlansResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.listPlans({
    companyId: "company_id",
    forFallbackPlan: true,
    forInitialPlan: true,
    forTrialExpiryPlan: true,
    hasProductId: true,
    planType: "plan",
    q: "q",
    withoutEntitlementFor: "without_entitlement_for",
    withoutPaidProductId: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListPlansRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlansClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">createPlan</a>({ ...params }) -> Schematic.CreatePlanResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.createPlan({
    description: "description",
    name: "name",
    planType: "plan"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreatePlanRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlansClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">getPlan</a>(plan_id) -> Schematic.GetPlanResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.getPlan("plan_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_id:** `string` — plan_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlansClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">updatePlan</a>(plan_id, { ...params }) -> Schematic.UpdatePlanResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.updatePlan("plan_id", {
    name: "name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_id:** `string` — plan_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdatePlanRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlansClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">deletePlan</a>(plan_id) -> Schematic.DeletePlanResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.deletePlan("plan_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_id:** `string` — plan_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlansClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">upsertBillingProductPlan</a>(plan_id, { ...params }) -> Schematic.UpsertBillingProductPlanResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.upsertBillingProductPlan("plan_id", {
    chargeType: "free",
    isTrialable: true
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_id:** `string` — plan_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpsertBillingProductRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlansClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">countPlans</a>({ ...params }) -> Schematic.CountPlansResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.countPlans({
    companyId: "company_id",
    forFallbackPlan: true,
    forInitialPlan: true,
    forTrialExpiryPlan: true,
    hasProductId: true,
    planType: "plan",
    q: "q",
    withoutEntitlementFor: "without_entitlement_for",
    withoutPaidProductId: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountPlansRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlansClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">listPlanIssues</a>({ ...params }) -> Schematic.ListPlanIssuesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.listPlanIssues({
    planId: "plan_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListPlanIssuesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlansClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## components
<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">listComponents</a>({ ...params }) -> Schematic.ListComponentsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.components.listComponents({
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListComponentsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ComponentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">createComponent</a>({ ...params }) -> Schematic.CreateComponentResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.components.createComponent({
    entityType: "billing",
    name: "name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateComponentRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ComponentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">getComponent</a>(component_id) -> Schematic.GetComponentResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.components.getComponent("component_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**component_id:** `string` — component_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ComponentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">updateComponent</a>(component_id, { ...params }) -> Schematic.UpdateComponentResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.components.updateComponent("component_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**component_id:** `string` — component_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateComponentRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ComponentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">deleteComponent</a>(component_id) -> Schematic.DeleteComponentResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.components.deleteComponent("component_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**component_id:** `string` — component_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ComponentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">countComponents</a>({ ...params }) -> Schematic.CountComponentsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.components.countComponents({
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountComponentsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ComponentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">previewComponentData</a>({ ...params }) -> Schematic.PreviewComponentDataResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.components.previewComponentData({
    companyId: "company_id",
    componentId: "component_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.PreviewComponentDataRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ComponentsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## dataexports
<details><summary><code>client.dataexports.<a href="/src/api/resources/dataexports/client/Client.ts">createDataExport</a>({ ...params }) -> Schematic.CreateDataExportResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.dataexports.createDataExport({
    metadata: "metadata"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateDataExportRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DataexportsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.dataexports.<a href="/src/api/resources/dataexports/client/Client.ts">getDataExportArtifact</a>(data_export_id) -> stream.Readable</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.dataexports.getDataExportArtifact("data_export_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**data_export_id:** `string` — data_export_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DataexportsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## events
<details><summary><code>client.events.<a href="/src/api/resources/events/client/Client.ts">createEventBatch</a>({ ...params }) -> Schematic.CreateEventBatchResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.events.createEventBatch({
    events: [{
            eventType: "flag_check"
        }]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateEventBatchRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EventsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.events.<a href="/src/api/resources/events/client/Client.ts">getEventSummaries</a>({ ...params }) -> Schematic.GetEventSummariesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.events.getEventSummaries({
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.GetEventSummariesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EventsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.events.<a href="/src/api/resources/events/client/Client.ts">listEvents</a>({ ...params }) -> Schematic.ListEventsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.events.listEvents({
    companyId: "company_id",
    eventSubtype: "event_subtype",
    flagId: "flag_id",
    userId: "user_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListEventsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EventsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.events.<a href="/src/api/resources/events/client/Client.ts">createEvent</a>({ ...params }) -> Schematic.CreateEventResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.events.createEvent({
    eventType: "flag_check"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateEventRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EventsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.events.<a href="/src/api/resources/events/client/Client.ts">getEvent</a>(event_id) -> Schematic.GetEventResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.events.getEvent("event_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**event_id:** `string` — event_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EventsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.events.<a href="/src/api/resources/events/client/Client.ts">getSegmentIntegrationStatus</a>() -> Schematic.GetSegmentIntegrationStatusResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.events.getSegmentIntegrationStatus();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `EventsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## features
<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">listFeatures</a>({ ...params }) -> Schematic.ListFeaturesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.listFeatures({
    q: "q",
    withoutCompanyOverrideFor: "without_company_override_for",
    withoutPlanEntitlementFor: "without_plan_entitlement_for",
    booleanRequireEvent: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListFeaturesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">createFeature</a>({ ...params }) -> Schematic.CreateFeatureResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.createFeature({
    description: "description",
    featureType: "boolean",
    name: "name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateFeatureRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">getFeature</a>(feature_id) -> Schematic.GetFeatureResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.getFeature("feature_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**feature_id:** `string` — feature_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">updateFeature</a>(feature_id, { ...params }) -> Schematic.UpdateFeatureResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.updateFeature("feature_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**feature_id:** `string` — feature_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateFeatureRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">deleteFeature</a>(feature_id) -> Schematic.DeleteFeatureResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.deleteFeature("feature_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**feature_id:** `string` — feature_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">countFeatures</a>({ ...params }) -> Schematic.CountFeaturesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.countFeatures({
    q: "q",
    withoutCompanyOverrideFor: "without_company_override_for",
    withoutPlanEntitlementFor: "without_plan_entitlement_for",
    booleanRequireEvent: true,
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountFeaturesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">listFlags</a>({ ...params }) -> Schematic.ListFlagsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.listFlags({
    featureId: "feature_id",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListFlagsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">createFlag</a>({ ...params }) -> Schematic.CreateFlagResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.createFlag({
    defaultValue: true,
    description: "description",
    flagType: "boolean",
    key: "key",
    name: "name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateFlagRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">getFlag</a>(flag_id) -> Schematic.GetFlagResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.getFlag("flag_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**flag_id:** `string` — flag_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">updateFlag</a>(flag_id, { ...params }) -> Schematic.UpdateFlagResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.updateFlag("flag_id", {
    defaultValue: true,
    description: "description",
    flagType: "boolean",
    key: "key",
    name: "name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**flag_id:** `string` — flag_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.CreateFlagRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">deleteFlag</a>(flag_id) -> Schematic.DeleteFlagResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.deleteFlag("flag_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**flag_id:** `string` — flag_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">updateFlagRules</a>(flag_id, { ...params }) -> Schematic.UpdateFlagRulesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.updateFlagRules("flag_id", {
    rules: [{
            conditionGroups: [{
                    conditions: [{
                            conditionType: "company",
                            operator: "eq",
                            resourceIds: ["resource_ids"]
                        }]
                }],
            conditions: [{
                    conditionType: "company",
                    operator: "eq",
                    resourceIds: ["resource_ids"]
                }],
            name: "name",
            priority: 1,
            value: true
        }]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**flag_id:** `string` — flag_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateFlagRulesRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">checkFlag</a>(key, { ...params }) -> Schematic.CheckFlagResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.checkFlag("key", {});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**key:** `string` — key
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.CheckFlagRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">checkFlags</a>({ ...params }) -> Schematic.CheckFlagsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.checkFlags({});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CheckFlagRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">checkFlagsBulk</a>({ ...params }) -> Schematic.CheckFlagsBulkResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.checkFlagsBulk({
    contexts: [{}]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CheckFlagsBulkRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">countFlags</a>({ ...params }) -> Schematic.CountFlagsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.countFlags({
    featureId: "feature_id",
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountFlagsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `FeaturesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## plangroups
<details><summary><code>client.plangroups.<a href="/src/api/resources/plangroups/client/Client.ts">getPlanGroup</a>() -> Schematic.GetPlanGroupResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plangroups.getPlanGroup();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `PlangroupsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.plangroups.<a href="/src/api/resources/plangroups/client/Client.ts">createPlanGroup</a>({ ...params }) -> Schematic.CreatePlanGroupResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plangroups.createPlanGroup({
    addOnIds: ["add_on_ids"],
    checkoutCollectAddress: true,
    checkoutCollectEmail: true,
    checkoutCollectPhone: true,
    enableTaxCollection: true,
    orderedAddOns: [{
            planId: "plan_id"
        }],
    orderedBundleList: [{
            bundleId: "bundleId"
        }],
    orderedPlans: [{
            planId: "plan_id"
        }],
    preventDowngradesWhenOverLimit: true,
    preventSelfServiceDowngrade: true,
    prorationBehavior: "create_prorations",
    showAsMonthlyPrices: true,
    showCredits: true,
    showPeriodToggle: true,
    showZeroPriceAsFree: true,
    syncCustomerBillingDetails: true
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreatePlanGroupRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlangroupsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.plangroups.<a href="/src/api/resources/plangroups/client/Client.ts">updatePlanGroup</a>(plan_group_id, { ...params }) -> Schematic.UpdatePlanGroupResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plangroups.updatePlanGroup("plan_group_id", {
    addOnIds: ["add_on_ids"],
    checkoutCollectAddress: true,
    checkoutCollectEmail: true,
    checkoutCollectPhone: true,
    enableTaxCollection: true,
    orderedAddOns: [{
            planId: "plan_id"
        }],
    orderedBundleList: [{
            bundleId: "bundleId"
        }],
    orderedPlans: [{
            planId: "plan_id"
        }],
    preventDowngradesWhenOverLimit: true,
    preventSelfServiceDowngrade: true,
    prorationBehavior: "create_prorations",
    showAsMonthlyPrices: true,
    showCredits: true,
    showPeriodToggle: true,
    showZeroPriceAsFree: true,
    syncCustomerBillingDetails: true
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**plan_group_id:** `string` — plan_group_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdatePlanGroupRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PlangroupsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## accesstokens
<details><summary><code>client.accesstokens.<a href="/src/api/resources/accesstokens/client/Client.ts">issueTemporaryAccessToken</a>({ ...params }) -> Schematic.IssueTemporaryAccessTokenResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.accesstokens.issueTemporaryAccessToken({
    lookup: {
        "key": "value"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.IssueTemporaryAccessTokenRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AccesstokensClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## webhooks
<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">listWebhookEvents</a>({ ...params }) -> Schematic.ListWebhookEventsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.listWebhookEvents({
    q: "q",
    webhookId: "webhook_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListWebhookEventsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhooksClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">getWebhookEvent</a>(webhook_event_id) -> Schematic.GetWebhookEventResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.getWebhookEvent("webhook_event_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**webhook_event_id:** `string` — webhook_event_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhooksClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">countWebhookEvents</a>({ ...params }) -> Schematic.CountWebhookEventsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.countWebhookEvents({
    q: "q",
    webhookId: "webhook_id",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountWebhookEventsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhooksClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">listWebhooks</a>({ ...params }) -> Schematic.ListWebhooksResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.listWebhooks({
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.ListWebhooksRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhooksClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">createWebhook</a>({ ...params }) -> Schematic.CreateWebhookResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.createWebhook({
    name: "name",
    requestTypes: ["subscription.trial.ended"],
    url: "url"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CreateWebhookRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhooksClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">getWebhook</a>(webhook_id) -> Schematic.GetWebhookResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.getWebhook("webhook_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**webhook_id:** `string` — webhook_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhooksClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">updateWebhook</a>(webhook_id, { ...params }) -> Schematic.UpdateWebhookResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.updateWebhook("webhook_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**webhook_id:** `string` — webhook_id
    
</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateWebhookRequestBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhooksClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">deleteWebhook</a>(webhook_id) -> Schematic.DeleteWebhookResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.deleteWebhook("webhook_id");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**webhook_id:** `string` — webhook_id
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhooksClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">countWebhooks</a>({ ...params }) -> Schematic.CountWebhooksResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.countWebhooks({
    q: "q",
    limit: 1,
    offset: 1
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Schematic.CountWebhooksRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WebhooksClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>
