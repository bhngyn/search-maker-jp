// Filetype chip — wraps a Google `filetype:<ext>` operator. Shape-wise it
// holds a dropdown of common extensions plus a delete button. No quote, no
// negate, no normalization.
//
// The list mirrors Google's officially indexable file formats (Search
// docs, "File types indexable by Google"). csv and mp3 are intentionally
// excluded — Google does not index their contents, so filetype:csv /
// filetype:mp3 only match by URL substring and mislead investigators.

import { t } from '../i18n/messages.js';

export const type = 'filetype';
export const label = 'engine.google.drawer.filetype.label';

// Extension labels are mostly script-neutral — only `none` and `txt` get
// localized. Everything else (PDF, Word, Excel, KML, …) reads identically
// in both languages, so we keep a literal label to keep this list compact.
export const FILETYPES = [
  { value: '',     labelKey: 'chip.filetype.opt.none' },
  { value: 'pdf',  label: 'PDF' },
  { value: 'doc',  label: 'Word (doc)' },
  { value: 'docx', label: 'Word (docx)' },
  { value: 'xls',  label: 'Excel (xls)' },
  { value: 'xlsx', label: 'Excel (xlsx)' },
  { value: 'ppt',  label: 'PowerPoint (ppt)' },
  { value: 'pptx', label: 'PowerPoint (pptx)' },
  { value: 'odt',  label: 'OpenDocument (odt)' },
  { value: 'ods',  label: 'OpenDocument (ods)' },
  { value: 'odp',  label: 'OpenDocument (odp)' },
  { value: 'rtf',  label: 'RTF' },
  { value: 'txt',  labelKey: 'chip.filetype.opt.txt' },
  { value: 'kml',  label: 'Google Earth (kml)' },
  { value: 'kmz',  label: 'Google Earth (kmz)' },
  { value: 'gpx',  label: 'GPS (gpx)' },
  { value: 'xml',  label: 'XML' },
  { value: 'svg',  label: 'SVG' },
];

export function defaultProps() {
  return { value: 'pdf' };
}

export function assemble(chip) {
  const v = (chip.props.value || '').trim();
  return v ? 'filetype:' + v : '';
}

export function render(chip, handlers) {
  const el = document.createElement('span');
  el.className = 'chip chip-filetype chip-wide';
  el.dataset.chipId = chip.id;

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'chip-delete-btn';
  del.setAttribute('aria-label', t('chip.filetype.deleteAria'));
  del.textContent = '×';
  del.addEventListener('click', (e) => { e.stopPropagation(); handlers.onDelete(); });

  const opBadge = document.createElement('span');
  opBadge.className = 'chip-op-badge';
  opBadge.dir = 'ltr';
  opBadge.textContent = 'filetype:';

  const select = document.createElement('select');
  select.className = 'chip-wide-select';
  select.setAttribute('aria-label', t('chip.filetype.selectAria'));
  FILETYPES.forEach(({ value, label, labelKey }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = labelKey ? t(labelKey) : label;
    if (value === chip.props.value) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', (e) => {
    if (handlers.onChangeProps) handlers.onChangeProps({ value: e.target.value });
  });
  select.addEventListener('click', (e) => e.stopPropagation());

  el.appendChild(del);
  el.appendChild(opBadge);
  el.appendChild(select);
  return el;
}
