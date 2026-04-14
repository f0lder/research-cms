import { ComponentType, SVGProps } from 'react';
import {
  MdTitle,
  MdEdit,
  MdDragIndicator,
  MdDelete,
  MdClose,
  MdExpandMore,
  MdChevronRight,
  MdImage,
  MdSmartButton,
  MdViewAgenda,
  MdArticle,
  MdChecklistRtl,
  MdGridOn,
  MdViewColumn,
  MdRectangle,
} from 'react-icons/md';
import { FiMinus } from 'react-icons/fi';

/**
 * Icon mapping for different block types and UI actions
 */
export const blockIcons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  // Block type icons
  heading: MdTitle,
  text: MdEdit,
  divider: FiMinus,
  spacer: MdExpandMore,
  image: MdImage,
  button: MdSmartButton,
  archive: MdViewAgenda,
  entry: MdArticle,
  field: MdChecklistRtl,
  row: MdGridOn,
  column: MdViewColumn,
  card: MdRectangle,

  // UI action icons
  drag: MdDragIndicator,
  delete: MdDelete,
  close: MdClose,
  expandMore: MdExpandMore,
  chevronRight: MdChevronRight,
};

export function getBlockIcon(blockType: string): ComponentType<SVGProps<SVGSVGElement>> | null {
  return blockIcons[blockType] || null;
}
