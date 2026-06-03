const RU_PLURALS = new Intl.PluralRules('ru')
const RU_FORM_INDEX: Record<Intl.LDMLPluralRule, number> = {
  zero: 2,
  one: 0,
  two: 1,
  few: 1,
  many: 2,
  other: 2,
}
function russianPluralRule(choice: number): number {
  return RU_FORM_INDEX[RU_PLURALS.select(Math.abs(choice))]
}

function defaultPluralRule(choice: number): number {
  if (choice === 0) return 0
  return choice === 1 ? 1 : 2
}

export default defineI18nConfig(() => ({
  legacy: false,
  pluralRules: {
    ru: russianPluralRule,
    en: defaultPluralRule,
    de: defaultPluralRule,
  },
}))
