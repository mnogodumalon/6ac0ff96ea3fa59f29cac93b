import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { IconCalendarEvent, IconMapPin, IconUsers, IconUserCheck } from '@tabler/icons-react';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import { createPublicPort } from '@/lib/journey/publicPort';
import {
  useStepForm,
  useJourneySubmit,
  useRecordSearch,
  fieldText,
  fieldDate,
  fieldNumber,
  type JourneyRecord,
  type JourneyPort,
} from '@/lib/journey';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { tx } from '@/i18n';

const SLUG = 'sommerfest-anmeldung';

function formatDatum(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return format(d, "dd.MM.yyyy, HH:mm");
}

function adresse(r: JourneyRecord): string {
  const street = [fieldText(r, 'strasse'), fieldText(r, 'hausnummer')].filter(Boolean).join(' ');
  const city = [fieldText(r, 'plz'), fieldText(r, 'ort')].filter(Boolean).join(' ');
  return [street, city].filter(Boolean).join(', ');
}

function Wizard({ cfg, page }: { cfg: PublicPagesConfig; page: PublicPageConfig }) {
  const port: JourneyPort = useMemo(() => createPublicPort(cfg, page), [cfg, page]);
  const [step, setStep] = useState(1);
  const [fests, setFests] = useState<JourneyRecord[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<JourneyRecord[]>([]);

  const form = useStepForm('anmeldungen', {
    fields: ['fest', 'vorname', 'nachname', 'email', 'anzahl_personen', 'kinder_dabei', 'anzahl_kinder', 'buffet_art', 'buffet_beschreibung', 'anmerkungen'],
    autoComplete: true,
    required: { fest: true, vorname: true, nachname: true, anzahl_personen: true },
    steps: {
      fest: 1, vorname: 2, nachname: 2, email: 2, anzahl_personen: 2, kinder_dabei: 2,
      anzahl_kinder: 2, buffet_art: 2, buffet_beschreibung: 2, anmerkungen: 2,
    },
  });
  const submit = useJourneySubmit(
    port,
    [{ key: 'anmeldung', entity: 'anmeldungen', form, primary: true }],
    { draftKey: SLUG },
  );

  const search = useRecordSearch(port, 'festdetails', {
    searchFields: ['titel', 'ort'],
    toItem: r => ({
      id: r.id,
      title: fieldText(r, 'titel'),
      subtitle: [formatDatum(fieldDate(r, 'datum')), fieldText(r, 'ort')].filter(Boolean).join(' · '),
    }),
  });

  const loadStats = () => {
    port.list('anmeldungen', { limit: 500 }).then(setAnmeldungen).catch(() => setAnmeldungen([]));
  };

  useEffect(() => {
    port.list('festdetails', { limit: 50 }).then(setFests).catch(() => setFests([]));
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port]);

  // Gibt es nur ein Fest, wird es vorausgewählt.
  const onlyFest = search.records.length === 1 ? search.records[0] : null;
  const festValue = form.get('fest');
  useEffect(() => {
    if (onlyFest && !festValue) {
      (form.set as (k: string, v: unknown, l?: string) => void)('fest', onlyFest.id, search.labelOf(onlyFest.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyFest?.id, festValue]);

  useEffect(() => {
    if (submit.done) loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit.done]);

  const totalPersons = anmeldungen.reduce((sum, r) => sum + (fieldNumber(r, 'anzahl_personen') ?? 0), 0);
  const kinderDabei = form.get('kinder_dabei') === true;

  const steps = [
    { label: tx('Fest') },
    { label: tx('Angaben') },
    { label: tx('Prüfen') },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary/10 p-4 text-center overflow-hidden">
          <IconUserCheck size={22} className="mx-auto mb-1 text-primary" />
          <div className="text-3xl font-bold text-primary">{anmeldungen.length}</div>
          <div className="text-sm text-muted-foreground">{tx('Anmeldungen')}</div>
        </div>
        <div className="rounded-2xl bg-primary/10 p-4 text-center overflow-hidden">
          <IconUsers size={22} className="mx-auto mb-1 text-primary" />
          <div className="text-3xl font-bold text-primary">{totalPersons}</div>
          <div className="text-sm text-muted-foreground">{tx('Gäste dabei')}</div>
        </div>
      </div>

      {fests.length > 0 && (
        <div className="space-y-3">
          {fests.map(f => (
            <div key={f.id} className="rounded-2xl border p-4 space-y-1 overflow-hidden">
              <div className="font-semibold">{fieldText(f, 'titel')}</div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <IconCalendarEvent size={16} className="mt-0.5 shrink-0" />
                <span>{formatDatum(fieldDate(f, 'datum'))}</span>
              </div>
              {adresse(f) && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <IconMapPin size={16} className="mt-0.5 shrink-0" />
                  <span>{adresse(f)}</span>
                </div>
              )}
              {fieldText(f, 'beschreibung') && (
                <p className="text-sm whitespace-pre-line pt-1">{fieldText(f, 'beschreibung')}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <IntentWizardShell
        steps={steps}
        currentStep={step}
        onStepChange={setStep}
        back={false}
        forms={[form]}
        draftKey={SLUG}
      >
        {step === 1 && (
          <>
            <Field form={form} name="fest">
              <EntitySelectStep
                {...search.select}
                id={form.record('fest').id}
                invalid={form.record('fest').invalid}
                selectedId={(form.get('fest') as string | null) || null}
                onSelect={id => (form.set as (k: string, v: unknown, l?: string) => void)('fest', id, search.labelOf(id))}
              />
            </Field>
            <StepNav hideBack onNext={() => form.validate(['fest'])} nextStepLabel={tx('Angaben')} />
          </>
        )}
        {step === 2 && (
          <>
            <div className="space-y-5">
              <Bound form={form} name="vorname" />
              <Bound form={form} name="nachname" />
              <Bound form={form} name="email" />
              <Bound form={form} name="anzahl_personen" />
              <Bound form={form} name="kinder_dabei" />
              {kinderDabei && <Bound form={form} name="anzahl_kinder" />}
              <Bound form={form} name="buffet_art" allowClear />
              <Bound form={form} name="buffet_beschreibung" />
              <Bound form={form} name="anmerkungen" />
            </div>
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => form.validate(['vorname', 'nachname', 'email', 'anzahl_personen'])}
              nextStepLabel={tx('Prüfen')}
            />
          </>
        )}
        {step === 3 && !submit.done && (
          <SummaryStep
            forms={[form]}
            submit={submit}
            whatHappensNext={tx('Mit dem Absenden ist deine Anmeldung eingetragen. Wir freuen uns auf dich!')}
          />
        )}
        {submit.result && (
          <SuccessStep
            result={submit.result}
            forms={[form]}
            submit={submit}
            title={tx('Danke für deine Anmeldung')}
          />
        )}
      </IntentWizardShell>
    </div>
  );
}

export default function SommerfestAnmeldung() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicPagesConfig(SLUG)
      .then(c => {
        setCfg(c);
        setPage(c?.pages[SLUG] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }

  return (
    <PublicShell title={page.title} description={page.description}>
      <Wizard cfg={cfg} page={page} />
    </PublicShell>
  );
}
