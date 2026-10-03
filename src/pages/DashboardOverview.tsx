import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IconUsers, IconClipboardList, IconMoodKid, IconCalendarEvent, IconMapPin, IconPencil, IconPlus } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { LOOKUP_OPTIONS } from '@/types/app';
import { lookupKey } from '@/lib/formatters';
import { tx, dateFnsLocale } from '@/i18n';
import { useClock, gruss, namen } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatCard, StatCardRow } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { Button } from '@/components/ui/button';
import { ChartWidget, type ChartRow, type ChartSegment } from '@/components/widgets/ChartWidget';
import type { EnrichedAnmeldungen } from '@/types/enriched';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { festdetails } = data;
  const crud = useEntityCrud(data);
  const anmeldungen = crud.enriched.anmeldungen;
  const clock = useClock();
  const [sel, setSel] = useState<ChartSegment<EnrichedAnmeldungen> | null>(null);
  const [onlyKids, setOnlyKids] = useState(false);

  const personen = anmeldungen.reduce((s, a) => s + (a.fields.anzahl_personen ?? 1), 0);
  const kinder = anmeldungen.reduce((s, a) => s + (a.fields.kinder_dabei ? (a.fields.anzahl_kinder ?? 0) : 0), 0);
  const mitKindern = anmeldungen.filter(a => a.fields.kinder_dabei);
  const erwachsene = Math.max(0, personen - kinder);

  // The next upcoming fest (fallback: the latest one)
  const fest = useMemo(() => {
    const sorted = [...festdetails].sort((a, b) => (a.fields.datum ?? '').localeCompare(b.fields.datum ?? ''));
    const today = format(clock, "yyyy-MM-dd'T'HH:mm");
    return sorted.find(f => (f.fields.datum ?? '') >= today) ?? sorted[sorted.length - 1];
  }, [festdetails, clock]);

  const rows = useMemo<ChartRow<EnrichedAnmeldungen>[]>(
    () => anmeldungen.filter(a => a.fields.buffet_art).map(a => ({ id: `anmeldung:${a.record_id}`, data: a })),
    [anmeldungen],
  );

  // Buffet categories nobody has promised yet
  const options = LOOKUP_OPTIONS['anmeldungen']?.['buffet_art'] ?? [];
  const covered = new Set(anmeldungen.map(a => lookupKey(a.fields.buffet_art)));
  const missing = options.filter(o => o.key !== 'sonstiges' && !covered.has(o.key)).map(o => o.label);

  const visible = anmeldungen
    .filter(a => (!sel || sel.test({ id: `anmeldung:${a.record_id}`, data: a })) && (!onlyKids || a.fields.kinder_dabei))
    .sort((a, b) => (b.createdat ?? '').localeCompare(a.createdat ?? ''));

  const personName = (a: EnrichedAnmeldungen) =>
    [a.fields.vorname, a.fields.nachname].filter(Boolean).join(' ') || tx('Ohne Name');

  const latest = [...anmeldungen].sort((a, b) => (b.createdat ?? '').localeCompare(a.createdat ?? ''));
  const context = anmeldungen.length === 0
    ? tx('Noch keine Anmeldungen — sobald sich jemand einträgt, siehst du es hier.')
    : missing.length > 0
      ? tx`Zuletzt hat sich ${namen(latest.slice(0, 2).map(a => a.fields.vorname ?? ''))} angemeldet. Beim Buffet fehlen noch: ${missing.join(', ')}.`
      : tx`Zuletzt hat sich ${namen(latest.slice(0, 2).map(a => a.fields.vorname ?? ''))} angemeldet. Das Buffet ist in allen Bereichen versorgt.`;

  const festDate = fest?.fields.datum
    ? format(parseISO(fest.fields.datum), 'PPPP, HH:mm', { locale: dateFnsLocale() })
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground mt-1">{context}</p>
        </div>
        <Button onClick={() => crud.anmeldungen.openCreate(fest ? { fest: fest.record_id } : {})}>
          <IconPlus size={16} className="shrink-0" />
          <span>{tx('Anmeldung erfassen')}</span>
        </Button>
      </div>

      <DashboardGrid
        variant="split"
        kpis={
          <StatCardRow>
            <StatCard
              title={tx('Angemeldete Personen')}
              value={personen}
              description={tx`${erwachsene} Erwachsene, ${kinder} Kinder`}
              icon={<IconUsers size={18} className="text-muted-foreground" />}
              tone="primary"
            />
            <StatCard
              title={tx('Anmeldungen')}
              value={anmeldungen.length}
              description={anmeldungen.length > 0 ? tx`Ø ${(personen / anmeldungen.length).toFixed(1)} Personen pro Anmeldung` : tx('Noch keine Anmeldung')}
              icon={<IconClipboardList size={18} className="text-muted-foreground" />}
            />
            <StatCard
              title={tx('Kinder')}
              value={kinder}
              description={tx`${mitKindern.length} Anmeldungen mit Kindern`}
              icon={<IconMoodKid size={18} className="text-muted-foreground" />}
              onClick={() => setOnlyKids(v => !v)}
              active={onlyKids}
            />
          </StatCardRow>
        }
        aside={
          <>
            <div className="rounded-[27px] bg-card shadow-lg p-5 overflow-hidden space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{tx('Das Fest')}</h2>
                {fest && (
                  <Button variant="ghost" size="sm" onClick={() => crud.festdetails.openEdit(fest)}>
                    <IconPencil size={14} className="shrink-0" />
                    <span>{tx('Bearbeiten')}</span>
                  </Button>
                )}
              </div>
              {fest ? (
                <button type="button" className="block w-full text-left min-w-0" onClick={() => crud.festdetails.openDetail(fest)}>
                  <p className="font-semibold truncate">{fest.fields.titel}</p>
                  {festDate && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <IconCalendarEvent size={14} className="shrink-0" />
                      <span className="truncate">{festDate}</span>
                    </p>
                  )}
                  {(fest.fields.ort || fest.fields.strasse) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <IconMapPin size={14} className="shrink-0" />
                      <span className="truncate">
                        {[[fest.fields.strasse, fest.fields.hausnummer].filter(Boolean).join(' '), [fest.fields.plz, fest.fields.ort].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                      </span>
                    </p>
                  )}
                </button>
              ) : (
                <Button variant="outline" onClick={() => crud.festdetails.openCreate({})}>
                  <IconPlus size={16} className="shrink-0" />
                  <span>{tx('Festdetails anlegen')}</span>
                </Button>
              )}
            </div>
            <WorkList
              title={onlyKids || sel ? tx('Anmeldungen (gefiltert)') : tx('Letzte Anmeldungen')}
              items={visible.map(a => ({
                id: a.record_id,
                title: personName(a),
                secondLine: (
                  <span className="text-muted-foreground">
                    {tx`${a.fields.anzahl_personen ?? 1} Personen`}
                    {a.fields.buffet_art ? ` · ${a.fields.buffet_art.label}` : ''}
                  </span>
                ),
              }))}
              onItemClick={id => {
                const rec = anmeldungen.find(a => a.record_id === id);
                if (rec) crud.anmeldungen.openDetail(rec);
              }}
              max={8}
              empty={{
                text: tx('Noch keine Anmeldungen in dieser Ansicht.'),
                action: { label: tx('Anmeldung erfassen'), onClick: () => crud.anmeldungen.openCreate(fest ? { fest: fest.record_id } : {}) },
              }}
            />
          </>
        }
        primary={
          <ChartWidget<EnrichedAnmeldungen>
            title={tx('Buffet-Beiträge nach Art')}
            rows={rows}
            dimension={{ kind: 'category', accessor: r => r.data.fields.buffet_art, label: tx('Art') }}
            interaction={{ mode: 'filter', selectedKey: sel?.key ?? null, onSelect: setSel }}
            footer={missing.length > 0 ? <>{tx`Es fehlen noch: ${missing.join(', ')}`}</> : <>{tx('Alle Bereiche sind abgedeckt')}</>}
          />
        }
      />
      {crud.surfaces}
    </div>
  );
}
