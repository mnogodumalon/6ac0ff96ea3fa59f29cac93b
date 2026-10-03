// Auto-generated. Per-entity form-enhancements config for "Anmeldungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["fest", {"row": ["vorname", "nachname"]}, "email", "anzahl_personen", {"row": ["kinder_dabei", "anzahl_kinder"], "cols": "1fr 1fr"}, "buffet_art", "buffet_beschreibung", "anmerkungen"],
  defaults: {
    'anzahl_personen': { kind: 'literal', value: 1 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
