import { useMemo, useState } from 'react';
import {
  Code2,
  Cpu,
  ExternalLink,
  FileJson,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Tabs from '../ui/Tabs';
import EmptyState from '../ui/EmptyState';
import Dropdown from '../ui/Dropdown';
import { Select } from '../ui/Input';
import { useUiStore } from '../../stores/uiStore';
import { useRequirementStore } from '../../stores/requirementStore';
import { CURRENCIES, formatCurrency } from '../../utils/currency';
import { normalize } from '../../utils/match';
import RequirementFormModal from './RequirementFormModal';
import ImportRequirementsModal from './ImportRequirementsModal';

const TYPE_META = {
  software: {
    label: 'Software',
    icon: Code2,
    badge: 'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300',
  },
  hardware: {
    label: 'Hardware',
    icon: Cpu,
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
  },
};

export default function RequirementsTab({ project, requirements }) {
  const updatePrefs = useUiStore((s) => s.updatePrefs);
  const prefs = useUiStore((s) => s.prefs);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);
  const removeRequirement = useRequirementStore((s) => s.removeRequirement);

  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const currency = prefs.currency || 'USD';

  const counts = {
    all: requirements.length,
    software: requirements.filter((item) => item.type === 'software').length,
    hardware: requirements.filter((item) => item.type === 'hardware').length,
  };

  const visible = useMemo(() => {
    const query = normalize(search);
    return requirements.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (query && !normalize(`${item.name} ${item.shop} ${item.notes}`).includes(query)) return false;
      return true;
    });
  }, [requirements, typeFilter, search]);

  const totals = useMemo(() => {
    const software = requirements
      .filter((item) => item.type === 'software')
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    const hardware = requirements
      .filter((item) => item.type === 'hardware')
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { software, hardware, total: software + hardware };
  }, [requirements]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (requirement) => {
    setEditing(requirement);
    setFormOpen(true);
  };

  const handleDelete = async (requirement) => {
    const ok = await confirm({
      title: 'Remove this requirement?',
      description: `'${requirement.name}' will be removed from the ${project.name} procurement list.`,
      confirmLabel: 'Remove item',
    });
    if (!ok) return;
    removeRequirement(requirement.id);
    pushToast({ type: 'info', title: 'Requirement removed', message: `'${requirement.name}' was removed.` });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShoppingCart className="h-4 w-4 text-muted" />
            Requirements & procurement
          </h2>
          <p className="mt-0.5 text-[11.5px] text-muted">
            Software and hardware items needed for {project.name}, with prices, quantities, shops and purchase links.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={FileJson} onClick={() => setImportOpen(true)}>
            Import JSON
          </Button>
          <Button size="sm" icon={Plus} onClick={openAdd}>
            Add item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Items', value: counts.all, hint: `${counts.software} software · ${counts.hardware} hardware` },
          { label: 'Software cost', value: formatCurrency(totals.software, currency), hint: `${counts.software} items` },
          { label: 'Hardware cost', value: formatCurrency(totals.hardware, currency), hint: `${counts.hardware} items` },
          { label: 'Total procurement', value: formatCurrency(totals.total, currency), hint: `${counts.all} items` },
        ].map((item) => (
          <Card key={item.label} className="p-3.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{item.label}</p>
            <p className="mt-1.5 truncate text-lg font-bold leading-none text-ink">{item.value}</p>
            <p className="mt-1 truncate text-[10px] text-muted">{item.hint}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Tabs
          tabs={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'software', label: 'Software', count: counts.software },
            { value: 'hardware', label: 'Hardware', count: counts.hardware },
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
          className="self-start"
        />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Input
              icon={Search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search items or shops…"
              aria-label="Search requirements"
            />
          </div>
          <Select
            value={currency}
            onChange={(event) => updatePrefs({ currency: event.target.value })}
            className="min-w-[150px] sm:w-[190px]"
            options={CURRENCIES}
            aria-label="Currency"
          />
        </div>
      </div>

      {requirements.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No requirements yet"
          description="Add software and hardware items manually, or import a JSON list with prices, quantities, shops and links."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" icon={Plus} onClick={openAdd}>
                Add item
              </Button>
              <Button variant="secondary" size="sm" icon={FileJson} onClick={() => setImportOpen(true)}>
                Import JSON
              </Button>
            </div>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon={Search}
          title="No items match your filters"
          description="Try another search or change the type filter."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-edge bg-canvas/50">
                  <th className="table-head px-4 py-2.5">Item</th>
                  <th className="table-head px-3 py-2.5">Type</th>
                  <th className="table-head px-3 py-2.5">Shop</th>
                  <th className="table-head px-3 py-2.5">Unit price</th>
                  <th className="table-head px-3 py-2.5">Qty</th>
                  <th className="table-head px-3 py-2.5">Total</th>
                  <th className="table-head px-3 py-2.5">Buy</th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {visible.map((requirement) => {
                  const meta = TYPE_META[requirement.type] || TYPE_META.software;
                  const Icon = meta.icon;
                  return (
                    <tr key={requirement.id} className="group transition hover:bg-canvas/40">
                      <td className="max-w-[280px] px-4 py-2.5">
                        <button type="button" onClick={() => openEdit(requirement)} className="block max-w-full text-left">
                          <span className="block truncate text-[13px] font-medium text-ink">{requirement.name}</span>
                          {requirement.notes && (
                            <span className="mt-0.5 block truncate text-[10.5px] text-muted">{requirement.notes}</span>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                            meta.badge
                          )}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="max-w-[150px] px-3 py-2.5">
                        <span className="block truncate text-[11.5px] text-muted">
                          {requirement.shop || '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11.5px] text-muted">
                        {formatCurrency(requirement.price, currency)}
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-muted">{requirement.quantity}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11.5px] font-semibold text-ink">
                        {formatCurrency(requirement.price * requirement.quantity, currency)}
                      </td>
                      <td className="px-3 py-2.5">
                        {requirement.link ? (
                          <a
                            href={requirement.link}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-[10.5px] font-medium text-brand-600 hover:underline dark:text-brand-400"
                          >
                            Buy
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Dropdown
                          label={`Actions for ${requirement.name}`}
                          trigger={
                            <span className="grid h-7 w-7 place-items-center rounded-lg text-muted opacity-70 transition hover:bg-elevated hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </span>
                          }
                          items={[
                            { label: 'Edit item', icon: Pencil, onClick: () => openEdit(requirement) },
                            { separator: true },
                            {
                              label: 'Remove item',
                              icon: Trash2,
                              danger: true,
                              onClick: () => handleDelete(requirement),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <RequirementFormModal
        open={formOpen}
        projectId={project.id}
        requirement={editing}
        currency={currency}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <ImportRequirementsModal
        open={importOpen}
        projectId={project.id}
        projectName={project.name}
        currency={currency}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
