/**
 * Anmeldung stornieren — 3-Schritt-Wizard.
 * Steps: 1) Anmeldung wählen → 2) Grund angeben → 3) Prüfen & stornieren.
 * Reads: anmeldungen (nur nicht stornierte). Writes: anmeldungen (Update von anmerkungen: 'Storniert: <Grund>' + bisheriger Text).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { useStepForm, useJourneySubmit, useRecordSearch, fieldText, fieldNumber } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

export default function AnmeldungStornierenPage() {
  const PREFIX = 'Storniert:';

  const [step, setStep] = useState(1);
  const [anmeldungId, setAnmeldungId] = useState<string | null>(null);

  const anmeldungen = useRecordSearch(servicePort, 'anmeldungen', {
    searchFields: ['vorname', 'nachname', 'email'],
    filter: tx`r.v_anmerkungen is None or not r.v_anmerkungen.startswith('${PREFIX}')`,
    where: r => !fieldText(r, 'anmerkungen').startsWith(PREFIX),
    toItem: (a, ctx) => {
      const personen = fieldNumber(a, 'anzahl_personen');
      return {
        id: a.id,
        title: `${fieldText(a, 'vorname')} ${fieldText(a, 'nachname')}`.trim(),
        subtitle: ctx.ref('fest'),
        stats: personen != null ? [{ label: tx('Personen'), value: personen }] : undefined,
      };
    },
  });

  const f = useStepForm('anmeldungen', {
    fields: ['anmerkungen'],
    steps: { anmerkungen: 2 },
    required: { anmerkungen: true },
    messages: { anmerkungen: tx('Bitte einen Stornogrund angeben.') },
  });

  const grund = String(f.get('anmerkungen') ?? '').trim();

  const submit = useJourneySubmit(servicePort, [
    {
      key: 'storno',
      entity: 'anmeldungen',
      form: f,
      updates: () => anmeldungId ?? undefined,
      primary: true,
      values: () => {
        const alt = anmeldungId ? fieldText(anmeldungen.recordOf(anmeldungId) ?? { id: '', fields: {}, createdAt: null }, 'anmerkungen').trim() : '';
        return { anmerkungen: `${PREFIX} ${grund}${alt ? `\n${alt}` : ''}` };
      },
    },
  ], { draftKey: 'anmeldung-stornieren' });

  const restart = () => {
    submit.reset();
    f.reset();
    setAnmeldungId(null);
    setStep(1);
  };

  const quickReasons = [tx('Krankheit'), tx('Terminkonflikt'), tx('Sonstiges')];

  return (
    <IntentWizardShell
      title={tx('Anmeldung stornieren')}
      currentStep={step}
      onStepChange={setStep}
      forms={[f]}
      draftKey="anmeldung-stornieren"
      intro={{ description: tx('Eine bestehende Anmeldung mit Grund stornieren.'), needs: [tx('Name der Anmeldung'), tx('Stornogrund')] }}
    >
      <WizardStep label={tx('Anmeldung')} description={tx('Welche Anmeldung soll storniert werden?')}>
        <EntitySelectStep
          {...anmeldungen.select}
          selectedId={anmeldungId}
          create={false}
          searchPlaceholder={tx('Name oder E-Mail …')}
          emptyText={tx('Es gibt keine Anmeldung, die noch nicht storniert ist.')}
          onSelect={id => { setAnmeldungId(id); setStep(2); }}
        />
      </WizardStep>
      <WizardStep label={tx('Grund')} description={tx('Warum wird die Anmeldung storniert?')}>
        {anmeldungId ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {quickReasons.map(r => (
                <Button key={r} type="button" variant="outline" size="sm" onClick={() => f.set('anmerkungen', r)}>
                  {r}
                </Button>
              ))}
            </div>
            <Bound form={f} name="anmerkungen" label={tx('Stornogrund')} rows={4} />
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => f.validate(['anmerkungen'])}
              nextStepLabel={tx('Prüfen')}
            />
          </div>
        ) : (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        )}
      </WizardStep>
      <WizardStep label={tx('Prüfen')} description={tx('Angaben kontrollieren und Stornierung bestätigen.')}>
        {!submit.done && (
          <SummaryStep
            forms={[f]}
            submit={submit}
            confirmLabel={tx('Anmeldung stornieren')}
            items={[{
              key: 'anmeldung',
              label: tx('Anmeldung'),
              value: (anmeldungId && anmeldungen.labelOf(anmeldungId)) || '—',
              step: 1,
            }]}
            whatHappensNext={tx('Der Stornogrund wird als „Storniert: …“ am Anfang der Anmerkungen vermerkt. Bisherige Anmerkungen bleiben erhalten.')}
          />
        )}
      </WizardStep>
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[f]}
          title={tx('Anmeldung storniert')}
          next={[
            { label: tx('Weitere Anmeldung stornieren'), onClick: restart },
            { label: tx('Neue Anmeldung erfassen'), href: '#/intents/anmeldung-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
