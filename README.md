# DeadlineMate

Teman yang ngejar deadline bareng kamu.

DeadlineMate adalah aplikasi web untuk mahasiswa dan pelajar yang sering menunda. Masalah utamanya jarang soal lupa tugas. Yang bikin telat biasanya menunda, salah memperkirakan waktu, dan semangat yang hilang di tengah jalan. Karena itu DeadlineMate tidak berhenti di daftar tugas: ada Mate, partner AI yang memecah tugas besar jadi langkah kecil dengan tenggatnya sendiri, lalu menemani kamu lewat streak, level, dan peringatan deadline.

Proyek ini dibuat untuk Final Project UKM Software Development, tema _Smart Student Productivity_.

## Cara kerjanya

Kamu cukup menulis bebas, misalnya:

> laporan kimia Jumat, makalah sosiologi Senin depan jam 12

Mate memisahkan kalimat itu menjadi dua tugas, memecah masing-masing menjadi langkah yang tidak lebih dari 90 menit, lalu memberi tenggat internal untuk tiap langkah. Dengan begitu pengerjaan tersebar dari awal dan tidak menumpuk di malam sebelum deadline.

AI di sini punya fungsi yang jelas dalam alur aplikasi, bukan fitur tempelan:

- **Smart Scheduler** mengubah teks bebas menjadi tugas terstruktur: judul, kategori, prioritas, estimasi, tenggat, dan daftar langkah. Keluarannya divalidasi dengan skema Zod sebelum disimpan ke database.
- **Catatan Mate** adalah komentar pendek yang menyesuaikan dengan tugas yang sedang dikerjakan.
- Penyedia dan model AI dipilih lewat variabel lingkungan, jadi bisa diganti tanpa mengubah kode.

## Fitur

- Daftar tugas yang diurutkan berdasarkan prioritas, lengkap dengan kategori, estimasi, dan sisa waktu
- Tambah tugas manual (nama, tanggal, jam, kategori, estimasi), dengan input suara bila browser mendukung Web Speech API
- Edit dan hapus tugas, serta centang langkah satu per satu
- Streak, level, dan EXP, beserta peringatan "streak terancam" saat deadline mendekat
- Halaman Progress dengan grafik tugas selesai 7 hari terakhir
- Kalender deadline per bulan
- Tema terang, gelap, atau mengikuti sistem
- Tampilan mobile dengan navigasi bawah, dan sidebar di desktop
- Mode demo untuk memperagakan alur streak tanpa menunggu berhari-hari

## Aturan streak dan EXP

- Streak bertambah satu setiap tugas selesai sebelum tenggatnya.
- Streak kembali ke nol kalau tenggat terlewat sebelum tugas selesai, atau tugas diselesaikan terlambat.
- Setiap tugas atau langkah yang selesai bernilai 10 EXP. Setiap 100 EXP naik satu level.
- Semua nilai ini dihitung dari data tugas yang ada, tidak disimpan sebagai angka terpisah.
- Tanggal dan jam dihitung dalam WIB (Asia/Jakarta).

## Teknologi

- Next.js (App Router) dan TypeScript
- Tailwind CSS v4
- Prisma 7 dengan PostgreSQL (kami memakai Neon)
- Vercel AI SDK, dengan penyedia Google Gemini atau Groq
- Zod untuk validasi input dan keluaran AI

## Menjalankan di lokal

Dibutuhkan Node.js (dikembangkan dengan v24), sebuah database PostgreSQL, dan API key dari salah satu penyedia AI (Google AI Studio atau Groq).

```powershell
git clone https://github.com/mhdridwannst/DeadlineMate.git
cd DeadlineMate
npm install
Copy-Item .env.example .env
```

Isi `.env` (penjelasannya di tabel bawah), lalu siapkan database dan jalankan aplikasinya:

```powershell
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Aplikasi berjalan di http://localhost:3000.

Versi Prisma dikunci di 7.x. Jangan memperbaruinya dengan `npm i prisma@latest` tanpa memeriksa versinya dulu, karena tag `latest` sudah mengarah ke generasi berikutnya yang cara kerjanya berbeda.

### Variabel lingkungan

| Variabel                       | Keterangan                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | Connection string PostgreSQL. Pakai koneksi langsung, bukan pooled.                                               |
| `AI_PROVIDER`                  | `google` atau `groq`.                                                                                             |
| `AI_MODEL`                     | Nama model persis seperti tertulis di dashboard penyedia. Nama model sering berganti, jadi tidak ditulis di kode. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Dipakai kalau `AI_PROVIDER=google`.                                                                               |
| `GROQ_API_KEY`                 | Dipakai kalau `AI_PROVIDER=groq`.                                                                                 |
| `DEMO_MODE`                    | Isi `1` untuk menampilkan panel Mode demo di production. Saat development panel selalu tampil.                    |

## Mode demo

Panel di pojok kanan bawah punya tiga tombol:

- **Isi data contoh** mengganti isi database dengan riwayat dan tugas contoh, lengkap dengan streak.
- **Majukan waktu 1 hari** menggeser semua tanggal mundur sehari, seolah waktu berjalan maju.
- **Lewati deadline #1** membuat tugas dengan deadline terdekat jadi terlambat, sehingga modal streak putus muncul.

Tombol-tombol ini mengubah data di database, jadi jangan diaktifkan pada data yang sungguhan.

## Struktur folder

```
prisma/                  skema dan migrasi database
src/app/(app)/           halaman today, progress, kalender, profil
src/components/shell/    sidebar, header, navigasi bawah, tema
src/components/tugas/    daftar tugas, form, kalender, kartu statistik
src/server/              server actions: tugas, Smart Scheduler, mode demo
src/lib/                 koneksi database, waktu WIB, statistik, pemilih model AI
```

## Status dan rencana

Saat ini semua data masuk ke satu pengguna demo karena belum ada autentikasi. Yang direncanakan berikutnya:

- Login dengan Google dan data per pengguna
- Mode fokus (Pomodoro) yang terhubung ke tugas
- Rapor mingguan
- Unggah silabus atau materi untuk dibuat rencana belajar
- PWA dan notifikasi deadline
- Integrasi Google Calendar

##  Tim

Dikembangkan oleh **Kelompok 2** dari UKM Software Development 2026:

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/mhdridwannst">
        <img src="https://github.com/mhdridwannst.png" width="100" style="border-radius:50%" alt="Mhd. Ridwan"/><br />
        <sub><b>Mhd. Ridwan</b></sub>
      </a><br />
      Hacker
    </td>
    <td align="center">
      <a href="https://github.com/username2">
        <img src="https://github.com/username2.png" width="100" style="border-radius:50%" alt="Muhammad Slamet Ridho"/><br />
        <sub><b>Muhammad Slamet Ridho</b></sub>
      </a><br />
      Hipster
    </td>
    <td align="center">
      <a href="https://github.com/username3">
        <img src="https://github.com/username3.png" width="100" style="border-radius:50%" alt="Hervina Alivia Fitri"/><br />
        <sub><b>Hervina Alivia Fitri</b></sub>
      </a><br />
      Hustler
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://github.com/username7">
        <img src="https://github.com/username7.png" width="100" style="border-radius:50%" alt="M Zaki Edi"/><br />
        <sub><b>M Zaki Edi</b></sub>
      </a><br />
      Hacker
    </td>
    <td align="center">
      <a href="https://github.com/username5">
        <img src="https://github.com/username5.png" width="100" style="border-radius:50%" alt="Fahry Ibrahim"/><br />
        <sub><b>Fahry Ibrahim</b></sub>
      </a><br />
      Hipster
    </td>
    <td align="center">
      <a href="https://github.com/username6">
        <img src="https://github.com/username6.png" width="100" style="border-radius:50%" alt="Hamzah Asadullah"/><br />
        <sub><b>Hamzah Asadullah</b></sub>
      </a><br />
      Hustler
    </td>
  </tr>
</table>
