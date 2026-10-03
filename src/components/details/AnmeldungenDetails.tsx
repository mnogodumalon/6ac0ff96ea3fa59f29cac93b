import type { Anmeldungen, Festdetails } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface AnmeldungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Anmeldungen;
  /** N:1-Ziel „Festdetails": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  festdetailsList: Festdetails[];
  /** Klick auf die Festdetails-Relation → overlay.push auf dessen Detail. */
  onOpenFestdetails?: (record: Festdetails) => void;
}

export function AnmeldungenDetails({
  record,
  festdetailsList,
  onOpenFestdetails,
}: AnmeldungenDetailsProps) {
  const festTarget = festdetailsList.find(r => r.record_id === extractRecordId(record.fields.fest));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('anmeldungen', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('anmeldungen', 'anzahl_personen')} value={record.fields.anzahl_personen} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'kinder_dabei')} value={record.fields.kinder_dabei} format="bool" />
        <RecordField label={fieldLabel('anmeldungen', 'anzahl_kinder')} value={record.fields.anzahl_kinder} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'buffet_art')} value={record.fields.buffet_art} format="pill" />
        <RecordField label={fieldLabel('anmeldungen', 'buffet_beschreibung')} value={record.fields.buffet_beschreibung} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'anmerkungen')} value={record.fields.anmerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('anmeldungen', 'fest')}
          name={festTarget?.fields.strasse ?? '—'}
          meta={[festTarget?.fields.titel, festTarget?.fields.hausnummer].filter(Boolean).join(' · ') || undefined}
          onClick={festTarget && onOpenFestdetails ? () => onOpenFestdetails!(festTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ANMELDUNGEN} recordId={record.record_id} />
    </>
  );
}
