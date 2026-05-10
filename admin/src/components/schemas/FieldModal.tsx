'use client';
import { useState, useEffect } from 'react';
import { FieldType, FieldDefinition } from '@research-cms/shared-types';
import { Modal } from '@/components/ui/Modal';
import { Button, TypeIcon } from '@/components/ui';
import { FieldTypeSelector } from './FieldTypeSelector';
import { FieldConfigForm } from './FieldConfigForm';

interface FieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: FieldDefinition) => void;
  existingField?: FieldDefinition;
  mode: 'create' | 'edit';
}

export function FieldModal({ isOpen, onClose, onSave, existingField, mode }: FieldModalProps) {
  const [step, setStep] = useState<'type-select' | 'config'>(existingField ? 'config' : 'type-select');
  const [selectedType, setSelectedType] = useState<FieldType | null>(existingField?.type || null);
  const [fieldData, setFieldData] = useState<Partial<FieldDefinition>>(existingField || {});

  // Sync state when modal opens or existingField changes
  useEffect(() => {
    if (isOpen) {
      setStep(existingField ? 'config' : 'type-select');
      setSelectedType(existingField?.type || null);
      setFieldData(existingField || {});
    }
  }, [isOpen, existingField]);

  const handleTypeSelect = (type: FieldType) => {
    setSelectedType(type);
    setStep('config');
  };

  const handleSave = () => {
    if (!fieldData.label?.trim() || !fieldData.name?.trim() || !selectedType) return;

    const field: FieldDefinition = {
      name: fieldData.name,
      label: fieldData.label,
      type: selectedType,
      required: fieldData.required ?? false,
      ...(fieldData.config && { config: fieldData.config }),
    };

    onSave(field);
    handleClose();
  };

  const handleClose = () => {
    setStep(existingField ? 'config' : 'type-select');
    setSelectedType(existingField?.type || null);
    setFieldData(existingField || {});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={
        <div className="flex items-center gap-2">
          {selectedType && step === 'config' && (
            <TypeIcon type={selectedType} className="w-5 h-5 text-primary" />
          )}
          <span>{mode === 'create' ? 'Add Field' : 'Edit Field'}</span>
        </div>
      }
      onClose={handleClose}
      size="lg"
      footer={
        <div className="grid gap-2 w-full grid-cols-3">
          {step === 'config' && mode === 'create' && (
            <Button variant="secondary" onClick={() => setStep('type-select')}>
              Back
            </Button>
          )}
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!fieldData.label || !fieldData.name || !selectedType}
          >
            {mode === 'create' ? 'Add Field' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      {step === 'type-select' && <FieldTypeSelector onSelect={handleTypeSelect} />}
      {step === 'config' && selectedType && (
        <FieldConfigForm
          type={selectedType}
          field={fieldData}
          onChange={updates => setFieldData(prev => ({ ...prev, ...updates }))}
          mode={mode}
        />
      )}
    </Modal>
  );
}

