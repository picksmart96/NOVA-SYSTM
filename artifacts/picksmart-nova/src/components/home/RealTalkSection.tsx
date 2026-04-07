import SectionHeading from "./SectionHeading";
import { useTranslation } from "react-i18next";

export default function RealTalkSection() {
  const { t } = useTranslation();
  const items = t("home.realTalk.items", { returnObjects: true }) as Array<{
    title: string;
    text: string;
  }>;

  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-start">
        <div>
          <SectionHeading
            eyebrow={t("home.realTalk.eyebrow")}
            title={t("home.realTalk.title")}
            subtitle={t("home.realTalk.subtitle")}
            center={false}
          />

          <div className="mt-8 space-y-5">
            {items.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
              >
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl">
          <div className="text-sm uppercase tracking-[0.2em] text-yellow-400 font-semibold">
            {t("home.realTalk.palletLabel")}
          </div>
          <div className="mt-6 text-6xl font-black text-white">0 → 100%</div>
          <p className="mt-3 text-slate-300 text-lg">{t("home.realTalk.rateLabel")}</p>
          <div className="mt-10 rounded-2xl bg-slate-900 p-5 border border-slate-800">
            <p className="text-white font-semibold">{t("home.realTalk.ratedLabel")}</p>
            <p className="mt-2 text-slate-300">{t("home.realTalk.ratedText")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
