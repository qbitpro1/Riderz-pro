import "server-only";

/** Provider HTTP response outcome. `id` is the provider-assigned message/request ID when available. */
export type ProviderAnswer = {
  ok: boolean;
  status: number;
  id: string | null;
};

export type SmsMessageType = "otp" | "transactional";

/** Modular SMS provider interface to allow swapping or mocking SMS providers. */
export interface SmsProvider {
  readonly name: "msg91" | "twilio";
  isReady(forMessage?: { templateId?: string; isOtp?: boolean }): boolean;
  sendOtp(opts: { templateId: string; mobile: string; otp: string; expiryMinutes: number }): Promise<ProviderAnswer>;
  sendTransactional(opts: { mobile: string; templateId?: string; vars?: string[]; text: string; tag?: string }): Promise<ProviderAnswer>;
}

/** Modular Email provider interface. */
export interface EmailProvider {
  readonly name: "resend";
  isReady(from: string): boolean;
  sendEmail(opts: { from: string; to: string; subject: string; text: string; html?: string; replyTo?: string }): Promise<ProviderAnswer>;
}

