/**
 * Anmeldung erfassen — 4-Schritt-Wizard + Prüfen.
 * Steps: 1) Fest wählen → 2) Name und E-Mail → 3) Personen und Kinder → 4) Buffet-Beitrag → Prüfen & anlegen.
 * Reads: festdetails. Writes: anmeldungen (via useAnmeldungErfassenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldDate } from '@/lib/journey';
import { useAnmeldungErfassenFlow } from '@/lib/journey/flows/AnmeldungErfassen';
import { tx } from '@/i18n';

export default function AnmeldungErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnmeldungErfassenFlow({
    steps: {
      fest: 1,
      vorname: 2, nachname: 2, email: 2,
      anzahl_personen: 3, kinder_dabei: 3, anzahl_kinder: 3,
      buffet_art: 4, buffet_beschreibung: 4, anmerkungen: 4,
    },
    items: {
      fest: r => {
        const datum = fieldDate(r, 'datum');
        const ort = fieldText(r, 'ort');
        let wann = '';
        if (datum) {
          try { wann = format(parseISO(datum), 'dd.MM.yyyy HH:mm'); } catch { wann = datum; }
        }
        return { id: r.id, title: fieldText(r, 'titel'), subtitle: [wann, ort].filter(Boolean).join(' · ') };
      },
    },
  });
  const form = flow.forms.anmeldungen;

  return (
    <IntentWizardShell
      title={tx('Anmeldung erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Nimm eine Anmeldung zu einem Fest auf, zum Beispiel telefonisch.'),
        needs: [tx('Name der Person'), tx('Anzahl der Personen'), tx('Buffet-Beitrag')],
      }}
    >
      <WizardStep label={tx('Fest')} description={tx('Für welches Fest wird die Anmeldung erfasst?')}>
        <EntitySelectStep
          {...flow.picks.fest.select}
          {...flow.pick('fest')}
          avatar="none"
          searchPlaceholder={tx('Fest suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Kontakt')} description={tx('Wer meldet sich an?')} needs={['fest']}>
        <div className="space-y-4">
          <Bound form={form} name="vorname" />
          <Bound form={form} name="nachname" />
          <Bound form={form} name="email" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => form.validate(['vorname', 'nachname', 'email'])}
            nextStepLabel={tx('Personen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Personen')} description={tx('Wie viele Personen kommen, und sind Kinder dabei?')}>
        <div className="space-y-4">
          <Bound form={form} name="anzahl_personen" />
          <Bound form={form} name="kinder_dabei" />
          {form.get('kinder_dabei') === true && <Bound form={form} name="anzahl_kinder" />}
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => form.validate(['anzahl_personen', 'kinder_dabei', 'anzahl_kinder'])}
            nextStepLabel={tx('Buffet')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Buffet')} description={tx('Was bringt die Person zum Buffet mit?')}>
        <div className="space-y-4">
          <Bound form={form} name="buffet_art" allowClear />
          <Bound form={form} name="buffet_beschreibung" />
          <Bound form={form} name="anmerkungen" rows={3} />
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => form.validate(['buffet_art', 'buffet_beschreibung', 'anmerkungen'])}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Die Anmeldung wird beim gewählten Fest gespeichert.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[{ label: tx('Zum Dashboard'), href: '#/' }]}
        />
      )}
    </IntentWizardShell>
  );
}
