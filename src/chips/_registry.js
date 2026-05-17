// Single source of truth for chip types. Adding a new chip type means
// writing one new file in this directory and adding it to the map below.
//
// Each chip module must export:
//   - type: string (matches the key in this map)
//   - label: string (Arabic display name for menus / drawer)
//   - defaultProps(): object
//   - assemble(chip, ctx): string
//   - render(chip, handlers): HTMLElement

import * as keyword from './keyword.js';
import * as orConnector from './or-connector.js';
import * as filetype from './filetype.js';
import * as dateRange from './date-range.js';
import * as proximity from './proximity.js';
import * as numberRange from './number-range.js';
import * as filter from './filter.js';
import * as engagement from './engagement.js';

export const chipTypes = {
  keyword,
  'or-connector': orConnector,
  filetype,
  'date-range': dateRange,
  proximity,
  'number-range': numberRange,
  filter,
  engagement,
};

/**
 * Term-chip types — those that can stand alone as user content. Used by the
 * "+ إضافة" drawer to list addable types and by chip-state's connector
 * cleanup to identify what counts as a term. Whether a given type is
 * actually offered in the drawer is gated by the active engine's
 * `addableChipTypes`.
 */
export const termChipTypes = ['keyword', 'filetype', 'date-range', 'proximity', 'number-range', 'filter', 'engagement'];
