/**
 * useAnmeldungErfassenFlow — the plumbing of the flow « Anmeldung erfassen », generated from the plan.
 *
 * Writes `anmeldungen`: asks `fest`, `vorname`, `nachname`, `email`, `anzahl_personen`, `kinder_dabei`, `anzahl_kinder`, `buffet_art`, `buffet_beschreibung`, `anmerkungen`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 3)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useAnmeldungErfassenFlow({
 *     steps: { fest: 1, vorname: 2, nachname: 2, email: 2, anzahl_personen: 2, kinder_dabei: 2, anzahl_kinder: 2, buffet_art: 2, buffet_beschreibung: 2, anmerkungen: 2 },
 *     items: { fest: r => ({ id: r.id, title: fieldText(r, 'titel') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.fest.select} {...flow.pick('fest')} />
 *     <Bound form={flow.forms.anmeldungen} name="vorname" />
 *     <Bound form={flow.forms.anmeldungen} name="nachname" />
 *     <Bound form={flow.forms.anmeldungen} name="email" />
 *     <Bound form={flow.forms.anmeldungen} name="anzahl_personen" />
 *     <Bound form={flow.forms.anmeldungen} name="kinder_dabei" />
 *     <Bound form={flow.forms.anmeldungen} name="anzahl_kinder" />
 *     <Bound form={flow.forms.anmeldungen} name="buffet_art" />
 *     <Bound form={flow.forms.anmeldungen} name="buffet_beschreibung" />
 *     <Bound form={flow.forms.anmeldungen} name="anmerkungen" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
export type AnmeldungErfassenFieldKey = 'anmerkungen' | 'anzahl_kinder' | 'anzahl_personen' | 'buffet_art' | 'buffet_beschreibung' | 'email' | 'fest' | 'kinder_dabei' | 'nachname' | 'vorname';

export interface AnmeldungErfassenForms {
  anmeldungen: StepForm<'anmeldungen'>;
}

// Alias so the option generics stay readable.
type Key = AnmeldungErfassenFieldKey;

export interface AnmeldungErfassenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    fest?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"anmerkungen": 2, "anzahl_kinder": 2, "anzahl_personen": 2, "buffet_art": 2, "buffet_beschreibung": 2, "email": 2, "fest": 1, "kinder_dabei": 2, "nachname": 2, "vorname": 2};
export const ANMELDUNGERFASSEN_REVIEW_STEP = 3;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useAnmeldungErfassenFlow(options: AnmeldungErfassenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const anmeldungen = useStepForm('anmeldungen', {
    fields: ["fest", "vorname", "nachname", "email", "anzahl_personen", "kinder_dabei", "anzahl_kinder", "buffet_art", "buffet_beschreibung", "anmerkungen"],
    steps: only(steps, ["fest", "vorname", "nachname", "email", "anzahl_personen", "kinder_dabei", "anzahl_kinder", "buffet_art", "buffet_beschreibung", "anmerkungen"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["fest", "vorname", "nachname", "email", "anzahl_personen", "kinder_dabei", "anzahl_kinder", "buffet_art", "buffet_beschreibung", "anmerkungen"]),
    messages: only(options.messages as Record<string, string> | undefined, ["fest", "vorname", "nachname", "email", "anzahl_personen", "kinder_dabei", "anzahl_kinder", "buffet_art", "buffet_beschreibung", "anmerkungen"]),
  });
  const forms: AnmeldungErfassenForms = { anmeldungen };
  const formList: StepForm[] = [anmeldungen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    fest: useRecordSearch(servicePort, 'festdetails', withPickPolicy('fest', {
      searchFields: ["titel", "ort"] as never,
      filter: "r.v_datum >= now()",
      where: (r: JourneyRecord) => (fieldDate(r, "datum") ?? '') >= isoDaysFromToday(0),
      toItem: options.items?.fest as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:anmeldung-erfassen:read:${entity}`);
  const picks = {
    fest: { ...searches.fest, select: { ...searches.fest.select, create: true as boolean, hint: hintFor('fest', 'festdetails', {"conditions": [{"field": "datum", "op": "gte", "value": {"rel": "today"}}], "mode": "all"} as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'anmeldungen', entity: 'anmeldungen', form: anmeldungen, primary: true,    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'anmeldung-erfassen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: AnmeldungErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: AnmeldungErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'anmeldung-erfassen' as const,
    draftKey: 'anmeldung-erfassen' as const,
    entity: 'anmeldungen' as const,
    form: anmeldungen,
    forms, formList, picks, submit, steps,    reviewStep: ANMELDUNGERFASSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
  };
}

export type AnmeldungErfassenFlow = ReturnType<typeof useAnmeldungErfassenFlow>;
