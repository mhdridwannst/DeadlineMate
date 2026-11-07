import type { Metadata } from "next";
import LegalPage from "@/components/shell/LegalPage";
import { getBahasa } from "@/server/demo-user";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | DeadlineMate",
  description: "Cara DeadlineMate menggunakan dan melindungi data pengguna.",
};

const UPDATED_ID = "7 November 2026";
const UPDATED_EN = "November 7, 2026";

export default async function PrivacyPage() {
  const lang = await getBahasa();
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const english = lang === "en";

  return (
    <LegalPage
      title={english ? "Privacy Policy" : "Kebijakan Privasi"}
      intro={
        english
          ? "This notice explains what DeadlineMate stores and how connected services are used when you use the app."
          : "Kebijakan ini menjelaskan data yang disimpan DeadlineMate dan layanan yang digunakan saat kamu memakai aplikasi."
      }
      backLabel={english ? "Back to sign in" : "Kembali ke halaman masuk"}
      updatedLabel={english ? "Last updated" : "Terakhir diperbarui"}
      updatedAt={english ? UPDATED_EN : UPDATED_ID}
    >
      {english ? (
        <>
          <section>
            <h2>Information stored</h2>
            <ul>
              <li>
                Account details such as name, email address, and password hash
                for password accounts.
              </li>
              <li>
                Tasks, notes, due dates, priorities, categories, subtasks, and
                productivity progress.
              </li>
              <li>
                Attachment names and public file URLs for files you upload.
              </li>
              <li>
                Push notification subscription details when you enable
                notifications.
              </li>
            </ul>
          </section>
          <section>
            <h2>How information is used</h2>
            <p>
              Data is used to provide sign-in, task planning, reminders,
              progress tracking, and account support. Text submitted to AI
              planning features may be sent to the configured AI provider to
              generate suggestions. Google is used for Google sign-in;
              PostgreSQL stores app data; Vercel Blob stores attachments; Resend
              sends password reset email; and web-push services deliver
              notifications.
            </p>
          </section>
          <section>
            <h2>Attachments and AI</h2>
            <p>
              Uploaded attachments currently use public Vercel Blob URLs. Anyone
              with a file URL may be able to access that file, so do not upload
              sensitive or confidential material. Review AI-generated plans
              before relying on them.
            </p>
          </section>
          <section>
            <h2>Retention and requests</h2>
            <p>
              Account and task data is retained in the app database and related
              services while the account is in use. There is no self-service
              account deletion flow at this time. To ask about access,
              correction, or deletion of your account data, contact the app
              operator using the configured support address.
            </p>
            <p className="mt-2">
              {email ? (
                <a className="font-bold underline" href={`mailto:${email}`}>
                  {email}
                </a>
              ) : (
                "A support email address has not been configured for this deployment."
              )}
            </p>
          </section>
          <section>
            <h2>Security and changes</h2>
            <p>
              The app uses authentication and access checks to protect account
              data. No online service can guarantee absolute security. This
              notice may be updated when app features or service providers
              change.
            </p>
          </section>
        </>
      ) : (
        <>
          <section>
            <h2>Data yang disimpan</h2>
            <ul>
              <li>
                Informasi akun seperti nama, alamat email, dan hash password
                untuk akun password.
              </li>
              <li>
                Tugas, catatan, tenggat, prioritas, kategori, sub-langkah, dan
                progres produktivitas.
              </li>
              <li>
                Nama lampiran dan URL file publik untuk file yang kamu unggah.
              </li>
              <li>
                Detail subscription push notification jika kamu mengaktifkan
                notifikasi.
              </li>
            </ul>
          </section>
          <section>
            <h2>Penggunaan data dan layanan</h2>
            <p>
              Data digunakan untuk menyediakan login, perencanaan tugas,
              pengingat, pencatatan progres, dan dukungan akun. Teks yang kamu
              kirim ke fitur perencanaan AI dapat dikirim ke penyedia AI yang
              dikonfigurasi untuk membuat saran. Google digunakan untuk login
              Google; PostgreSQL menyimpan data aplikasi; Vercel Blob menyimpan
              lampiran; Resend mengirim email reset password; dan layanan
              web-push mengirim notifikasi.
            </p>
          </section>
          <section>
            <h2>Lampiran dan AI</h2>
            <p>
              Lampiran saat ini menggunakan URL Vercel Blob yang bersifat
              publik. Siapa pun yang memiliki URL file dapat mengaksesnya, jadi
              jangan unggah materi sensitif atau rahasia. Periksa kembali
              rencana dari AI sebelum mengandalkannya.
            </p>
          </section>
          <section>
            <h2>Penyimpanan dan permintaan pengguna</h2>
            <p>
              Data akun dan tugas disimpan di database aplikasi serta layanan
              terkait selama akun digunakan. Saat ini belum tersedia fitur hapus
              akun mandiri. Untuk menanyakan akses, koreksi, atau penghapusan
              data akun, hubungi pengelola aplikasi melalui alamat dukungan yang
              dikonfigurasi.
            </p>
            <p className="mt-2">
              {email ? (
                <a className="font-bold underline" href={`mailto:${email}`}>
                  {email}
                </a>
              ) : (
                "Alamat email dukungan belum dikonfigurasi untuk deployment ini."
              )}
            </p>
          </section>
          <section>
            <h2>Keamanan dan perubahan</h2>
            <p>
              Aplikasi menggunakan autentikasi dan pemeriksaan akses untuk
              melindungi data akun. Tidak ada layanan online yang dapat menjamin
              keamanan secara mutlak. Kebijakan ini dapat diperbarui ketika
              fitur atau penyedia layanan berubah.
            </p>
          </section>
        </>
      )}
    </LegalPage>
  );
}
