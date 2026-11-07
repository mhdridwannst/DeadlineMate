import { Resend } from "resend";

export async function kirimEmailResetPassword(email: string, token: string) {
  // FIX: Cek API key dulu sebelum inisialisasi
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY belum di-set di environment variables.");
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "DeadlineMate <onboarding@resend.dev>");

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL belum diatur untuk production.");
  }
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL belum diatur untuk production.");
  }

  // FIX: Inisialisasi Resend di dalam fungsi (Lazy Initialization)
  // Biar halaman lain (kayak /login) gak ikut crash kalau API key bermasalah.
  const resend = new Resend(process.env.RESEND_API_KEY);

  const linkReset = `${baseUrl}/reset-password?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border:2px solid #111;border-radius:16px;box-shadow:0 6px 0 #111;overflow:hidden;">
          
          <!-- HEADER -->
          <tr>
            <td style="padding:32px 32px 16px 32px;text-align:center;">
              <div style="display:inline-block;width:64px;height:64px;background:#a8f000;border:2px solid #111;border-radius:16px;line-height:60px;font-weight:900;font-size:28px;color:#111;transform:rotate(-3deg);box-shadow:0 4px 0 #111;">D</div>
              <h1 style="margin:16px 0 4px;font-size:24px;font-weight:900;color:#111;">DeadlineMate</h1>
              <p style="margin:0;font-size:13px;color:#6b7280;font-weight:600;">Teman yang ngejar deadline bareng kamu.</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:24px 32px;">
              <div style="background:#a8f000;border:2px solid #111;border-radius:6px;padding:8px 12px;display:inline-block;font-weight:900;font-size:11px;color:#111;text-transform:uppercase;letter-spacing:1px;transform:rotate(-1deg);box-shadow:2px 2px 0 #111;">Reset Password</div>
              
              <h2 style="margin:16px 0 8px;font-size:20px;font-weight:900;color:#111;">Lupa password, ya?</h2>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;font-weight:500;">
                Tidak perlu khawatir. Klik tombol di bawah untuk membuat password baru. Tautan ini hanya berlaku <strong>1 jam</strong>.
              </p>

              <!-- CTA BUTTON -->
              <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#111;border-radius:12px;padding-bottom:4px;">
                    <a href="${linkReset}" style="display:inline-block;background:#a8f000;color:#111;font-weight:900;font-size:14px;padding:14px 28px;border:2px solid #111;border-radius:10px;text-decoration:none;">Reset Password →</a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:12px;color:#6b7280;font-weight:600;">
                Atau copy paste link ini di browser:<br/>
                <a href="${linkReset}" style="color:#2563eb;word-break:break-all;">${linkReset}</a>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 32px 32px;border-top:2px dashed #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;text-align:center;line-height:1.5;">
                Jika kamu tidak meminta reset password, abaikan email ini.<br/>
                Password kamu tetap aman.
              </p>
            </td>
          </tr>

        </table>

        <p style="margin:24px 0 0;font-size:11px;color:#9ca3af;text-align:center;font-weight:600;">
          © ${new Date().getFullYear()} DeadlineMate · Kelompok 2 UKM Software Development
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Reset password DeadlineMate kamu",
    html,
  });

  if (error) {
    throw new Error(`Gagal kirim email: ${error.message}`);
  }
}
