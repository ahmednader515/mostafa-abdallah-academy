/** Shared types for the Landing Pages CMS. */

export type LandingTemplateId = "course" | "subscription" | "consultation" | "product";

export type LandingCtaTargetType =
  | "course"
  | "subscription"
  | "library_plan"
  | "consultation"
  | "store_product"
  | "none";

export type LandingCtaActionType =
  | "target_default"
  | "course"
  | "subscription"
  | "library_plan"
  | "consultation"
  | "store_product"
  | "custom_url"
  | "login";

export type LandingCtaButton = {
  id: string;
  label: string;
  labelEn?: string;
  color?: string;
  action: LandingCtaActionType;
  targetId?: string;
  customUrl?: string;
};

export type LandingTheme = {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
};

export type LandingSectionType =
  | "hero"
  | "features"
  | "details"
  | "instructor"
  | "testimonials"
  | "faq"
  | "pricing"
  | "signup";

export type LandingSectionBase = {
  id: string;
  type: LandingSectionType;
  visible: boolean;
};

export type HeroSection = LandingSectionBase & {
  type: "hero";
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  mediaType: "image" | "video" | "none";
  mediaUrl?: string;
  buttons: LandingCtaButton[];
};

export type FeatureItem = {
  id: string;
  icon?: string;
  title: string;
  titleEn?: string;
  text: string;
  textEn?: string;
};

export type FeaturesSection = LandingSectionBase & {
  type: "features";
  title: string;
  titleEn?: string;
  items: FeatureItem[];
};

export type DetailsSection = LandingSectionBase & {
  type: "details";
  title: string;
  titleEn?: string;
  body: string;
  bodyEn?: string;
  imageUrl?: string;
};

export type InstructorSection = LandingSectionBase & {
  type: "instructor";
  title: string;
  titleEn?: string;
  name: string;
  nameEn?: string;
  bio: string;
  bioEn?: string;
  imageUrl?: string;
};

export type TestimonialItem = {
  id: string;
  name: string;
  text: string;
  textEn?: string;
  rating?: number;
};

export type TestimonialsSection = LandingSectionBase & {
  type: "testimonials";
  title: string;
  titleEn?: string;
  items: TestimonialItem[];
};

export type FaqItem = {
  id: string;
  question: string;
  questionEn?: string;
  answer: string;
  answerEn?: string;
};

export type FaqSection = LandingSectionBase & {
  type: "faq";
  title: string;
  titleEn?: string;
  items: FaqItem[];
};

export type PricingSection = LandingSectionBase & {
  type: "pricing";
  title: string;
  titleEn?: string;
  priceLabel: string;
  priceLabelEn?: string;
  priceAmount?: number | null;
  originalPriceAmount?: number | null;
  description: string;
  descriptionEn?: string;
  buttons: LandingCtaButton[];
  useTargetPrice: boolean;
};

export type SignupSection = LandingSectionBase & {
  type: "signup";
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  buttons: LandingCtaButton[];
};

export type LandingSection =
  | HeroSection
  | FeaturesSection
  | DetailsSection
  | InstructorSection
  | TestimonialsSection
  | FaqSection
  | PricingSection
  | SignupSection;

export type LandingPageEventType = "visit" | "cta_click" | "checkout_start" | "purchase";

export type LandingPageStats = {
  visits: number;
  ctaClicks: number;
  checkoutStarts: number;
  purchases: number;
};

export const DEFAULT_LANDING_THEME: LandingTheme = {
  primaryColor: "#0f766e",
  backgroundColor: "#f8fafc",
  textColor: "#0f172a",
  buttonColor: "#0f766e",
  buttonTextColor: "#ffffff",
};

export function newSectionId(): string {
  return `s_${Math.random().toString(36).slice(2, 10)}`;
}

export function newButtonId(): string {
  return `b_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptySection(type: LandingSectionType): LandingSection {
  const id = newSectionId();
  const btn = (): LandingCtaButton => ({
    id: newButtonId(),
    label: "اشترك الآن",
    labelEn: "Subscribe now",
    action: "target_default",
  });

  switch (type) {
    case "hero":
      return {
        id,
        type: "hero",
        visible: true,
        title: "عنوان جذاب",
        titleEn: "Compelling headline",
        subtitle: "وصف قصير يوضح القيمة.",
        subtitleEn: "A short value proposition.",
        mediaType: "none",
        buttons: [btn()],
      };
    case "features":
      return {
        id,
        type: "features",
        visible: true,
        title: "المميزات",
        titleEn: "Features",
        items: [
          {
            id: newSectionId(),
            title: "ميزة",
            titleEn: "Feature",
            text: "وصف الميزة",
            textEn: "Feature description",
          },
        ],
      };
    case "details":
      return {
        id,
        type: "details",
        visible: true,
        title: "التفاصيل",
        titleEn: "Details",
        body: "أضف تفاصيل المنتج أو الكورس هنا.",
        bodyEn: "Add product or course details here.",
      };
    case "instructor":
      return {
        id,
        type: "instructor",
        visible: true,
        title: "المقدم",
        titleEn: "Instructor",
        name: "الاسم",
        nameEn: "Name",
        bio: "نبذة قصيرة.",
        bioEn: "Short bio.",
      };
    case "testimonials":
      return {
        id,
        type: "testimonials",
        visible: true,
        title: "آراء العملاء",
        titleEn: "Testimonials",
        items: [
          {
            id: newSectionId(),
            name: "عميل",
            text: "تجربة رائعة.",
            textEn: "Great experience.",
            rating: 5,
          },
        ],
      };
    case "faq":
      return {
        id,
        type: "faq",
        visible: true,
        title: "الأسئلة الشائعة",
        titleEn: "FAQ",
        items: [
          {
            id: newSectionId(),
            question: "سؤال؟",
            questionEn: "Question?",
            answer: "إجابة.",
            answerEn: "Answer.",
          },
        ],
      };
    case "pricing":
      return {
        id,
        type: "pricing",
        visible: true,
        title: "الأسعار",
        titleEn: "Pricing",
        priceLabel: "السعر",
        priceLabelEn: "Price",
        priceAmount: null,
        originalPriceAmount: null,
        description: "",
        descriptionEn: "",
        buttons: [btn()],
        useTargetPrice: true,
      };
    case "signup":
      return {
        id,
        type: "signup",
        visible: true,
        title: "ابدأ الآن",
        titleEn: "Get started",
        subtitle: "سجّل أو اشترِ بضغطة واحدة.",
        subtitleEn: "Sign up or buy in one click.",
        buttons: [btn()],
      };
  }
}
