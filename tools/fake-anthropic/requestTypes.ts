export interface CacheControl {
  type: string;
  ttl?: string;
}

export interface ContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  signature?: string;
  cache_control?: CacheControl;
}

export interface RequestMessage {
  role: string;
  content?: string | ContentBlock[];
  output_config?: { effort?: string };
}

export interface MessagesRequest {
  model?: string;
  system?: string | ContentBlock[];
  messages?: RequestMessage[];
  cache_control?: CacheControl;
  output_config?: { effort?: string };
  thinking?: { type?: string; display?: string };
  tools?: unknown[];
}

export interface Usage {
  input_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cache_creation: { ephemeral_5m_input_tokens: number; ephemeral_1h_input_tokens: number };
}
