import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileJson, UploadCloud } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Field, Select, Textarea } from '../ui/Input';
import { useRequirementStore } from '../../stores/requirementStore';
import { useUiStore } from '../../stores/uiStore';
import { parseRequirementJson, SAMPLE_REQUIREMENT_JSON } from '../../utils/requirementImport';
import { formatCurrency } from '../../utils/currency';

export default function ImportRequirementsModal({ open, projectId, projectName, currency, onClose }) {
  const addMany = useRequirementStore((s) => s.addMany);
  const pushToast = useUiStore((s) => s.pushToast);
  const fileRef = useRef(null);

  const [text, setText] = useState('');
  const [defaultType, setDefaultType] = useState('software');
  const [fileName, setFileName] = useState('');

  const parsed = useMemo(
    () => parseRequirementJson(text, defaultType),
    [text, defaultType]
  );

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const content = await file.text();
      setText(content);
      setFileName(file.name);
    } catch {
      pushToast({ type: 'error', title: 'Could not read file' });
    }
  };

  const handleImport = () => {
    if (!parsed.items.length) return;
    const created = addMany(projectId, parsed.items);
    pushToast({
      type: 'success',
      title: 'Requirements imported',
      message: `${created.length} item${created.length === 1 ? '' : 's'} added to ${projectName}.`,
    });
    setText('');
    setFileName('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import requirements from JSON"
      description={`Add a software or hardware items list to ${projectName}.`}
      icon={FileJson}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" icon={UploadCloud} onClick={handleImport} disabled={!parsed.items.length}>
            Import {parsed.items.length || ''} {parsed.items.length === 1 ? 'item' : 'items'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted">
            Paste an array of items, or an object with <code className="text-ink">software</code> and{' '}
            <code className="text-ink">hardware</code> arrays.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setText(SAMPLE_REQUIREMENT_JSON);
                setFileName('');
              }}
            >
              Use sample
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={UploadCloud}
              onClick={() => fileRef.current?.click()}
            >
              Choose .json
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>

        {fileName && (
          <p className="flex items-center gap-1.5 rounded-lg bg-canvas px-2.5 py-1.5 text-[10.5px] text-muted">
            <FileJson className="h-3 w-3" />
            {fileName}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default type" hint="Used when an item has no type field.">
            <Select
              value={defaultType}
              onChange={(event) => setDefaultType(event.target.value)}
              options={[
                { value: 'software', label: 'Software' },
                { value: 'hardware', label: 'Hardware' },
              ]}
            />
          </Field>
          <div className="rounded-xl border border-edge bg-canvas/40 px-3 py-2 text-[10.5px] leading-relaxed text-muted">
            Supported keys: <span className="font-medium text-ink">name, type, price, quantity, shop, link, notes</span>.
            Aliases like <span className="font-medium text-ink">qty, cost, url, vendor</span> also work.
          </div>
        </div>

        <Field label="JSON">
          <Textarea
            rows={10}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setFileName('');
            }}
            placeholder={`[
  {
    "name": "Figma Professional",
    "type": "software",
    "price": 15,
    "quantity": 2,
    "shop": "Figma",
    "link": "https://www.figma.com/pricing"
  }
]`}
            className="font-mono text-[11px]"
            spellCheck={false}
          />
        </Field>

        {text.trim() && (
          <div className="space-y-2 rounded-xl border border-edge bg-canvas/40 p-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {parsed.items.length} valid item{parsed.items.length === 1 ? '' : 's'}
              </span>
              {parsed.errors.length > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {parsed.errors.length} warning{parsed.errors.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {parsed.items.length > 0 && (
              <ul className="space-y-1">
                {parsed.items.slice(0, 5).map((item, index) => (
                  <li key={`${item.name}-${index}`} className="flex items-center gap-2 text-[10.5px] text-muted">
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink ring-1 ring-inset ring-edge">
                      {item.type}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ink">{item.name}</span>
                    <span>
                      {item.quantity} × {formatCurrency(item.price, currency)}
                    </span>
                  </li>
                ))}
                {parsed.items.length > 5 && (
                  <li className="text-[10px] text-muted">+{parsed.items.length - 5} more…</li>
                )}
              </ul>
            )}

            {parsed.errors.length > 0 && (
              <ul className="space-y-0.5 border-t border-edge pt-2">
                {parsed.errors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-[10px] text-amber-700 dark:text-amber-300">
                    {error}
                  </li>
                ))}
                {parsed.errors.length > 5 && (
                  <li className="text-[10px] text-muted">+{parsed.errors.length - 5} more…</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
