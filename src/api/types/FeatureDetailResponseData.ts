/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface FeatureDetailResponseData {
    createdAt: Date;
    description: string;
    eventSubtype?: string;
    eventSummary?: Schematic.EventSummaryResponseData;
    featureType: string;
    flags: Schematic.FlagDetailResponseData[];
    icon: string;
    id: string;
    lifecyclePhase?: string;
    maintainerId?: string;
    name: string;
    plans: Schematic.PreviewObject[];
    pluralName?: string;
    singularName?: string;
    trait?: Schematic.EntityTraitDefinitionResponseData;
    traitId?: string;
    updatedAt: Date;
}
