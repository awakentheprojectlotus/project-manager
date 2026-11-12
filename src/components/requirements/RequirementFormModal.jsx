import { useEffect, useState } from 'react';
import { Package, ShoppingCart } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input, { Field, Select, Textarea } from '../ui/Input';
import { useRequirementStore } from '../../stores/requirementStore';
import { useUiStore } from '../../stores/uiStore';
import { normalizeUrl } from '../../utils/links';
import { parseAmount, parseQuantity } from '../../utils/currency';

const emptyForm = {
  type: 'software',
  name: '',
  price: '',
  quantity: '1',
  shop: '',
  link: '',
  notes: '',
};

export default function RequirementFormModal({ open, projectId, requirement, currency, onClose }) {
  const addRequirement = useRequirementStore((s) => s.addRequirement);
  const updateRequirement = useRequirementStore((s) => s.updateRequirement);
  const pushToast = useUiStore((s) => s.pushToast);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (requirement) {
      setForm({
        type: requirement.type || 'software',
        name: requirement.name || '',
        price: String(requirement.price ?? ''),
        quantity: String(requirement.quantity ?? 1),
        shop: requirement.shop || '',
        link: requirement.link || '',
        notes: requirement.notes || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, requirement]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Give the item a name.');
      return;
    }
    const link = form.link.trim() ? normalizeUrl(form.link) : '';
    if (form.link.trim() && !link) {
      setError('Enter a valid purchase link (http or https).');
      return;
    }
    if (Number(form.price) < 0) {
      setError('Price cannot be negative.');
      return;
    }
    const payload = {
      projectId,
      type: form.type,
      name: form.name.trim(),
      price: parseAmount(form.price),
      quantity: parseQuantity(form.quantity),
      shop: form.shop.trim(),
      link: link || '',
      notes: form.notes.trim(),
    };
    if (requirement) {
      updateRequirement(requirement.id, payload);
      pushToast({
        type: 'success',
        title: 'Requirement updated',
        message: `'${payload.name}' was saved.`,
      });
    } else {
      addRequirement(payload);
      pushToast({
        type: 'success',
        title: 'Requirement added',
        message: `'${payload.name}' was added to the procurement list.`,
      });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={requirement ? 'Edit requirement' : 'Add requirement'}
      description="Track software or hardware the project needs to buy."
      icon={requirement?.type === 'hardware' ? ShoppingCart : Package}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="requirement-form">
            {requirement ? 'Save changes' : 'Add item'}
          </Button>
        </>
      }
    >
      <form id="requirement-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(event) => set('type', event.target.value)}
              options={[
                { value: 'software', label: 'Software' },
                { value: 'hardware', label: 'Hardware' },
              ]}
            />
          </Field>
          <Field label="Item name" required error={error}>
            <Input
              autoFocus
              value={form.name}
              onChange={(event) => {
                set('name', event.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Figma Professional, USB-C Hub"
            />
          </Field>
          <Field label={`Unit price (${currency})`}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => set('price', event.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label="Quantity">
            <Input
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={(event) => set('quantity', event.target.value)}
            />
          </Field>
          <Field label="Shop / vendor">
            <Input
              value={form.shop}
              onChange={(event) => set('shop', event.target.value)}
              placeholder="e.g. Amazon, Figma, local store"
            />
          </Field>
          <Field label="Link to buy" hint="Optional purchase URL.">
            <Input
              value={form.link}
              onChange={(event) => set('link', event.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(event) => set('notes', event.target.value)}
            placeholder="Specs, license terms, preferred model, etc."
          />
        </Field>
      </form>
    </Modal>
  );
}
