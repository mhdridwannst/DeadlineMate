export type Lang = "id" | "en";

/**
 * Kamus teks DeadlineMate.
 *
 * - `id` adalah sumber kebenaran. Semua key didefinisikan di sini.
 * - `en` bertipe Record<KunciTeks, string>, jadi TypeScript akan error
 *   kalau ada key yang kurang atau kelebihan di bahasa Inggris.
 * - Teks dengan angka/nama memakai placeholder {n}, {a}, {b}, dst.
 *   Pakai helper t(lang, "kunci", { n: 3 }).
 */
const id = {
  // ── Navigasi ─────────────────────────────────────────────
  navHome: "Beranda",
  navProgress: "Progres",
  navCalendar: "Kalender",
  navProfile: "Profil",
  newTask: "Tugas baru",

  // ── Sapaan & statistik ───────────────────────────────────
  welcome: "Selamat datang",
  hi: "Hai",
  streak: "Streak",
  activeStreak: "Streak Aktif",
  daysInRow: "tugas tepat waktu beruntun",
  bestRecord: "Rekor",
  levelLabel: "Level",
  levelExp: "Level & XP",
  todayTarget: "Target Hari Ini",
  done: "selesai",

  // ── Beranda ──────────────────────────────────────────────
  taskList: "Daftar Tugas",
  taskCount: "Tugas",
  searchTasks: "Cari tugas...",
  clearDateFilter: "Hapus filter tanggal",
  clearSearch: "Hapus pencarian",
  deadlineApproaching: "Tenggat Mendekat",
  noMatchingTasks: "Tidak ada tugas yang cocok",
  changeFilters: "Coba ubah kata kunci atau pilih tanggal lain di kalender.",
  todayMarker: "Hari ini",
  priority: "Prioritas",
  habitSoon: "Segera",
  completedTasks: "Sudah selesai",
  mateNote: "Catatan Mate",
  nearestDeadline: "Deadline Terdekat",
  noneYet: "Belum ada",
  consistency7d: "Konsistensi 7 Hari",

  // Kondisi kosong: user belum punya tugas sama sekali
  emptyTitle: "Belum ada tugas",
  emptyDesc:
    "Tempel daftar tugasmu dan Mate yang susun jadi langkah-langkah kecil.",
  emptyCta: "Tambah tugas pertama",

  // Kondisi selesai: user punya tugas dan semuanya tuntas
  allDoneTitle: "Semua tugas aktif sudah tuntas",
  allDoneDesc:
    "Ketuk tombol + untuk menambah tugas berikutnya, atau cek riwayat di bawah.",

  // ── Urgensi tenggat ──────────────────────────────────────
  dueToday: "Hari ini",
  dueTonight: "Malam ini",
  dueTomorrow: "Besok",
  dueInDays: "{n} hari lagi",
  overdue: "Terlambat",
  busyDayWarning: "{day} ada {n} deadline. Mau dicicil dari sekarang?",

  // ── Progres ──────────────────────────────────────────────
  progressTitle: "Progres Belajarmu",
  progressSub:
    "Pantau grafik ketuntasan mingguan, XP, dan evaluasi produktivitasmu.",
  towardsLevel: "Menuju Level",
  weeklyChart: "Ketuntasan 7 Hari Terakhir",
  totalDone: "Selesai",
  weeklyReport: "Evaluasi Mingguan Mate",
  categoryDist: "Distribusi Kategori",
  gradeNone: "Belum ada nilai",
  gradeNoneDesc: "Selesaikan 1 tugas untuk mulai dinilai.",
  weeklyTotalTasks: "Total: {count} Tugas",
  weeklyChartAccessibleLabel: "Jumlah tugas selesai per hari: {values}",
  onTimeRateTitle: "Tingkat Ketepatan Waktu",
  onTimeRateDescription:
    "{onTime} dari {total} tugas bertenggat selesai tepat waktu.",
  onTimeRatePositive: "Bagus, kamu berhasil menyelesaikan tugas tepat waktu.",
  onTimeRateImprove:
    "Mulai kerjakan tugas lebih awal agar ketepatan waktumu meningkat.",
  onTimeRateNoDataTitle: "Belum ada data ketepatan waktu",
  onTimeRateNoDataDescription:
    "Selesaikan tugas yang memiliki tenggat untuk melihat ringkasan ini.",

  // ── Kalender ────────────────────────────────────────────
  calendarTitle: "Kalender tugas",
  calendarDescription: "Lihat dan pilih tanggal tenggat tugasmu.",
  calendarRegion: "Kalender",
  previousMonth: "Bulan sebelumnya",
  nextMonth: "Bulan berikutnya",
  calendarHasDeadline: "Ada tenggat",
  calendarTasksForDate: "Tugas {date} {month}",
  calendarEmpty: "Tidak ada tugas pada tanggal ini.",

  // ── Profil & pengaturan ──────────────────────────────────
  profileTitle: "Profil & Pengaturan",
  profileSub: "Kelola akun, bahasa, pengingat deadline, dan karakter Mate.",
  accountSection: "Akun & Penyimpanan Cloud",
  synced: "Tersinkron",
  localSession: "Sesi Lokal",
  permanentEmail: "Email (Permanen)",
  saveProfile: "Simpan Profil",
  productivityStats: "Statistik Produktivitas",
  streakRecordTasks: "Rekor Tugas Beruntun",
  totalTasks: "Total Selesai",
  totalExpEarned: "Total EXP Terkumpul",
  logoutSection: "Logout",
  logoutWarning: "Sesimu akan berakhir. Pastikan semua tugas sudah tersimpan.",
  logoutFromAccount: "Keluar dari Akun",
  logoutConfirmTitle: "Yakin mau keluar?",
  logoutConfirmDescription: "Pastikan semua tugasmu sudah tersimpan.",
  confirmLogout: "Ya, Keluar",
  accountDesc:
    "Masuk dengan email agar daftar tugas, streak, dan XP tersimpan permanen di akunmu.",
  cloudSynced: "Tersinkron",
  nickname: "Nama Panggilan",
  email: "Email",
  switchAccount: "Simpan / Ganti Akun",
  logoutDemo: "Kembali ke Akun Demo",
  languageLabel: "Bahasa",
  langIndonesian: "Bahasa Indonesia",
  langEnglish: "English",
  notifTitle: "Pengingat Deadline (H-1 & Mendesak)",
  notifDesc:
    "Kirim pengingat ke perangkat saat tugas mendekati H-1 (24 jam) atau kurang dari 3 jam.",
  enableNotif: "Aktifkan Notifikasi Perangkat",
  testNotif: "Tes Kirim Notifikasi",
  notifActive: "Notifikasi Aktif",
  coachTitle: "Karakter Mate",
  coachSub:
    "Pilih gaya bicara Mate saat menyusun jadwal dan mengevaluasi tugasmu.",
  savePrefs: "Simpan Preferensi",
  themeTitle: "Tema Tampilan",
  themeSub: "Pilih tampilan terang, gelap, atau ikuti pengaturan perangkat.",
  themeLight: "Terang",
  themeDark: "Gelap",
  themeSystem: "Sistem",
  soundTitle: "Efek Suara",
  soundDesc: "Bunyi kecil saat menyelesaikan tugas dan menyusun jadwal.",
  soundOn: "Suara nyala",
  soundOff: "Suara mati",

  // ── Pencapaian ───────────────────────────────────────────
  badgesTitle: "Pencapaian Akademik",
  unlocked: "Terbuka",
  badgeFirstStepTitle: "Langkah Pertama",
  badgeFirstStepDesc: "Selesaikan minimal 1 tugas",
  badgeConsistentTitle: "Pejuang Konsisten",
  badgeConsistentDesc:
    "Selesaikan 3 tugas bertenggat tepat waktu secara beruntun",
  badgeAntiSksTitle: "Anti-SKS Club",
  badgeAntiSksDesc: "Capai Level 2 dengan mengumpulkan 100 XP",
  badgeProgress: "{a}/{b}",

  // ── Mode demo ────────────────────────────────────────────
  demoMode: "Simulasi Demo",
  advance1Day: "+1 Hari",
  skipDeadline: "Lewatkan #1",

  // ── Modal tugas baru ─────────────────────────────────────
  singleTaskTab: "Satu Tugas",
  multiTaskTab: "Banyak Tugas",

  // ── Form satu tugas ──────────────────────────────────────
  aiFillTitle: "Ketik atau ucapkan tugasmu",
  aiFillBadge: "Isi cepat",
  aiFillPlaceholder: "mis. Belajar Kalkulus besok jam 19.",
  aiFillButton: "Isi otomatis dengan AI",
  taskName: "Nama Tugas",
  taskNamePlaceholder: "Misal: Belajar & Latihan Soal Kalkulus",
  taskDeadline: "Tanggal deadline",
  required: "wajib",
  today: "Hari ini",
  tomorrow: "Besok",
  nextWeek: "Minggu depan",
  taskDetails: "Atur detail",
  taskTime: "Jam",
  taskCategory: "Kategori",
  taskEstimate: "Estimasi (jam)",
  taskPriority: "Prioritas",
  catStudy: "Kuliah",
  catOrg: "Organisasi",
  catPersonal: "Pribadi",
  priorityLow: "Rendah",
  priorityMid: "Sedang",
  priorityHigh: "Tinggi",
  cancel: "Batal",
  saveTask: "Simpan tugas",

  // ── Form banyak tugas ────────────────────────────────────
  batchTitle: "Susun Banyak Tugas Sekaligus",
  batchBadge: "Mate AI",
  batchDesc:
    "Satu baris satu tugas. Tulis tenggatnya di baris yang sama, Mate yang pecah jadi langkah kecil.",
  batchPlaceholder:
    "Laporan praktikum kimia, kumpul Jumat jam 16.00\nMakalah sosiologi Senin depan jam 12.00\nKuis kalkulus Rabu malam",
  batchSubmit: "Susun {n} tugas",
  batchSubmitEmpty: "Susun tugas",
  batchPending: "Mate sedang menyusun...",
  batchLabel: "Daftar tugas",

  // ── Status umum ──────────────────────────────────────────
  loading: "Memuat...",
  retry: "Coba lagi",
  offline: "Kamu sedang offline. Perubahan disimpan setelah tersambung lagi.",
  errorGeneric: "Terjadi kesalahan. Coba lagi sebentar lagi.",
  errorAi: "Mate belum bisa dihubungi. Periksa koneksimu lalu coba lagi.",
  close: "Tutup",
  toggleTheme: "Ganti tema",
  notifications: "Notifikasi",
  notificationLoading: "Memuat status notifikasi...",
  notificationUnsupported: "Notifikasi tidak didukung",
  notificationUnsupportedDescription:
    "Browser ini tidak mendukung push notification. Coba gunakan Chrome, Edge, atau Firefox versi terbaru.",
  notificationPermissionDenied: "Izin notifikasi ditolak",
  notificationPermissionDeniedDescription:
    "Ubah izin notifikasi untuk situs ini melalui pengaturan browser.",
  enableDeadlineReminders: "Aktifkan Pengingat Tenggat",
  notificationsActive: "Notifikasi Aktif",
  notificationsActiveDescription:
    "Pengingat dijadwalkan H-1, 3 jam sebelum tenggat, dan setelah tenggat terlewat. {count} perangkat terdaftar.",
  notificationsInactiveDescription:
    "Notifikasi mungkin tetap diterima saat browser ditutup jika browser, perangkat, dan pengaturannya mendukung.",
  notificationPermissionDeniedInfo:
    "Izin notifikasi ditolak. Ubah izin situs ini di pengaturan browser.",
  notificationSubscribeFailed: "Notifikasi gagal diaktifkan. Coba lagi.",
  notificationDisableSuccess: "Notifikasi dimatikan.",
  notificationDisableFailed: "Notifikasi gagal dimatikan. Coba lagi.",
  notificationTestSuccess:
    "Tes terkirim. Berhasil: {success}, gagal: {failed}. Periksa notifikasi perangkatmu.",
  notificationTestFailed: "Tes notifikasi gagal dikirim.",
  notificationEnableButton: "Aktifkan Notifikasi",
  notificationTestButton: "Kirim Tes Notifikasi",
  notificationDisableButton: "Matikan",
  notificationWorking: "Memproses...",
  notificationSendingTest: "Mengirim...",
};

export type KunciTeks = keyof typeof id;

const en: Record<KunciTeks, string> = {
  // ── Navigation ───────────────────────────────────────────
  navHome: "Home",
  navProgress: "Progress",
  navCalendar: "Calendar",
  navProfile: "Profile",
  newTask: "New task",

  // ── Greeting & stats ─────────────────────────────────────
  welcome: "Welcome back",
  hi: "Hi",
  streak: "Streak",
  activeStreak: "Active Streak",
  daysInRow: "on-time tasks in a row",
  bestRecord: "Best",
  levelLabel: "Level",
  levelExp: "Level & XP",
  todayTarget: "Today's Goal",
  done: "done",

  // ── Home ─────────────────────────────────────────────────
  taskList: "Task List",
  taskCount: "Tasks",
  searchTasks: "Search tasks...",
  clearDateFilter: "Clear date filter",
  clearSearch: "Clear search",
  deadlineApproaching: "Deadline approaching",
  noMatchingTasks: "No matching tasks",
  changeFilters: "Try another search term or select a different date.",
  todayMarker: "Today",
  priority: "Priority",
  habitSoon: "Soon",
  completedTasks: "Completed",
  mateNote: "Mate's Note",
  nearestDeadline: "Nearest Deadline",
  noneYet: "None yet",
  consistency7d: "7-Day Consistency",

  emptyTitle: "No tasks yet",
  emptyDesc:
    "Paste your task list and Mate will break it into small, doable steps.",
  emptyCta: "Add your first task",

  allDoneTitle: "All active tasks completed",
  allDoneDesc:
    "Tap the + button to add your next task, or review completed items below.",

  // ── Deadline urgency ─────────────────────────────────────
  dueToday: "Today",
  dueTonight: "Tonight",
  dueTomorrow: "Tomorrow",
  dueInDays: "{n} days left",
  overdue: "Overdue",
  busyDayWarning: "{day} has {n} deadlines. Want to start chipping away now?",

  // ── Progress ─────────────────────────────────────────────
  progressTitle: "Your Progress",
  progressSub:
    "Track your weekly completion, XP growth, and productivity review.",
  towardsLevel: "Towards Level",
  weeklyChart: "Last 7 Days Completion",
  totalDone: "Completed",
  weeklyReport: "Mate's Weekly Review",
  categoryDist: "Category Breakdown",
  gradeNone: "No grade yet",
  gradeNoneDesc: "Complete 1 task to get your first grade.",
  weeklyTotalTasks: "Total: {count} tasks",
  weeklyChartAccessibleLabel: "Tasks completed per day: {values}",
  onTimeRateTitle: "On-time completion rate",
  onTimeRateDescription:
    "{onTime} of {total} tasks with deadlines were completed on time.",
  onTimeRatePositive: "Great work completing your tasks on time.",
  onTimeRateImprove:
    "Start tasks earlier to improve your on-time completion rate.",
  onTimeRateNoDataTitle: "No on-time data yet",
  onTimeRateNoDataDescription:
    "Complete a task with a deadline to see this summary.",

  // ── Calendar ────────────────────────────────────────────
  calendarTitle: "Task calendar",
  calendarDescription: "View and select task deadline dates.",
  calendarRegion: "Calendar",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  calendarHasDeadline: "Has a deadline",
  calendarTasksForDate: "Tasks for {date} {month}",
  calendarEmpty: "No tasks on this date.",

  // ── Profile & settings ───────────────────────────────────
  profileTitle: "Profile & Settings",
  profileSub:
    "Manage your account, language, deadline reminders, and Mate's personality.",
  accountSection: "Cloud Account & Sync",
  synced: "Synced",
  localSession: "Local session",
  permanentEmail: "Email (permanent)",
  saveProfile: "Save profile",
  productivityStats: "Productivity statistics",
  streakRecordTasks: "Best task streak",
  totalTasks: "Tasks completed",
  totalExpEarned: "Total EXP earned",
  logoutSection: "Sign out",
  logoutWarning: "Your session will end. Make sure your tasks are saved.",
  logoutFromAccount: "Sign out of account",
  logoutConfirmTitle: "Are you sure you want to sign out?",
  logoutConfirmDescription: "Make sure your tasks are saved.",
  confirmLogout: "Sign out",
  accountDesc:
    "Sign in with your email so your tasks, streaks, and XP stay saved to your account.",
  cloudSynced: "Synced",
  nickname: "Display Name",
  email: "Email",
  switchAccount: "Save / Switch Account",
  logoutDemo: "Back to Demo Account",
  languageLabel: "Language",
  langIndonesian: "Bahasa Indonesia",
  langEnglish: "English",
  notifTitle: "Deadline Reminders (1 day before & urgent)",
  notifDesc:
    "Get a reminder on your device when a task is due within 24 hours or in under 3 hours.",
  enableNotif: "Enable Device Notifications",
  testNotif: "Send Test Notification",
  notifActive: "Notifications On",
  coachTitle: "Mate's Personality",
  coachSub:
    "Choose how Mate talks when planning your schedule and reviewing your tasks.",
  savePrefs: "Save Preferences",
  themeTitle: "Theme",
  themeSub: "Choose light, dark, or follow your device setting.",
  themeLight: "Light",
  themeDark: "Dark",
  themeSystem: "System",
  soundTitle: "Sound Effects",
  soundDesc: "Small sounds when you finish a task or build a plan.",
  soundOn: "Sound on",
  soundOff: "Sound off",

  // ── Achievements ─────────────────────────────────────────
  badgesTitle: "Achievements",
  unlocked: "Unlocked",
  badgeFirstStepTitle: "First Step",
  badgeFirstStepDesc: "Complete at least 1 task",
  badgeConsistentTitle: "Consistency Fighter",
  badgeConsistentDesc: "Complete 3 deadline tasks on time in a row",
  badgeAntiSksTitle: "Anti-Cramming Club",
  badgeAntiSksDesc: "Reach Level 2 by earning 100 XP",
  badgeProgress: "{a}/{b}",

  // ── Demo mode ────────────────────────────────────────────
  demoMode: "Demo Controls",
  advance1Day: "+1 Day",
  skipDeadline: "Miss #1",

  // ── New task modal ───────────────────────────────────────
  singleTaskTab: "Single task",
  multiTaskTab: "Multiple tasks",

  // ── Single task form ─────────────────────────────────────
  aiFillTitle: "Type or say your task",
  aiFillBadge: "Quick fill",
  aiFillPlaceholder: "e.g. Study Calculus tomorrow at 7 PM.",
  aiFillButton: "Auto-fill with AI",
  taskName: "Task name",
  taskNamePlaceholder: "e.g. Study & practice Calculus problems",
  taskDeadline: "Deadline date",
  required: "required",
  today: "Today",
  tomorrow: "Tomorrow",
  nextWeek: "Next week",
  taskDetails: "Adjust details",
  taskTime: "Time",
  taskCategory: "Category",
  taskEstimate: "Estimate (hours)",
  taskPriority: "Priority",
  catStudy: "Study",
  catOrg: "Organization",
  catPersonal: "Personal",
  priorityLow: "Low",
  priorityMid: "Medium",
  priorityHigh: "High",
  cancel: "Cancel",
  saveTask: "Save task",

  // ── Multiple tasks form ──────────────────────────────────
  batchTitle: "Plan Multiple Tasks at Once",
  batchBadge: "Mate AI",
  batchDesc:
    "One task per line. Add the deadline on the same line, and Mate will break each one into small steps.",
  batchPlaceholder:
    "Chemistry lab report, due Friday 4 PM\nSociology paper next Monday 12 PM\nCalculus quiz Wednesday night",
  batchSubmit: "Plan {n} tasks",
  batchSubmitEmpty: "Plan tasks",
  batchPending: "Mate is planning...",
  batchLabel: "Task list",

  // ── General status ───────────────────────────────────────
  loading: "Loading...",
  retry: "Try again",
  offline: "You're offline. Changes will save once you reconnect.",
  errorGeneric: "Something went wrong. Please try again in a moment.",
  errorAi:
    "Mate can't be reached right now. Check your connection and try again.",
  close: "Close",
  toggleTheme: "Switch theme",
  notifications: "Notifications",
  notificationLoading: "Loading notification status...",
  notificationUnsupported: "Notifications not supported",
  notificationUnsupportedDescription:
    "This browser does not support push notifications. Try the latest Chrome, Edge, or Firefox.",
  notificationPermissionDenied: "Notification permission denied",
  notificationPermissionDeniedDescription:
    "Change this site's notification permission in your browser settings.",
  enableDeadlineReminders: "Enable deadline reminders",
  notificationsActive: "Notifications enabled",
  notificationsActiveDescription:
    "Reminders are scheduled for one day before, three hours before, and after a missed deadline. {count} devices registered.",
  notificationsInactiveDescription:
    "Notifications may still arrive while the browser is closed if your browser, device, and settings support it.",
  notificationPermissionDeniedInfo:
    "Notification permission was denied. Change this site's permission in your browser settings.",
  notificationSubscribeFailed: "Could not enable notifications. Try again.",
  notificationDisableSuccess: "Notifications disabled.",
  notificationDisableFailed: "Could not disable notifications. Try again.",
  notificationTestSuccess:
    "Test sent. Succeeded: {success}, failed: {failed}. Check your device notifications.",
  notificationTestFailed: "Could not send the notification test.",
  notificationEnableButton: "Enable notifications",
  notificationTestButton: "Send notification test",
  notificationDisableButton: "Turn off",
  notificationWorking: "Working...",
  notificationSendingTest: "Sending...",
};

export const DICT: Record<Lang, Record<KunciTeks, string>> = { id, en };

/**
 * Ambil teks sesuai bahasa. Jika key hilang di bahasa aktif,
 * jatuh ke bahasa Indonesia supaya UI tidak pernah kosong.
 *
 * @example t(lang, "batchSubmit", { n: 3 })  // "Susun 3 tugas"
 */
export function t(
  lang: Lang,
  key: KunciTeks,
  vars?: Record<string, string | number>,
): string {
  let teks = DICT[lang]?.[key] ?? DICT.id[key];
  if (vars) {
    for (const [nama, nilai] of Object.entries(vars)) {
      teks = teks.split(`{${nama}}`).join(String(nilai));
    }
  }
  return teks;
}

/**
 * Locale untuk Intl.DateTimeFormat / toLocaleDateString.
 * Pakai ini untuk nama hari dan bulan, jangan tulis array manual.
 *
 * @example new Intl.DateTimeFormat(localeOf(lang), { weekday: "short" })
 */
export function localeOf(lang: Lang): string {
  return DICT[lang].profileSub ? "id-ID" : "en-US";
}
