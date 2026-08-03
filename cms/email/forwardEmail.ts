import type { EmailAdapter, SendEmailOptions } from 'payload';

/**
 * Payload email over ForwardEmail's HTTP API.
 *
 * HTTP and not SMTP, and that is the whole reason this is hand-rolled rather
 * than `@payloadcms/email-nodemailer`: ger3 blocks outbound 25, 465 and 587, and
 * those connections *hang* rather than erroring. A password reset would sit
 * there with nothing to read in the logs until something timed it out. Port 443
 * is the way off that box.
 *
 * Auth is HTTP Basic with the API key as the username and an empty password,
 * which is what ForwardEmail documents for POST /v1/emails.
 */
const ENDPOINT = 'https://api.forwardemail.net/v1/emails';

type Addressable = SendEmailOptions['to'];

/** nodemailer's shape: a string, an {address,name}, or an array of either. */
function toAddressList(value: Addressable | SendEmailOptions['from']): string {
  if (!value) return '';
  const one = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object' && 'address' in v) {
      const { address, name } = v as { address: string; name?: string };
      return name ? `${name} <${address}>` : address;
    }
    return String(v);
  };
  return Array.isArray(value) ? value.map(one).filter(Boolean).join(', ') : one(value);
}

export const forwardEmailAdapter = ({
  apiKey,
  defaultFromAddress,
  defaultFromName,
}: {
  apiKey: string | undefined;
  defaultFromAddress: string;
  defaultFromName: string;
}): EmailAdapter<unknown> =>
  ({ payload }) => ({
    name: 'forward-email',
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message) => {
      // Loud, not silent. Payload's own fallback writes mail to the console,
      // which is how you discover months later that no reset email has ever
      // arrived. If this is misconfigured, the send fails and says so.
      if (!apiKey) {
        const err = new Error(
          'FORWARDEMAIL_API_KEY is not set, so no email can be sent. ' +
            'Password resets are the thing that breaks first.',
        );
        payload.logger.error(err.message);
        throw err;
      }

      const body = new URLSearchParams();
      body.set('from', toAddressList(message.from) || `${defaultFromName} <${defaultFromAddress}>`);
      body.set('to', toAddressList(message.to));
      body.set('subject', message.subject ?? '');
      if (typeof message.text === 'string') body.set('text', message.text);
      if (typeof message.html === 'string') body.set('html', message.html);
      const cc = toAddressList(message.cc);
      const bcc = toAddressList(message.bcc);
      if (cc) body.set('cc', cc);
      if (bcc) body.set('bcc', bcc);

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          // API key as the username, empty password.
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        const err = new Error(
          `ForwardEmail rejected the send: ${res.status} ${res.statusText} ${detail.slice(0, 300)}`,
        );
        payload.logger.error(err.message);
        throw err;
      }

      // Log the origin of any link in the body, never the path -- a reset token
      // in a log file is a live credential. This is here because the failure it
      // catches is silent: a misconfigured serverURL sends perfectly good mail
      // containing `/admin/reset/<token>` with no host, which is not a link, and
      // nothing upstream treats that as an error.
      const link = (message.html ?? '').toString().match(/href="([^"]+)"/)?.[1];
      const origin = link ? link.replace(/^(https?:\/\/[^/]+).*/, '$1') || '(no host)' : '';
      payload.logger.info(
        `email sent to ${body.get('to')}: ${body.get('subject')}` +
          (link ? ` [link origin: ${origin}]` : ''),
      );
      return res.json().catch(() => ({}));
    },
  });
