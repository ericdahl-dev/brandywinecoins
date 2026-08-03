/**
 * The password reset email.
 *
 * Payload's default is three translated strings concatenated with no markup, so
 * every mail client renders it as one run-on line with a bare URL in the middle.
 * This is the same content, set as an email.
 *
 * Deliberately plain HTML: inline styles, no external CSS, no images, no dark
 * background. Email clients strip stylesheets, and a reset mail that renders as
 * unstyled text is fine -- one that renders as a black rectangle is not. The
 * link is repeated as text underneath the button because plenty of clients will
 * not render the button at all.
 */
const SERVER_URL = () => process.env.PAYLOAD_SERVER_URL || 'http://localhost:3000';

export const resetPasswordSubject = () => 'Reset your Brandywine Coins password';

export const resetPasswordHTML = ({ token }: { token: string }): string => {
  const url = `${SERVER_URL()}/admin/reset/${token}`;
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f6f4;font-family:Georgia,'Times New Roman',serif;color:#22262b;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e4e2dd;border-radius:8px;padding:32px;">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a6a3c;">
        Brandywine Coins
      </p>
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:normal;">Reset your password</h1>

      <p style="margin:0 0 18px;font-size:16px;line-height:1.55;">
        Someone asked to reset the password for this account. Use the button
        below to choose a new one.
      </p>

      <p style="margin:0 0 22px;">
        <a href="${url}"
           style="display:inline-block;padding:12px 22px;background:#8a6a3c;color:#ffffff;
                  text-decoration:none;border-radius:6px;font-size:16px;">
          Choose a new password
        </a>
      </p>

      <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:#5c6067;">
        Or paste this into your browser:<br />
        <a href="${url}" style="color:#8a6a3c;word-break:break-all;">${url}</a>
      </p>

      <p style="margin:0;padding-top:18px;border-top:1px solid #ebe9e4;font-size:14px;line-height:1.5;color:#5c6067;">
        If you did not ask for this, you can ignore this email and your password
        will stay as it is.
      </p>
    </div>
  </body>
</html>`;
};
