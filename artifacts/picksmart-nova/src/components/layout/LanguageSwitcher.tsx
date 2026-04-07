import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("es") ? "es" : "en";

  const toggle = () => {
    i18n.changeLanguage(current === "en" ? "es" : "en");
  };

  return (
    <button
      onClick={toggle}
      title={current === "en" ? "Switch to Español" : "Switch to English"}
      className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-yellow-400 hover:text-yellow-300 transition shrink-0"
    >
      <span className="text-sm leading-none">{current === "en" ? "🇪🇸" : "🇺🇸"}</span>
      <span>{current === "en" ? "ES" : "EN"}</span>
    </button>
  );
}
