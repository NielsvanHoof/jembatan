/**
 * UI chrome dictionaries (not flashcard content).
 * Loaded by locale segment: /id/... or /en/...
 * Pattern follows Next.js i18n guide.
 */

export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
export const DEFAULT_LOCALE: Locale = "id";

export type Dictionary = {
  meta: {
    title: string;
    description: string;
    /** Short titles for the title template (`%s · Jembatan`). */
    pages: {
      login: string;
      register: string;
      study: string;
      progress: string;
      offline: string;
    };
  };
  nav: {
    study: string;
    progress: string;
    login: string;
    logout: string;
    aria: string;
  };
  lang: { label: string; id: string; en: string };
  landing: {
    headline: string;
    lede: string;
    start: string;
    continue: string;
    hasAccount: string;
    seeProgress: string;
  };
  login: { title: string; lede: string };
  register: { title: string; lede: string };
  auth: {
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    submitLogin: string;
    submitRegister: string;
    pending: string;
    noAccount: string;
    registerLink: string;
    hasAccount: string;
    loginLink: string;
    errors: {
      invalid_input: string;
      email_taken: string;
      register_signin_failed: string;
      invalid_credentials_format: string;
      wrong_credentials: string;
    };
  };
  study: {
    directionLegend: string;
    cardsLeft: string;
    done: string;
    emptyTitle: string;
    emptyBody: string;
    /** Theme-filtered empty state; {theme} is the localized tag label. */
    emptyTitleTheme: string;
    emptyBodyTheme: string;
    /** Shown when nothing is due; {when} filled by relative next-due text. */
    emptyNextDue: string;
    nextDueHours: string;
    nextDueDays: string;
    nextDueSoon: string;
    practiceAgain: string;
    seeProgress: string;
    clearTheme: string;
    /** Collapsible study chrome — card stays the stage. */
    showFilters: string;
    hideFilters: string;
    langId: string;
    langNl: string;
    showAnswer: string;
    /** Outing theme levels (words → sentences). */
    stageLegend: string;
    stageWords: string;
    stageSentences: string;
    /** Duolingo-style sentence builder on Level 2 cards. */
    builderHint: string;
    builderTryAgain: string;
    builderCorrect: string;
    builderWrong: string;
    habitDue: string;
    habitToday: string;
    habitStreak: string;
    habitGoalMet: string;
    themeLegend: string;
    themeAll: string;
    outingLabel: string;
    deckLegend: string;
    /** Short picker labels keyed by deck slug */
    deckLabels: {
      "a1-kehidupan-sehari-hari": string;
      "a2-werk-administratie": string;
    };
    tags: {
      administrasi: string;
      arah: string;
      belanja: string;
      beleefdheid: string;
      cafe: string;
      cuaca: string;
      dasar: string;
      kerja: string;
      kesehatan: string;
      kota: string;
      makanan: string;
      ov: string;
      perkenalan: string;
      rumah: string;
      waktu: string;
    };
    ratings: {
      again: { label: string; hint: string };
      hard: { label: string; hint: string };
      good: { label: string; hint: string };
      easy: { label: string; hint: string };
    };
    errors: {
      unknown_rating: string;
      card_not_found: string;
    };
    /** Shown while ratings wait for a network connection. */
    syncPending: string;
    syncDone: string;
  };
  offline: {
    loading: string;
    cachedBanner: string;
    emptyTitle: string;
    emptyBody: string;
    openStudy: string;
  };
  progress: {
    title: string;
    lede: string;
    dueNow: string;
    reviewedToday: string;
    learning: string;
    mastered: string;
    totalCards: string;
    streak: string;
    /** Caption under the big streak number (pride hero). */
    streakHero: string;
    /** Caption when streak is 0 and mastered is the hero. */
    masteredHero: string;
    dailyGoal: string;
    startSession: string;
    deckLegend: string;
  };
  error: {
    title: string;
    body: string;
    retry: string;
    home: string;
  };
};

const id: Dictionary = {
  meta: {
    title: "Jembatan — Belajar Belanda dari Indonesia",
    description:
      "Kartu flash Indonesia ↔ Belanda A1–A2 untuk kehidupan sehari-hari, jalan-jalan, dan kerja di Belanda.",
    pages: {
      login: "Masuk",
      register: "Buat akun",
      study: "Belajar",
      progress: "Kemajuan",
      offline: "Offline",
    },
  },
  nav: {
    study: "Belajar",
    progress: "Kemajuan",
    login: "Masuk",
    logout: "Keluar",
    aria: "Navigasi utama",
  },
  lang: {
    label: "Bahasa antarmuka",
    id: "ID",
    en: "EN",
  },
  landing: {
    headline: "Belajar Belanda langsung dari Indonesia.",
    lede: "Kartu flash A1–A2 untuk kehidupan sehari-hari, jalan-jalan, dan kerja & administrasi — latihan berulang tanpa lewat bahasa Inggris.",
    start: "Mulai belajar",
    continue: "Lanjut belajar",
    hasAccount: "Sudah punya akun",
    seeProgress: "Lihat kemajuan",
  },
  login: {
    title: "Masuk",
    lede: "Lanjutkan progres belajarmu di perangkat mana pun.",
  },
  register: {
    title: "Buat akun",
    lede: "Simpan progres kartu Indonesia ↔ Belanda agar tidak hilang.",
  },
  auth: {
    name: "Nama",
    namePlaceholder: "Nama panggilan",
    email: "Email",
    emailPlaceholder: "nama@email.com",
    password: "Kata sandi",
    passwordPlaceholder: "Minimal 8 karakter",
    submitLogin: "Masuk",
    submitRegister: "Buat akun",
    pending: "Sebentar…",
    noAccount: "Belum punya akun?",
    registerLink: "Daftar",
    hasAccount: "Sudah punya akun?",
    loginLink: "Masuk",
    errors: {
      invalid_input:
        "Periksa kembali nama, email, dan kata sandi (min. 8 karakter).",
      email_taken: "Email ini sudah terdaftar. Silakan masuk saja.",
      register_signin_failed:
        "Akun dibuat, tapi masuk gagal. Coba masuk manual.",
      invalid_credentials_format: "Email atau kata sandi tidak valid.",
      wrong_credentials: "Email atau kata sandi salah.",
    },
  },
  study: {
    directionLegend: "Arah belajar",
    cardsLeft: "{n} kartu",
    done: "Selesai",
    emptyTitle: "Sudah cukup untuk sekarang",
    emptyBody:
      "Semua kartu di arah ini sudah dijadwalkan lagi. Istirahat dulu — atau latihan ulang kalau masih ingin.",
    emptyTitleTheme: "Tema {theme} sudah aman",
    emptyBodyTheme:
      "Tidak ada yang jatuh tempo di sini. Pilih tema lain, atau latihan ulang pelan-pelan.",
    emptyNextDue: "Kartu berikutnya {when}.",
    nextDueHours: "dalam ~{n} jam",
    nextDueDays: "dalam ~{n} hari",
    nextDueSoon: "segera",
    practiceAgain: "Latihan ulang",
    seeProgress: "Lihat kemajuan",
    clearTheme: "Semua tema",
    showFilters: "Filter",
    hideFilters: "Sembunyikan filter",
    langId: "Indonesia",
    langNl: "Belanda",
    showAnswer: "Tampilkan jawaban",
    stageLegend: "Level tema",
    stageWords: "1 · Kata",
    stageSentences: "2 · Kalimat",
    builderHint: "Susun kalimatnya — ketuk kata-katanya",
    builderTryAgain: "Coba lagi",
    builderCorrect: "Benar — kalimat harian siap dipakai",
    builderWrong: "Urutannya belum pas — coba lagi",
    habitDue: "{n} jatuh tempo",
    habitToday: "{done}/{goal} hari ini",
    habitStreak: "{n} hari beruntun",
    habitGoalMet: "Target hari ini tercapai — hebat",
    themeLegend: "Tema belajar",
    themeAll: "Semua",
    outingLabel: "Outing hari ini",
    deckLegend: "Dek",
    deckLabels: {
      "a1-kehidupan-sehari-hari": "A1 · Kehidupan sehari-hari",
      "a2-werk-administratie": "A2 · Kerja & administrasi",
    },
    tags: {
      administrasi: "Administrasi",
      arah: "Arah",
      belanja: "Belanja",
      beleefdheid: "Sopan santun",
      cafe: "Kafe",
      cuaca: "Cuaca",
      dasar: "Dasar",
      kerja: "Kerja",
      kesehatan: "Kesehatan",
      kota: "Kota",
      makanan: "Makanan",
      ov: "OV",
      perkenalan: "Perkenalan",
      rumah: "Rumah",
      waktu: "Waktu",
    },
    ratings: {
      again: { label: "Ulang", hint: "Belum ingat" },
      hard: { label: "Sulit", hint: "Ragu" },
      good: { label: "Baik", hint: "Ingat" },
      easy: { label: "Mudah", hint: "Lancar" },
    },
    errors: {
      unknown_rating: "Penilaian tidak dikenal.",
      card_not_found: "Kartu tidak ditemukan.",
    },
    syncPending: "Offline — penilaian akan dikirim saat online",
    syncDone: "Penilaian tersinkron",
  },
  offline: {
    loading: "Memuat kartu tersimpan…",
    cachedBanner: "Mode offline — kartu dari cache hari ini",
    emptyTitle: "Belum ada kartu di ponsel",
    emptyBody:
      "Buka Belajar sekali saat online — nanti kartu hari ini tersimpan untuk latihan di mana saja.",
    openStudy: "Ke Belajar",
  },
  progress: {
    title: "Kemajuan",
    lede: "Lihat jembatanmu tumbuh — Indonesia → Belanda dan sebaliknya.",
    dueNow: "Jatuh tempo sekarang",
    reviewedToday: "Dikerjakan hari ini",
    learning: "Sedang dipelajari",
    mastered: "Sudah menguasai",
    totalCards: "Total kartu (kedua arah)",
    streak: "Hari beruntun",
    streakHero: "hari beruntun",
    masteredHero: "kartu dikuasai",
    dailyGoal: "Target harian",
    startSession: "Mulai sesi belajar",
    deckLegend: "Dek",
  },
  error: {
    title: "Ada yang tidak beres",
    body: "Halaman ini gagal dimuat. Coba lagi, atau kembali ke beranda.",
    retry: "Coba lagi",
    home: "Ke beranda",
  },
};

const en: Dictionary = {
  meta: {
    title: "Jembatan — Learn Dutch from Indonesian",
    description:
      "Indonesian ↔ Dutch A1–A2 flashcards for daily life, outings, and work in the Netherlands.",
    pages: {
      login: "Log in",
      register: "Create account",
      study: "Study",
      progress: "Progress",
      offline: "Offline",
    },
  },
  nav: {
    study: "Study",
    progress: "Progress",
    login: "Log in",
    logout: "Log out",
    aria: "Main navigation",
  },
  lang: {
    label: "Interface language",
    id: "ID",
    en: "EN",
  },
  landing: {
    headline: "Learn Dutch straight from Indonesian.",
    lede: "A1–A2 flashcards for daily life, outings, and work & admin — spaced practice without going through English.",
    start: "Start learning",
    continue: "Continue studying",
    hasAccount: "I already have an account",
    seeProgress: "See progress",
  },
  login: {
    title: "Log in",
    lede: "Pick up your study progress on any device.",
  },
  register: {
    title: "Create account",
    lede: "Save your Indonesian ↔ Dutch card progress so it doesn’t get lost.",
  },
  auth: {
    name: "Name",
    namePlaceholder: "Nickname",
    email: "Email",
    emailPlaceholder: "name@email.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    submitLogin: "Log in",
    submitRegister: "Create account",
    pending: "One moment…",
    noAccount: "No account yet?",
    registerLink: "Sign up",
    hasAccount: "Already have an account?",
    loginLink: "Log in",
    errors: {
      invalid_input:
        "Check your name, email, and password (min. 8 characters).",
      email_taken: "This email is already registered. Try logging in.",
      register_signin_failed:
        "Account created, but sign-in failed. Try logging in manually.",
      invalid_credentials_format: "Email or password is invalid.",
      wrong_credentials: "Incorrect email or password.",
    },
  },
  study: {
    directionLegend: "Study direction",
    cardsLeft: "{n} cards",
    done: "Done",
    emptyTitle: "That’s enough for now",
    emptyBody:
      "Everything in this direction is scheduled again. Rest a bit — or practice again if you still feel like it.",
    emptyTitleTheme: "{theme} is covered for now",
    emptyBodyTheme:
      "Nothing due in this theme. Pick another, or practice again gently.",
    emptyNextDue: "Next card {when}.",
    nextDueHours: "in ~{n} hours",
    nextDueDays: "in ~{n} days",
    nextDueSoon: "soon",
    practiceAgain: "Practice again",
    seeProgress: "See progress",
    clearTheme: "All themes",
    showFilters: "Filters",
    hideFilters: "Hide filters",
    langId: "Indonesian",
    langNl: "Dutch",
    showAnswer: "Show answer",
    stageLegend: "Theme level",
    stageWords: "1 · Words",
    stageSentences: "2 · Sentences",
    builderHint: "Build the sentence — tap the words",
    builderTryAgain: "Try again",
    builderCorrect: "Nice — a daily line you can use",
    builderWrong: "Not quite — try another order",
    habitDue: "{n} due",
    habitToday: "{done}/{goal} today",
    habitStreak: "{n}-day streak",
    habitGoalMet: "Daily goal met — nice",
    themeLegend: "Study theme",
    themeAll: "All",
    outingLabel: "Today’s outing",
    deckLegend: "Deck",
    deckLabels: {
      "a1-kehidupan-sehari-hari": "A1 · Daily life",
      "a2-werk-administratie": "A2 · Work & admin",
    },
    tags: {
      administrasi: "Admin",
      arah: "Directions",
      belanja: "Shopping",
      beleefdheid: "Polite phrases",
      cafe: "Café",
      cuaca: "Weather",
      dasar: "Basics",
      kerja: "Work",
      kesehatan: "Health",
      kota: "City",
      makanan: "Food",
      ov: "Transit",
      perkenalan: "Intros",
      rumah: "Home",
      waktu: "Time",
    },
    ratings: {
      again: { label: "Again", hint: "Forgot" },
      hard: { label: "Hard", hint: "Unsure" },
      good: { label: "Good", hint: "Remembered" },
      easy: { label: "Easy", hint: "Fluent" },
    },
    errors: {
      unknown_rating: "Unknown rating.",
      card_not_found: "Card not found.",
    },
    syncPending: "Offline — ratings will sync when you’re back online",
    syncDone: "Ratings synced",
  },
  offline: {
    loading: "Loading saved cards…",
    cachedBanner: "Offline — using today’s cached cards",
    emptyTitle: "No cards on this phone yet",
    emptyBody:
      "Open Study once while online — then today’s cards stay saved for practice anywhere.",
    openStudy: "Go to Study",
  },
  progress: {
    title: "Progress",
    lede: "Watch your bridge grow — Indonesian → Dutch and the reverse.",
    dueNow: "Due now",
    reviewedToday: "Reviewed today",
    learning: "Learning",
    mastered: "Mastered",
    totalCards: "Total cards (both directions)",
    streak: "Day streak",
    streakHero: "day streak",
    masteredHero: "cards mastered",
    dailyGoal: "Daily goal",
    startSession: "Start a study session",
    deckLegend: "Deck",
  },
  error: {
    title: "Something went wrong",
    body: "This page failed to load. Try again, or go back home.",
    retry: "Try again",
    home: "Go home",
  },
};

const dictionaries: Record<Locale, Dictionary> = { id, en };

/** Sync get — dictionaries are small and stay on the server. */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "id" || value === "en";
}

export type AuthErrorCode = keyof Dictionary["auth"]["errors"];
export type StudyErrorCode = keyof Dictionary["study"]["errors"];
