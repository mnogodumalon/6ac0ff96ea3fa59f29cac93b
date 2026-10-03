import type { Festdetails, Anmeldungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface FestdetailsDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Festdetails;
  /** 1:N „Anmeldungen" (fest): VOLLE Liste — der Block filtert auf diesen Record. */
  anmeldungenList: Anmeldungen[];
  /** Zeilen-Klick → overlay.push auf das Anmeldungen-Detail (nie der Edit-Dialog). */
  onOpenAnmeldungen: (record: Anmeldungen) => void;
  /** Kontextuelles „+": öffnet den Anmeldungen-Dialog mit diesem Record vorgesetzt. */
  onAddAnmeldungen: () => void;
}

export function FestdetailsDetails({
  record,
  anmeldungenList,
  onOpenAnmeldungen,
  onAddAnmeldungen,
}: FestdetailsDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('festdetails', 'datum')} value={record.fields.datum} format="datetime" />
        <RecordField label={fieldLabel('festdetails', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('festdetails', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('festdetails', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('festdetails', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('festdetails', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('festdetails', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('anmeldungen')}
        items={anmeldungenList.filter(r => extractRecordId(r.fields.fest) === record.record_id)}
        map={r => ({ name: r.fields.vorname ?? appLabel('anmeldungen'), meta: undefined })}
        onOpen={onOpenAnmeldungen}
        onAdd={onAddAnmeldungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.FESTDETAILS} recordId={record.record_id} />
    </>
  );
}
