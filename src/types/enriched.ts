import type { Anmeldungen } from './app';

export type EnrichedAnmeldungen = Anmeldungen & {
  festName: string;
};
