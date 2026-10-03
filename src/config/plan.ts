// The orchestrator's plan, as far as the running app needs it
// (docs/orchestrator/SPEC.md). Generated — do not edit; regenerated on every
// build and update from the stored plan. Without a plan every map is empty.
//
//   SYSTEM_ASSIGNED entity → fields a tool fills when a record is CREATED — the
//                   value does not exist before; dialogs hide these on create and
//                   the form-polish sets no default on them. A scheduled or
//                   update-triggered tool owns its field but is NOT in here.
//   PLAN_SENTENCES  slug → the plan in the owner's words (flows' field page)
//
// The runtime write guard (FLOW_WRITES/OWNERSHIP, planGuard.ts) left on
// 23.09.2026: a flow page composes against its generated hook, whose submit
// plan IS the Schreibliste — there is no way to spell a write outside it.

export const SYSTEM_ASSIGNED: Record<string, string[]> = {};

export const PLAN_SENTENCES: Record<string, string[]> = {
  "anmeldung-erfassen": [
    "Legt an: anmeldungen"
  ]
};

export const PLAN_SUMMARY = "Eine kleine Anwendung für das Sommerfest des Sportvereins im Juli. Gäste melden sich mit der Zahl der Personen, dem Hinweis auf Kinder und ihrem Buffet-Beitrag an. Auf der Anmeldeseite sehen alle, wie viele sich schon angemeldet haben. Das Organisationsteam behält die Anmeldungen und die Festdaten im Blick.";
