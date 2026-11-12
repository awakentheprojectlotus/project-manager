import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { useUiStore } from '../../stores/uiStore';

export default function ConfirmHost() {
  const dialog = useUiStore((s) => s.confirmDialog);
  const resolve = useUiStore((s) => s.resolveConfirm);

  if (!dialog) return null;

  return (
    <Modal
      open={Boolean(dialog)}
      onClose={() => resolve(false)}
      title={dialog.title}
      description={dialog.description}
      size="sm"
      icon={AlertTriangle}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => resolve(false)}>
            {dialog.cancelLabel}
          </Button>
          <Button variant="danger" size="sm" onClick={() => resolve(true)}>
            {dialog.confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">
        This action will be applied immediately. It cannot be undone unless you restore a backup
        from Settings.
      </p>
    </Modal>
  );
}
