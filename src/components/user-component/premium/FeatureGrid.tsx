import React from "react";
import { Infinity, GraduationCap, Bot, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FeatureGrid() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Infinity className="w-6 h-6 text-secondary" />,
      title: t("premium.featureGrid.flashcard.title"),
      desc: t("premium.featureGrid.flashcard.desc")
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-secondary" />,
      title: t("premium.featureGrid.vipCourse.title"),
      desc: t("premium.featureGrid.vipCourse.desc")
    },
    {
      icon: <Bot className="w-6 h-6 text-secondary" />,
      title: t("premium.featureGrid.aiAssist.title"),
      desc: t("premium.featureGrid.aiAssist.desc")
    },
    {
      icon: <Zap className="w-6 h-6 text-secondary" />,
      title: t("premium.featureGrid.aiKaiwa.title"),
      desc: t("premium.featureGrid.aiKaiwa.desc")
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {features.map((item, index) => (
        <div
          key={index}
          className="bg-card text-card-foreground p-6 rounded-2xl border border-border hover:border-secondary/50 transition-colors"
        >
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
            {item.icon}
          </div>

          <h4 className="font-bold mb-2">
            {item.title}
          </h4>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}