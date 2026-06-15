export const PROGRAM_SPLIT_OPTIONS = (t: (key: string) => string) => [
  {
    value: "push_pull_legs",
    label: t("fitness.programPPL"),
    desc: t("fitness.programPPLDesc"),
  },
  {
    value: "upper_lower",
    label: t("fitness.programUpperLower"),
    desc: t("fitness.programUpperLowerDesc"),
  },
  {
    value: "anterior_posterior",
    label: t("fitness.programAnteriorPosterior"),
    desc: t("fitness.programAnteriorPosteriorDesc"),
  },
  {
    value: "arnold_split",
    label: t("fitness.programArnold"),
    desc: t("fitness.programArnoldDesc"),
  },
  {
    value: "full_body",
    label: t("fitness.programFullBody"),
    desc: t("fitness.programFullBodyDesc"),
  },
];
