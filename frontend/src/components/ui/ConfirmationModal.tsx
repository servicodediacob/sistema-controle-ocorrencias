import { ReactNode } from 'react';
import { Button } from './Button';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal = ({
  isOpen,
  title = 'Confirmar ação',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
    footer={
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Processando...' : confirmLabel}
        </Button>
      </div>
    }
    widthClass="max-w-lg"
  >
    <p className="text-text">{message}</p>
  </Modal>
);

export default ConfirmationModal;
