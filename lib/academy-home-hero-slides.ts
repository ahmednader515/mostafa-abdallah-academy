/** Hardcoded homepage hero slides used by AcademyHomeHero (not from HomepageSetting DB). */

export type AcademyHeroSlideFeature = {
  kind: "courses" | "trainers" | "certs" | "train" | "practice" | "succeed";
  labelAr: string;
  labelEn: string;
};

export type AcademyHeroSlide = {
  image: string;
  badgeAr: string;
  badgeEn: string;
  titleLine1Ar: string;
  titleLine1En: string;
  titleLine2Ar: string;
  titleLine2En: string;
  subtitleAr: string;
  subtitleEn: string;
  features: AcademyHeroSlideFeature[];
  chipValue: string;
  chipLabelAr: string;
  chipLabelEn: string;
};

export const ACADEMY_HOME_HERO_SLIDES: AcademyHeroSlide[] = [
  {
    image: "/background.png",
    badgeAr: "أكاديمية متخصصة في",
    badgeEn: "A specialized academy in",
    titleLine1Ar: "السياحة والسفر",
    titleLine1En: "Tourism & Travel",
    titleLine2Ar: "والضيافة الجوية",
    titleLine2En: "& Aviation Hospitality",
    subtitleAr: "تعلم من أفضل الخبرات في المجال وابدأ رحلتك الاحترافية نحو مستقبل ناجح",
    subtitleEn: "Learn from leading experts and start your professional journey toward a successful future",
    features: [
      { kind: "courses", labelAr: "كورسات تفاعلية", labelEn: "Interactive courses" },
      { kind: "trainers", labelAr: "مدربين محترفين", labelEn: "Professional trainers" },
      { kind: "certs", labelAr: "شهادات معتمدة", labelEn: "Accredited certificates" },
    ],
    chipValue: "4.9",
    chipLabelAr: "تقييم الطلاب",
    chipLabelEn: "Student rating",
  },
  {
    image: "/background-2.png",
    badgeAr: "برنامج تدريب الطيارين",
    badgeEn: "Commercial pilot training",
    titleLine1Ar: "من القاعة إلى قمرة القيادة",
    titleLine1En: "From Classroom",
    titleLine2Ar: "مسارك نحو قيادة احترافية",
    titleLine2En: "to the Cockpit",
    subtitleAr:
      "تدرّب، مارس، وانجح — برامج طيران عملية من المادة النظرية حتى الخبرة في قمرة القيادة",
    subtitleEn:
      "Train, practice, succeed — practical flight programs from theory to real cockpit experience",
    features: [
      { kind: "train", labelAr: "تدرّب", labelEn: "Train" },
      { kind: "practice", labelAr: "مارس", labelEn: "Practice" },
      { kind: "succeed", labelAr: "انجح", labelEn: "Succeed" },
    ],
    chipValue: "ATP",
    chipLabelAr: "مسار احترافي",
    chipLabelEn: "Career path",
  },
];
