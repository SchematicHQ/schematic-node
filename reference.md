# Reference

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
    requireEnvironment: true,
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

**requestOptions:** `Accounts.RequestOptions`

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
    name: "name",
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

**requestOptions:** `Accounts.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">getApiKey</a>(apiKeyId) -> Schematic.GetApiKeyResponse</code></summary>
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

**apiKeyId:** `string` — api_key_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Accounts.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">updateApiKey</a>(apiKeyId, { ...params }) -> Schematic.UpdateApiKeyResponse</code></summary>
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

**apiKeyId:** `string` — api_key_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateApiKeyRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Accounts.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">deleteApiKey</a>(apiKeyId) -> Schematic.DeleteApiKeyResponse</code></summary>
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

**apiKeyId:** `string` — api_key_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Accounts.RequestOptions`

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
    requireEnvironment: true,
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

**requestOptions:** `Accounts.RequestOptions`

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
await client.accounts.listApiRequests();
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

**requestOptions:** `Accounts.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">getApiRequest</a>(apiRequestId) -> Schematic.GetApiRequestResponse</code></summary>
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

**apiRequestId:** `string` — api_request_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Accounts.RequestOptions`

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
await client.accounts.countApiRequests();
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

**requestOptions:** `Accounts.RequestOptions`

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
await client.accounts.listEnvironments();
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

**requestOptions:** `Accounts.RequestOptions`

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
    environmentType: Schematic.CreateEnvironmentRequestBodyEnvironmentType.Development,
    name: "name",
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

**requestOptions:** `Accounts.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">getEnvironment</a>(environmentId) -> Schematic.GetEnvironmentResponse</code></summary>
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

**environmentId:** `string` — environment_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Accounts.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">updateEnvironment</a>(environmentId, { ...params }) -> Schematic.UpdateEnvironmentResponse</code></summary>
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

**environmentId:** `string` — environment_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateEnvironmentRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Accounts.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.accounts.<a href="/src/api/resources/accounts/client/Client.ts">deleteEnvironment</a>(environmentId) -> Schematic.DeleteEnvironmentResponse</code></summary>
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

**environmentId:** `string` — environment_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Accounts.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## features

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">countAudienceCompanies</a>({ ...params }) -> Schematic.CountAudienceCompaniesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.countAudienceCompanies({
    conditionGroups: [
        {
            conditions: [
                {
                    conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
                    operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
                    resourceIds: ["resource_ids"],
                },
            ],
        },
    ],
    conditions: [
        {
            conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
            operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
            resourceIds: ["resource_ids"],
        },
    ],
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

**request:** `Schematic.AudienceRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">countAudienceUsers</a>({ ...params }) -> Schematic.CountAudienceUsersResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.countAudienceUsers({
    conditionGroups: [
        {
            conditions: [
                {
                    conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
                    operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
                    resourceIds: ["resource_ids"],
                },
            ],
        },
    ],
    conditions: [
        {
            conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
            operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
            resourceIds: ["resource_ids"],
        },
    ],
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

**request:** `Schematic.AudienceRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">listAudienceCompanies</a>({ ...params }) -> Schematic.ListAudienceCompaniesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.listAudienceCompanies({
    conditionGroups: [
        {
            conditions: [
                {
                    conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
                    operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
                    resourceIds: ["resource_ids"],
                },
            ],
        },
    ],
    conditions: [
        {
            conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
            operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
            resourceIds: ["resource_ids"],
        },
    ],
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

**request:** `Schematic.AudienceRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">listAudienceUsers</a>({ ...params }) -> Schematic.ListAudienceUsersResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.listAudienceUsers({
    conditionGroups: [
        {
            conditions: [
                {
                    conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
                    operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
                    resourceIds: ["resource_ids"],
                },
            ],
        },
    ],
    conditions: [
        {
            conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
            operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
            resourceIds: ["resource_ids"],
        },
    ],
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

**request:** `Schematic.AudienceRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">listFeatures</a>({ ...params }) -> Schematic.ListFeaturesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.listFeatures();
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

**requestOptions:** `Features.RequestOptions`

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
    featureType: Schematic.CreateFeatureRequestBodyFeatureType.Boolean,
    name: "name",
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

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">getFeature</a>(featureId) -> Schematic.GetFeatureResponse</code></summary>
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

**featureId:** `string` — feature_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">updateFeature</a>(featureId, { ...params }) -> Schematic.UpdateFeatureResponse</code></summary>
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

**featureId:** `string` — feature_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateFeatureRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">deleteFeature</a>(featureId) -> Schematic.DeleteFeatureResponse</code></summary>
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

**featureId:** `string` — feature_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

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
await client.features.countFeatures();
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

**requestOptions:** `Features.RequestOptions`

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
await client.features.listFlags();
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

**requestOptions:** `Features.RequestOptions`

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
    flagType: "flag_type",
    key: "key",
    name: "name",
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

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">getFlag</a>(flagId) -> Schematic.GetFlagResponse</code></summary>
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

**flagId:** `string` — flag_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">updateFlag</a>(flagId, { ...params }) -> Schematic.UpdateFlagResponse</code></summary>
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
    flagType: "flag_type",
    key: "key",
    name: "name",
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

**flagId:** `string` — flag_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.CreateFlagRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">deleteFlag</a>(flagId) -> Schematic.DeleteFlagResponse</code></summary>
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

**flagId:** `string` — flag_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.features.<a href="/src/api/resources/features/client/Client.ts">updateFlagRules</a>(flagId, { ...params }) -> Schematic.UpdateFlagRulesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.features.updateFlagRules("flag_id", {
    rules: [
        {
            conditionGroups: [
                {
                    conditions: [
                        {
                            conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
                            operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
                            resourceIds: ["resource_ids"],
                        },
                    ],
                },
            ],
            conditions: [
                {
                    conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
                    operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
                    resourceIds: ["resource_ids"],
                },
            ],
            name: "name",
            priority: 1,
            value: true,
        },
    ],
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

**flagId:** `string` — flag_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateFlagRulesRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Features.RequestOptions`

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

**requestOptions:** `Features.RequestOptions`

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

**requestOptions:** `Features.RequestOptions`

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
await client.features.countFlags();
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

**requestOptions:** `Features.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## billing

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
        key: "value",
    },
    name: "name",
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

**requestOptions:** `Billing.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">listCustomers</a>({ ...params }) -> Schematic.ListCustomersResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.listCustomers();
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

**request:** `Schematic.ListCustomersRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Billing.RequestOptions`

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
await client.billing.countCustomers();
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

**requestOptions:** `Billing.RequestOptions`

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
    interval: "interval",
    price: 1,
    priceExternalId: "price_external_id",
    productExternalId: "product_external_id",
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

**requestOptions:** `Billing.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.billing.<a href="/src/api/resources/billing/client/Client.ts">listProductPrices</a>({ ...params }) -> Schematic.ListProductPricesResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.billing.listProductPrices();
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

**request:** `Schematic.ListProductPricesRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Billing.RequestOptions`

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
    currency: "currency",
    externalId: "external_id",
    name: "name",
    price: 1.1,
    quantity: 1,
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

**requestOptions:** `Billing.RequestOptions`

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
await client.billing.listBillingProducts();
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

**requestOptions:** `Billing.RequestOptions`

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
    customerExternalId: "customer_external_id",
    expiredAt: new Date("2024-01-15T09:30:00.000Z"),
    productExternalIds: [
        {
            price: 1,
            productExternalId: "product_external_id",
        },
    ],
    subscriptionExternalId: "subscription_external_id",
    totalPrice: 1,
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

**request:** `Schematic.CreateBillingSubscriptionsRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Billing.RequestOptions`

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
await client.companies.listCompanies();
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

**requestOptions:** `Companies.RequestOptions`

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
        key: "value",
    },
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

**requestOptions:** `Companies.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getCompany</a>(companyId) -> Schematic.GetCompanyResponse</code></summary>
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

**companyId:** `string` — company_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Companies.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">deleteCompany</a>(companyId) -> Schematic.DeleteCompanyResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.deleteCompany("company_id");
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

**companyId:** `string` — company_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Companies.RequestOptions`

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
await client.companies.countCompanies();
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

**requestOptions:** `Companies.RequestOptions`

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
        key: "value",
    },
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

**requestOptions:** `Companies.RequestOptions`

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
        key: "value",
    },
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

**requestOptions:** `Companies.RequestOptions`

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
        string: {
            key: "value",
        },
    },
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

**requestOptions:** `Companies.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getActiveDeals</a>({ ...params }) -> Schematic.GetActiveDealsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.getActiveDeals({
    companyId: "company_id",
    dealStage: "deal_stage",
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

**request:** `Schematic.GetActiveDealsRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Companies.RequestOptions`

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
await client.companies.listCompanyMemberships();
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

**requestOptions:** `Companies.RequestOptions`

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
    userId: "user_id",
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

**requestOptions:** `Companies.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">deleteCompanyMembership</a>(companyMembershipId) -> Schematic.DeleteCompanyMembershipResponse</code></summary>
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

**companyMembershipId:** `string` — company_membership_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Companies.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">listCompanyPlans</a>({ ...params }) -> Schematic.ListCompanyPlansResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.listCompanyPlans();
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

**request:** `Schematic.ListCompanyPlansRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Companies.RequestOptions`

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

**requestOptions:** `Companies.RequestOptions`

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
        key: "value",
    },
    trait: "trait",
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

**requestOptions:** `Companies.RequestOptions`

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
await client.companies.listEntityKeyDefinitions();
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

**requestOptions:** `Companies.RequestOptions`

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
await client.companies.countEntityKeyDefinitions();
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

**requestOptions:** `Companies.RequestOptions`

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
await client.companies.listEntityTraitDefinitions();
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

**requestOptions:** `Companies.RequestOptions`

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
    entityType: Schematic.CreateEntityTraitDefinitionRequestBodyEntityType.Company,
    hierarchy: ["hierarchy"],
    traitType: Schematic.CreateEntityTraitDefinitionRequestBodyTraitType.Boolean,
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

**requestOptions:** `Companies.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getEntityTraitDefinition</a>(entityTraitDefinitionId) -> Schematic.GetEntityTraitDefinitionResponse</code></summary>
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

**entityTraitDefinitionId:** `string` — entity_trait_definition_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Companies.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">updateEntityTraitDefinition</a>(entityTraitDefinitionId, { ...params }) -> Schematic.UpdateEntityTraitDefinitionResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.companies.updateEntityTraitDefinition("entity_trait_definition_id", {
    traitType: Schematic.UpdateEntityTraitDefinitionRequestBodyTraitType.Boolean,
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

**entityTraitDefinitionId:** `string` — entity_trait_definition_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateEntityTraitDefinitionRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Companies.RequestOptions`

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
await client.companies.countEntityTraitDefinitions();
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

**requestOptions:** `Companies.RequestOptions`

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

**requestOptions:** `Companies.RequestOptions`

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
        key: "value",
    },
    trait: "trait",
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

**requestOptions:** `Companies.RequestOptions`

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
await client.companies.listUsers();
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

**requestOptions:** `Companies.RequestOptions`

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
    company: {
        key: "value",
    },
    keys: {
        key: "value",
    },
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

**requestOptions:** `Companies.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">getUser</a>(userId) -> Schematic.GetUserResponse</code></summary>
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

**userId:** `string` — user_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Companies.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.companies.<a href="/src/api/resources/companies/client/Client.ts">deleteUser</a>(userId) -> Schematic.DeleteUserResponse</code></summary>
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

**userId:** `string` — user_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Companies.RequestOptions`

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
await client.companies.countUsers();
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

**requestOptions:** `Companies.RequestOptions`

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
    company: {
        key: "value",
    },
    keys: {
        key: "value",
    },
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

**requestOptions:** `Companies.RequestOptions`

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
        key: "value",
    },
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

**requestOptions:** `Companies.RequestOptions`

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
        string: {
            key: "value",
        },
    },
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

**requestOptions:** `Companies.RequestOptions`

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
await client.entitlements.listCompanyOverrides();
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

**requestOptions:** `Entitlements.RequestOptions`

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
    valueType: Schematic.CreateCompanyOverrideRequestBodyValueType.Boolean,
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

**requestOptions:** `Entitlements.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">getCompanyOverride</a>(companyOverrideId) -> Schematic.GetCompanyOverrideResponse</code></summary>
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

**companyOverrideId:** `string` — company_override_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Entitlements.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">updateCompanyOverride</a>(companyOverrideId, { ...params }) -> Schematic.UpdateCompanyOverrideResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.updateCompanyOverride("company_override_id", {
    valueType: Schematic.UpdateCompanyOverrideRequestBodyValueType.Boolean,
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

**companyOverrideId:** `string` — company_override_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateCompanyOverrideRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Entitlements.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">deleteCompanyOverride</a>(companyOverrideId) -> Schematic.DeleteCompanyOverrideResponse</code></summary>
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

**companyOverrideId:** `string` — company_override_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Entitlements.RequestOptions`

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
await client.entitlements.countCompanyOverrides();
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

**requestOptions:** `Entitlements.RequestOptions`

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

**requestOptions:** `Entitlements.RequestOptions`

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

**requestOptions:** `Entitlements.RequestOptions`

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
await client.entitlements.listFeatureUsage();
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

**requestOptions:** `Entitlements.RequestOptions`

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
await client.entitlements.countFeatureUsage();
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

**requestOptions:** `Entitlements.RequestOptions`

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

**requestOptions:** `Entitlements.RequestOptions`

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

**requestOptions:** `Entitlements.RequestOptions`

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
await client.entitlements.listPlanEntitlements();
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

**requestOptions:** `Entitlements.RequestOptions`

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
    valueType: Schematic.CreatePlanEntitlementRequestBodyValueType.Boolean,
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

**requestOptions:** `Entitlements.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">getPlanEntitlement</a>(planEntitlementId) -> Schematic.GetPlanEntitlementResponse</code></summary>
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

**planEntitlementId:** `string` — plan_entitlement_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Entitlements.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">updatePlanEntitlement</a>(planEntitlementId, { ...params }) -> Schematic.UpdatePlanEntitlementResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.entitlements.updatePlanEntitlement("plan_entitlement_id", {
    valueType: Schematic.UpdatePlanEntitlementRequestBodyValueType.Boolean,
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

**planEntitlementId:** `string` — plan_entitlement_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdatePlanEntitlementRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Entitlements.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.entitlements.<a href="/src/api/resources/entitlements/client/Client.ts">deletePlanEntitlement</a>(planEntitlementId) -> Schematic.DeletePlanEntitlementResponse</code></summary>
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

**planEntitlementId:** `string` — plan_entitlement_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Entitlements.RequestOptions`

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
await client.entitlements.countPlanEntitlements();
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

**requestOptions:** `Entitlements.RequestOptions`

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
        string: {
            key: "value",
        },
    },
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

**requestOptions:** `Entitlements.RequestOptions`

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
await client.components.listComponents();
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

**requestOptions:** `Components.RequestOptions`

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
    ast: [1],
    entityType: Schematic.CreateComponentRequestBodyEntityType.Entitlement,
    name: "name",
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

**requestOptions:** `Components.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">getComponent</a>(componentId) -> Schematic.GetComponentResponse</code></summary>
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

**componentId:** `string` — component_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Components.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">updateComponent</a>(componentId, { ...params }) -> Schematic.UpdateComponentResponse</code></summary>
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

**componentId:** `string` — component_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateComponentRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Components.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">deleteComponent</a>(componentId) -> Schematic.DeleteComponentResponse</code></summary>
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

**componentId:** `string` — component_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Components.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.components.<a href="/src/api/resources/components/client/Client.ts">hydrateComponent</a>(componentId) -> Schematic.HydrateComponentResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.components.hydrateComponent("component_id");
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

**componentId:** `string` — component_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Components.RequestOptions`

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
await client.components.countComponents();
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

**requestOptions:** `Components.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## crm

<details><summary><code>client.crm.<a href="/src/api/resources/crm/client/Client.ts">upsertDealLineItemAssociation</a>({ ...params }) -> Schematic.UpsertDealLineItemAssociationResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.crm.upsertDealLineItemAssociation({
    dealExternalId: "deal_external_id",
    lineItemExternalId: "line_item_external_id",
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

**request:** `Schematic.CreateCrmDealLineItemAssociationRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Crm.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.crm.<a href="/src/api/resources/crm/client/Client.ts">upsertLineItem</a>({ ...params }) -> Schematic.UpsertLineItemResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.crm.upsertLineItem({
    amount: "amount",
    interval: "interval",
    lineItemExternalId: "line_item_external_id",
    productExternalId: "product_external_id",
    quantity: 1,
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

**request:** `Schematic.CreateCrmLineItemRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Crm.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.crm.<a href="/src/api/resources/crm/client/Client.ts">upsertCrmDeal</a>({ ...params }) -> Schematic.UpsertCrmDealResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.crm.upsertCrmDeal({
    crmCompanyKey: "crm_company_key",
    crmType: "crm_type",
    dealExternalId: "deal_external_id",
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

**request:** `Schematic.CreateCrmDealRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Crm.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.crm.<a href="/src/api/resources/crm/client/Client.ts">listCrmProducts</a>({ ...params }) -> Schematic.ListCrmProductsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.crm.listCrmProducts();
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

**request:** `Schematic.ListCrmProductsRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Crm.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.crm.<a href="/src/api/resources/crm/client/Client.ts">upsertCrmProduct</a>({ ...params }) -> Schematic.UpsertCrmProductResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.crm.upsertCrmProduct({
    currency: "currency",
    description: "description",
    externalId: "external_id",
    interval: "interval",
    name: "name",
    price: "price",
    quantity: 1,
    sku: "sku",
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

**request:** `Schematic.CreateCrmProductRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Crm.RequestOptions`

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
    events: [
        {
            eventType: Schematic.CreateEventRequestBodyEventType.Identify,
        },
    ],
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

**requestOptions:** `Events.RequestOptions`

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
await client.events.getEventSummaries();
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

**requestOptions:** `Events.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.events.<a href="/src/api/resources/events/client/Client.ts">getEventSummaryBySubtype</a>(key) -> Schematic.GetEventSummaryBySubtypeResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.events.getEventSummaryBySubtype("key");
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

**requestOptions:** `Events.RequestOptions`

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
await client.events.listEvents();
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

**requestOptions:** `Events.RequestOptions`

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
    eventType: Schematic.CreateEventRequestBodyEventType.Identify,
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

**requestOptions:** `Events.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.events.<a href="/src/api/resources/events/client/Client.ts">getEvent</a>(eventId) -> Schematic.GetEventResponse</code></summary>
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

**eventId:** `string` — event_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Events.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.events.<a href="/src/api/resources/events/client/Client.ts">listMetricCounts</a>({ ...params }) -> Schematic.ListMetricCountsResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.events.listMetricCounts();
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

**request:** `Schematic.ListMetricCountsRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Events.RequestOptions`

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

**requestOptions:** `Events.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## plans

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">getAudience</a>(planAudienceId) -> Schematic.GetAudienceResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.getAudience("plan_audience_id");
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

**planAudienceId:** `string` — plan_audience_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Plans.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">updateAudience</a>(planAudienceId, { ...params }) -> Schematic.UpdateAudienceResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.updateAudience("plan_audience_id", {
    conditionGroups: [
        {
            conditions: [
                {
                    conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
                    operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
                    resourceIds: ["resource_ids"],
                },
            ],
        },
    ],
    conditions: [
        {
            conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
            operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
            resourceIds: ["resource_ids"],
        },
    ],
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

**planAudienceId:** `string` — plan_audience_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateAudienceRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Plans.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">deleteAudience</a>(planAudienceId) -> Schematic.DeleteAudienceResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.deleteAudience("plan_audience_id");
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

**planAudienceId:** `string` — plan_audience_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Plans.RequestOptions`

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
await client.plans.listPlans();
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

**requestOptions:** `Plans.RequestOptions`

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
    planType: Schematic.CreatePlanRequestBodyPlanType.Plan,
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

**requestOptions:** `Plans.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">getPlan</a>(planId) -> Schematic.GetPlanResponse</code></summary>
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

**planId:** `string` — plan_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Plans.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">updatePlan</a>(planId, { ...params }) -> Schematic.UpdatePlanResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.updatePlan("plan_id", {
    audienceType: "audience_type",
    name: "name",
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

**planId:** `string` — plan_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdatePlanRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Plans.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">deletePlan</a>(planId) -> Schematic.DeletePlanResponse</code></summary>
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

**planId:** `string` — plan_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Plans.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.plans.<a href="/src/api/resources/plans/client/Client.ts">upsertBillingProductPlan</a>(planId, { ...params }) -> Schematic.UpsertBillingProductPlanResponse</code></summary>
<dl>
<dd>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.plans.upsertBillingProductPlan("plan_id", {
    billingProductId: "billing_product_id",
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

**planId:** `string` — plan_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpsertBillingProductRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Plans.RequestOptions`

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
await client.plans.countPlans();
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

**requestOptions:** `Plans.RequestOptions`

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
        key: "value",
    },
    resourceType: "resource_type",
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

**requestOptions:** `Accesstokens.RequestOptions`

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
await client.webhooks.listWebhookEvents();
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

**requestOptions:** `Webhooks.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">getWebhookEvent</a>(webhookEventId) -> Schematic.GetWebhookEventResponse</code></summary>
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

**webhookEventId:** `string` — webhook_event_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Webhooks.RequestOptions`

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
await client.webhooks.countWebhookEvents();
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

**requestOptions:** `Webhooks.RequestOptions`

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
await client.webhooks.listWebhooks();
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

**requestOptions:** `Webhooks.RequestOptions`

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
    requestTypes: [Schematic.CreateWebhookRequestBodyRequestTypesItem.CompanyUpdated],
    url: "url",
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

**requestOptions:** `Webhooks.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">getWebhook</a>(webhookId) -> Schematic.GetWebhookResponse</code></summary>
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

**webhookId:** `string` — webhook_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Webhooks.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">updateWebhook</a>(webhookId, { ...params }) -> Schematic.UpdateWebhookResponse</code></summary>
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

**webhookId:** `string` — webhook_id

</dd>
</dl>

<dl>
<dd>

**request:** `Schematic.UpdateWebhookRequestBody`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Webhooks.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">deleteWebhook</a>(webhookId) -> Schematic.DeleteWebhookResponse</code></summary>
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

**webhookId:** `string` — webhook_id

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `Webhooks.RequestOptions`

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
await client.webhooks.countWebhooks();
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

**requestOptions:** `Webhooks.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>
