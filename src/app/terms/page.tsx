import type { Metadata } from "next";
import LegalPage from "@/components/shell/LegalPage";
import { getBahasa } from "@/server/demo-user";

export const metadata: Metadata = {
  title: "Ketentuan Layanan | DeadlineMate",
  description: "Ketentuan penggunaan DeadlineMate.",
};

const UPDATED_ID = "7 November 2026";
const UPDATED_EN = "November 7, 2026";

export default async function TermsPage() {
  const lang = await getBahasa();
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const english = lang === "en";

  return (
    <LegalPage
      title={english ? "Terms of Service" : "Ketentuan Layanan"}
      intro={
        english
          ? "By using DeadlineMate, you agree to use the service responsibly and keep control of your own deadlines and decisions."
          : "Dengan menggunakan DeadlineMate, kamu setuju memakai layanan secara bertanggung jawab dan tetap mengelola tenggat serta keputusanmu sendiri."
      }
      backLabel={english ? "Back to sign in" : "Kembali ke halaman masuk"}
      updatedLabel={english ? "Last updated" : "Terakhir diperbarui"}
      updatedAt={english ? UPDATED_EN : UPDATED_ID}
    >
      {english ? (
        <>
          <section>
            <h2>Using the service</h2>
            <p>
              Keep your account credentials private and provide accurate account
              information. You are responsible for activity performed through
              your account and for maintaining copies of important information.
            </p>
          </section>
          <section>
            <h2>Tasks and AI suggestions</h2>
            <p>
              DeadlineMate helps organize tasks and generate planning
              suggestions. AI output may be incomplete or incorrect and is not a
              guarantee that a task will be completed or a deadline met. Check
              dates, estimates, and suggestions before acting on them.
            </p>
          </section>
          <section>
            <h2>Files and notifications</h2>
            <p>
              Uploaded files currently use public URLs. Do not upload content
              that you do not have permission to share or that should remain
              confidential. Push notifications depend on your device, browser,
              network, and notification settings and are not guaranteed to
              arrive immediately.
            </p>
          </section>
          <section>
            <h2>Availability and changes</h2>
            <p>
              Features and availability may change as the app is maintained. The
              service is provided as a productivity aid and should not be the
              only place you keep critical deadlines or records.
            </p>
          </section>
          <section>
            <h2>Contact</h2>
            <p>
              {email ? (
                <a className="font-bold underline" href={`mailto:${email}`}>
                  {email}
                </a>
              ) : (
                "A support email address has not been configured for this deployment."
              )}
            </p>
          </section>
        </>
      ) : (
        <>
          <section>
            <h2>Penggunaan layanan</h2>
            <p>
              Jaga kerahasiaan kredensial akun dan berikan informasi akun yang
              benar. Kamu bertanggung jawab atas aktivitas di akunmu dan
              menyimpan salinan informasi penting.
            </p>
          </section>
          <section>
            <h2>Tugas dan saran AI</h2>
            <p>
              DeadlineMate membantu mengatur tugas dan membuat saran
              perencanaan. Hasil AI dapat tidak lengkap atau keliru dan bukan
              jaminan tugas akan selesai atau tenggat akan terpenuhi. Periksa
              tanggal, estimasi, dan saran sebelum menggunakannya.
            </p>
          </section>
          <section>
            <h2>File dan notifikasi</h2>
            <p>
              File yang diunggah saat ini menggunakan URL publik. Jangan unggah
              konten yang tidak berhak kamu bagikan atau yang seharusnya
              dirahasiakan. Push notification bergantung pada perangkat,
              browser, jaringan, dan pengaturan notifikasi; pengiriman segera
              tidak dijamin.
            </p>
          </section>
          <section>
            <h2>Ketersediaan dan perubahan</h2>
            <p>
              Fitur dan ketersediaan dapat berubah seiring pemeliharaan
              aplikasi. Layanan ini adalah alat bantu produktivitas; jangan
              jadikan satu-satunya tempat menyimpan tenggat atau catatan
              penting.
            </p>
          </section>
          <section>
            <h2>Kontak</h2>
            <p>
              {email ? (
                <a className="font-bold underline" href={`mailto:${email}`}>
                  {email}
                </a>
              ) : (
                "Alamat email dukungan belum dikonfigurasi untuk deployment ini."
              )}
            </p>
          </section>
        </>
      )}
    </LegalPage>
  );
}
