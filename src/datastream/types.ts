/**
 * Datastream message types for WebSocket communication
 */
export type Action = "start" | "stop";

export enum EntityType {
  COMPANY = "rulesengine.Company",
  COMPANIES = "rulesengine.Companies",
  USER = "rulesengine.User",
  USERS = "rulesengine.Users",
  FLAG = "rulesengine.Flag",
  FLAGS = "rulesengine.Flags",
}

export enum MessageType {
  FULL = "full",
  PARTIAL = "partial",
  DELETE = "delete",
  ERROR = "error",
  UNKNOWN = "unknown",
}

/**
 * DataStreamReq represents a request message to the datastream
 */
export interface DataStreamReq {
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
  data: unknown;
  entity_type: string;
  message_type: string;
}

/**
 * DataStreamError represents an error message from the datastream
 */
export interface DataStreamError {
  error: string;
  keys?: Record<string, string>;
  entity_type?: EntityType;
}