/**
 * Datastream message types for WebSocket communication
 */
export type Action = "start" | "stop";

export enum EntityType {
  Company = "rulesengine.Company",
  Companies = "rulesengine.Companies",
  Flag = "rulesengine.Flag",
  Flags = "rulesengine.Flags",
  User = "rulesengine.User",
  Users = "rulesengine.Users",
}

export enum MessageType {
  Full = "full",
  Partial = "partial",
  Delete = "delete",
  Error = "error",
  Unknown = "unknown",
}

/**
 * DataStreamReq represents a request message to the datastream
 */
export interface DataStreamReq {
  action: Action;
  entity_type: EntityType;
  keys?: Record<string, string>;
}

/**
 * DataStreamBaseReq wraps the request data
 */
export interface DataStreamBaseReq {
  data: DataStreamReq;
}

/**
 * DataStreamResp represents a response message from the datastream
 */
export interface DataStreamResp {
  data: any; // JSON raw message equivalent
  entity_id?: string;
  entity_type: string;
  message_type: MessageType;
}

/**
 * DataStreamError represents an error message from the datastream
 */
export interface DataStreamError {
  error: string;
  keys?: Record<string, string>;
  entity_type?: EntityType;
}