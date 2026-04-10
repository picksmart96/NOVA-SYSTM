import SectionHeading from "./SectionHeading";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function NovaHelpSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeading
          eyebrow={t("home.novaHelp.eyebrow")}
          title={t("home.novaHelp.title")}
        />

        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl text-center">
          <h3 className="text-2xl font-bold text-white">{t("home.novaHelp.novaTitle")}</h3>
          <p className="mt-4 text-yellow-400 font-semibold">
            {t("home.novaHelp.wakeLabel")}
          </p>
          <p className="mt-3 text-slate-300">
            {t("home.novaHelp.wakeText")}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {t("home.novaHelp.hintText")}
          </p>

          <Link
            href="/nova-help"
            className="mt-6 inline-flex items-center rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300"
          >
            {t("home.novaHelp.openNova")}
          </Link>
        </div>
      </div>
    </section>
  );
}
