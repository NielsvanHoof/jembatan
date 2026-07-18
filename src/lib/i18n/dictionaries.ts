/**
 * UI chrome dictionaries (not flashcard content).
 * Loaded by locale segment: /id/... or /en/...
 * Pattern follows Next.js i18n guide.
 */

export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
export const DEFAULT_LOCALE: Locale = "id";

export type Dictionary = {
  meta: { title: string; description: string };
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
    practiceAgain: string;
    seeProgress: string;
    langId: string;
    langNl: string;
    showAnswer: string;
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
  };
  progress: {
    title: string;
    lede: string;
    dueNow: string;
    reviewedToday: string;
    learning: string;
    mastered: string;
    totalCards: string;
    startSession: string;
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
      "Kartu kosakata Indonesia ↔ Belanda untuk kehidupan sehari-hari di Belanda.",
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
    lede: "Kosakata A1 untuk belanja, OV, rumah, dan percakapan sehari-hari — tanpa lewat bahasa Inggris.",
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
    emptyTitle: "Tidak ada kartu jatuh tempo",
    emptyBody:
      "Hebat — untuk arah ini semuanya sudah dijadwalkan ulang. Istirahat dulu, atau latihan ulang kosakata.",
    practiceAgain: "Latihan ulang",
    seeProgress: "Lihat kemajuan",
    langId: "Indonesia",
    langNl: "Belanda",
    showAnswer: "Tampilkan jawaban",
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
  },
  progress: {
    title: "Kemajuan",
    lede: "Ringkasan untuk kedua arah: Indonesia → Belanda dan sebaliknya.",
    dueNow: "Jatuh tempo sekarang",
    reviewedToday: "Dikerjakan hari ini",
    learning: "Sedang dipelajari",
    mastered: "Sudah menguasai",
    totalCards: "Total kartu (kedua arah)",
    startSession: "Mulai sesi belajar",
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
      "Indonesian ↔ Dutch flashcards for daily life in the Netherlands.",
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
    lede: "A1 vocab for shopping, transit, home, and everyday talk — without going through English.",
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
    emptyTitle: "No cards due",
    emptyBody:
      "Nice — everything for this direction is scheduled again. Take a break, or practice the vocab again.",
    practiceAgain: "Practice again",
    seeProgress: "See progress",
    langId: "Indonesian",
    langNl: "Dutch",
    showAnswer: "Show answer",
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
  },
  progress: {
    title: "Progress",
    lede: "Summary for both directions: Indonesian → Dutch and the reverse.",
    dueNow: "Due now",
    reviewedToday: "Reviewed today",
    learning: "Learning",
    mastered: "Mastered",
    totalCards: "Total cards (both directions)",
    startSession: "Start a study session",
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
