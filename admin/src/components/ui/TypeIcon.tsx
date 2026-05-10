import React from 'react';
import {
  FiType,
  FiAlignLeft,
  FiFileText,
  FiMail,
  FiGlobe,
  FiHash,
  FiCalendar,
  FiClock,
  FiToggleRight,
  FiImage,
  FiList,
  FiTag,
  FiLink,
  FiGrid,
  FiMinus,
  FiMaximize,
  FiMousePointer,
  FiLayers,
  FiFile,
  FiMenu,
  FiMoreVertical,
  FiSquare,
  FiHelpCircle
} from 'react-icons/fi';

export interface TypeIconProps {
  type: string;
  className?: string;
}

export function TypeIcon({ type, className = '' }: TypeIconProps) {
  const Icon = getIconForType(type);
  return <Icon className={className} />;
}

function getIconForType(type: string) {
  switch (type) {
    case 'text':
    case 'heading':
      return FiType;
    case 'textarea':
      return FiAlignLeft;
    case 'richtext':
      return FiFileText;
    case 'email':
      return FiMail;
    case 'url':
      return FiGlobe;
    case 'number':
      return FiHash;
    case 'date':
      return FiCalendar;
    case 'datetime':
      return FiClock;
    case 'boolean':
      return FiToggleRight;
    case 'media':
    case 'image':
      return FiImage;
    case 'select':
      return FiList;
    case 'tags':
    case 'field':
      return FiTag;
    case 'reference':
    case 'references':
      return FiLink;
    case 'blocks':
      return FiGrid;
    case 'divider':
      return FiMinus;
    case 'spacer':
      return FiMaximize;
    case 'button':
      return FiMousePointer;
    case 'archive':
      return FiLayers;
    case 'entry':
      return FiFile;
    case 'row':
      return FiMenu;
    case 'column':
      return FiMoreVertical;
    case 'card':
      return FiSquare;
    default:
      return FiHelpCircle;
  }
}
