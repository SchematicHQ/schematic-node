/* tslint:disable */
/* eslint-disable */
export class RulesEngineJS {
  free(): void;
  [Symbol.dispose](): void;
  checkFlag(flag_json: string, company_json?: string | null, user_json?: string | null): string;
  evaluateRule(rule_json: string, company_json?: string | null, user_json?: string | null): boolean;
  getVersionKey(): string;
  constructor();
}
