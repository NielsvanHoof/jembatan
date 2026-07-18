import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n/dictionaries";

/** Standard OG / Twitter large-card size. */
export const ogSize = {
  width: 1200,
  height: 630,
} as const;

export const ogContentType = "image/png";

/** Brand tokens mirrored from globals.css for Satori (no CSS variables). */
const colors = {
  canal: "#1b3a4b",
  ink: "#14232c",
  foam: "#f3f7f9",
  chalk: "#eef4f6",
  saffron: "#d4922a",
  saffronDeep: "#b8731a",
  bridge: "#3d6b7a",
};

async function loadFonts() {
  const dir = join(process.cwd(), "src/assets/fonts");
  const [instrument, figtree] = await Promise.all([
    readFile(join(dir, "InstrumentSerif-Regular.ttf")),
    readFile(join(dir, "Figtree-SemiBold.ttf")),
  ]);
  return { instrument, figtree };
}

/**
 * Build the 1200×630 share card: brand hero + ID—arch—NL bridge + lede.
 * Locale picks Indonesian or English headline from the UI dictionary.
 */
export async function createOgImage(lang: string) {
  const locale: Locale = isLocale(lang) ? lang : "id";
  const dict = getDictionary(locale);
  const { instrument, figtree } = await loadFonts();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "72px 88px",
        background: `linear-gradient(165deg, ${colors.chalk} 0%, ${colors.foam} 55%, #e4eef3 100%)`,
        color: colors.ink,
      }}
    >
      {/* Soft saffron wash top-left — echoes the app atmosphere */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 520,
          height: 320,
          background:
            "radial-gradient(circle at 20% 0%, #ffe8bf 0%, transparent 70%)",
          display: "flex",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          maxWidth: 920,
        }}
      >
        <div
          style={{
            fontFamily: "Instrument Serif",
            fontSize: 108,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: colors.canal,
          }}
        >
          Jembatan
        </div>

        {/* Signature bridge: ID — arched saffron span — NL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            width: 420,
          }}
        >
          <span
            style={{
              fontFamily: "Figtree",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.16em",
              color: colors.bridge,
            }}
          >
            ID
          </span>
          <div
            style={{
              flex: 1,
              height: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(90deg, transparent 0%, ${colors.saffron} 20%, ${colors.canal} 50%, ${colors.saffron} 80%, transparent 100%)`,
              position: "relative",
            }}
          >
            {/* Arch sitting on the bridge line */}
            <div
              style={{
                position: "absolute",
                top: -14,
                width: 56,
                height: 22,
                borderTop: `3px solid ${colors.saffron}`,
                borderLeft: `3px solid ${colors.saffron}`,
                borderRight: `3px solid ${colors.saffron}`,
                borderBottom: "none",
                borderRadius: "999px 999px 0 0",
                display: "flex",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "Figtree",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.16em",
              color: colors.bridge,
            }}
          >
            NL
          </span>
        </div>

        <div
          style={{
            fontFamily: "Instrument Serif",
            fontSize: 44,
            lineHeight: 1.2,
            color: colors.ink,
            maxWidth: 720,
          }}
        >
          {dict.landing.headline}
        </div>

        <div
          style={{
            fontFamily: "Figtree",
            fontSize: 26,
            lineHeight: 1.4,
            color: colors.saffronDeep,
            maxWidth: 680,
          }}
        >
          {locale === "id"
            ? "Kartu flash Indonesia ↔ Belanda — tanpa lewat bahasa Inggris."
            : "Indonesian ↔ Dutch flashcards — without going through English."}
        </div>
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        {
          name: "Instrument Serif",
          data: instrument,
          style: "normal",
          weight: 400,
        },
        {
          name: "Figtree",
          data: figtree,
          style: "normal",
          weight: 600,
        },
      ],
    },
  );
}
