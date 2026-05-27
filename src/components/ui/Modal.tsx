import React from 'react';
import { Modal as AntdModal } from 'antd';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const WIDTH_MAP: Record<string, number> = {
  'max-w-xs':  320,
  'max-w-sm':  420,
  'max-w-md':  480,
  'max-w-lg':  560,
  'max-w-xl':  640,
  'max-w-2xl': 720,
  'max-w-3xl': 800,
};

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-sm' }: ModalProps) {
  const width = WIDTH_MAP[maxWidth] ?? 420;

  return (
    <AntdModal
      open={isOpen}
      onCancel={onClose}
      title={title}
      footer={null}
      width={width}
      destroyOnHidden
      styles={{
        root: {
          background: 'var(--t-bg)',
          borderTop: '2.5px solid var(--t-accent)',
          padding: 0,
        },
        header: {
          background: 'var(--t-bg)',
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--t-line)',
          marginBottom: 0,
        },
        body: {
          padding: '20px',
          maxHeight: '75vh',
          overflowY: 'auto',
        },
      }}
    >
      {children}
    </AntdModal>
  );
}
