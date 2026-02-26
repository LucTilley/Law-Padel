declare module "@deepgram/sdk" {
  export const SOCKET_STATES: Record<string, number>;
  export type SOCKET_STATES = number;
  export const LiveTranscriptionEvents: Record<string, string>;
  export type LiveSchema = unknown;
  export type LiveTranscriptionEvent = unknown;
  export function createClient(apiKey: string): {
    listen: {
      live: {
        transcribe: (schema: LiveSchema) => LiveClient;
      };
    };
  };
  export interface LiveClient {
    on(event: string, cb: (data: LiveTranscriptionEvent) => void): void;
    start(): void;
    finish(): void;
    send(data: string | ArrayBuffer): void;
  }
}
