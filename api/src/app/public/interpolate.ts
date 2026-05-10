export function interpolateString(str: string, data: Record<string, any>): string {
  return str.replace(/\{([^}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (data[trimmedKey] !== undefined && data[trimmedKey] !== null) {
      return String(data[trimmedKey]);
    }
    return match; // "leave it there" rule
  });
}

export function interpolateBlocks(blocks: any[], data: Record<string, any>): any[] {
  return blocks.map(block => {
    const newBlock = { ...block };

    for (const key of Object.keys(newBlock)) {
      if (typeof newBlock[key] === 'string' && key !== 'id' && key !== 'type') {
        newBlock[key] = interpolateString(newBlock[key], data);
      }
    }

    if (newBlock.type === 'row' && Array.isArray(newBlock.columns)) {
      newBlock.columns = newBlock.columns.map((col: any) => ({
        ...col,
        blocks: interpolateBlocks(col.blocks || [], data)
      }));
    } else if (['column', 'card'].includes(newBlock.type) && Array.isArray(newBlock.blocks)) {
      newBlock.blocks = interpolateBlocks(newBlock.blocks, data);
    }
    
    if (newBlock.config && typeof newBlock.config === 'object') {
       const newConfig = { ...newBlock.config };
       for (const key of Object.keys(newConfig)) {
         if (typeof newConfig[key] === 'string') {
            newConfig[key] = interpolateString(newConfig[key], data);
         }
       }
       newBlock.config = newConfig;
    }

    return newBlock;
  });
}
