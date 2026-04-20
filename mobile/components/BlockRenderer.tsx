import { useCallback, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image, Linking,
  StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Block, HeadingBlock, TextBlock, ArchiveBlock, DividerBlock, SpacerBlock,
  ImageBlock, ButtonBlock, RowBlock, ColumnBlock, CardBlock, FieldBlock, EntryBlock,
  ButtonAction,
  Spacing,
  PublicEntryResponse,
} from '@research-cms/shared-types';
import { Block as FieldBlockComponent } from '@/components/Block';
import { C } from '@/lib/theme';
import { listEntries, getEntry, getMedia, type MediaEntry } from '@/lib/api';

// ── Static Block Renderers ─────────────────────────────────────────────────────

function HeadingBlockRenderer({ block }: { block: HeadingBlock }) {
  const style = [
    s.heading,
    block.level === 1 && s.h1,
    block.level === 2 && s.h2,
    block.level === 3 && s.h3,
    block.level === 4 && s.h4,
    block.align === 'center' && s.textCenter,
    block.align === 'right' && s.textRight,
    block.color && { color: block.color },
    block.fontWeight === 'semibold' && { fontWeight: '600' as const },
    block.fontWeight === 'bold' && { fontWeight: '700' as const },
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ];
  return (
    <Text 
      style={style}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={`Heading level ${block.level || 1}: ${block.text}`}
    >
      {block.text}
    </Text>
  );
}

function TextBlockRenderer({ block }: { block: TextBlock }) {
  const style = [
    s.text,
    block.align === 'center' && s.textCenter,
    block.align === 'right' && s.textRight,
    block.align === 'justify' && s.textJustify,
    block.color && { color: block.color },
    block.fontSize === 'sm' && s.textSm,
    block.fontSize === 'lg' && s.textLg,
    block.fontSize === 'xl' && s.textXl,
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ];
  return <Text style={style}>{block.content}</Text>;
}

function DividerBlockRenderer({ block }: { block: DividerBlock }) {
  const style = [
    s.divider,
    {
      borderColor: block.color ?? '#e5e7eb',
      borderWidth: block.thickness ?? 1,
      borderStyle: (block.style ?? 'solid') as 'solid' | 'dashed' | 'dotted',
    },
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ];
  return <View style={style} />;
}

function SpacerBlockRenderer({ block }: { block: SpacerBlock }) {
  return (
    <View style={[
      { height: block.height },
      block.padding && getPaddingStyle(block.padding),
      block.margin && getMarginStyle(block.margin),
    ]} />
  );
}

function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  const [media, setMedia] = useState<any>(null);
  const [loading, setLoading] = useState(block.mediaId ? true : false);

  const handleImagePress = useCallback(() => {
    if (block.linkUrl) {
      Linking.openURL(block.linkUrl);
    }
  }, [block.linkUrl]);

  // Fetch media if mediaId is present
  useEffect(() => {
    if (!block.mediaId) return;
    (async () => {
      try {
        const entry = await getMedia(block.mediaId);
        // Extract media fields from entry data (API returns PublicEntryResponse)
        const mediaData = {
          _id: entry._id,
          url: (entry.data as any)?.url,
          mimeType: (entry.data as any)?.mimeType,
          title: (entry.data as any)?.title,
          caption: (entry.data as any)?.caption,
          altText: (entry.data as any)?.altText,
        };
        console.log('[Media] Loaded:', mediaData);
        setMedia(mediaData);
      } catch (e) {
        console.error('Failed to load media:', e);
        setMedia(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [block.mediaId]);

  // Use pre-resolved media if available, otherwise use fetched media
  const resolvedMedia = block.media || media;

  if (loading) {
    return (
      <View style={[s.image, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.accent} size="small" />
      </View>
    );
  }

  if (!resolvedMedia?.url) {
    return <Text style={s.textMuted}>— Image not available</Text>;
  }

  const imageStyle = [
    s.image,
    block.width === 'full' && s.fullWidth,
    block.height && { height: block.height },
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ].filter(Boolean) as (typeof s.image | typeof s.fullWidth | Record<string, number | undefined>)[];

  const imageContent = (
    <Image
      source={{ uri: resolvedMedia.url }}
      style={imageStyle}
      resizeMode={block.fit === 'cover' ? 'cover' : block.fit === 'contain' ? 'contain' : 'stretch'}
      accessibilityLabel={block.alt || resolvedMedia.altText || resolvedMedia.title || ''}
    />
  );

  if (block.linkUrl) {
    return (
      <TouchableOpacity onPress={handleImagePress}>
        {imageContent}
        {resolvedMedia.caption ? <Text style={s.caption}>{resolvedMedia.caption}</Text> : null}
      </TouchableOpacity>
    );
  }

  return (
    <View>
      {imageContent}
      {resolvedMedia.caption ? <Text style={s.caption}>{resolvedMedia.caption}</Text> : null}
    </View>
  );
}

function ButtonBlockRenderer({ block }: { block: ButtonBlock }) {
  const handlePress = useCallback(() => {
    handleButtonAction(block.action);
  }, [block.action]);

  const buttonStyle = [
    s.button,
    getButtonVariantStyle(block.variant),
    block.align === 'center' && s.buttonCenter,
    block.align === 'right' && s.buttonRight,
    block.align === 'full' && s.buttonFull,
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={s.buttonText}>{block.label}</Text>
    </TouchableOpacity>
  );
}

// ── Content Block Renderers ────────────────────────────────────────────────────

function FieldBlockRenderer({ block, entryData }: { block: FieldBlock; entryData?: Record<string, any> }) {
  const [resolvedValue, setResolvedValue] = useState<any>(null);
  const [loading, setLoading] = useState(
    (block.fieldType === 'media' || block.fieldType === 'reference' || block.fieldType === 'references') && entryData
      ? true
      : false
  );

  const containerStyle = [
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ];

  // Get the field value from entry data
  const fieldValue = entryData ? entryData[block.fieldName] : undefined;

  // Resolve media and reference fields
  useEffect(() => {
    if (!fieldValue) {
      setResolvedValue(fieldValue);
      setLoading(false);
      return;
    }

    // For media fields, resolve the ID to full media object
    if (block.fieldType === 'media') {
      // If it's already a media object, don't need to fetch
      if (typeof fieldValue === 'object' && fieldValue.url) {
        setResolvedValue(fieldValue);
        setLoading(false);
        return;
      }

      // If it's a string ID, fetch the media
      if (typeof fieldValue === 'string') {
        (async () => {
          try {
            const entry = await getMedia(fieldValue);
            const mediaData = {
              _id: entry._id,
              url: (entry.data as any)?.url,
              mimeType: (entry.data as any)?.mimeType,
              title: (entry.data as any)?.title,
              caption: (entry.data as any)?.caption,
              altText: (entry.data as any)?.altText,
            };
            setResolvedValue(mediaData);
          } catch (e) {
            console.error('[FieldBlock] Failed to resolve media:', e);
            setResolvedValue(null);
          } finally {
            setLoading(false);
          }
        })();
      }
      return;
    }

    // For reference field (single), resolve the ID to entry object
    if (block.fieldType === 'reference' && typeof fieldValue === 'string') {
      (async () => {
        try {
          // Try to infer schema from fieldName (e.g., 'category' field -> 'category' schema)
          const schemaSlug = (block as any).targetSlug || block.fieldName;
          const entry = await getEntry(schemaSlug, fieldValue);
          // Transform to have title/name at top level for Block component
          const resolved = {
            _id: entry._id,
            title: (entry.data as any)?.title || (entry.data as any)?.name,
            name: (entry.data as any)?.name,
          };
          setResolvedValue(resolved);
        } catch (e) {
          console.error('[FieldBlock] Failed to resolve reference:', e);
          setResolvedValue({ _id: fieldValue }); // Fallback to ID object
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    // For references field (multiple), resolve each ID to entry object
    if (block.fieldType === 'references' && Array.isArray(fieldValue)) {
      (async () => {
        try {
          const schemaSlug = (block as any).targetSlug || block.fieldName;
          const resolved = await Promise.all(
            fieldValue.map(async (id) => {
              try {
                const entry = await getEntry(schemaSlug, id);
                return {
                  _id: entry._id,
                  title: (entry.data as any)?.title || (entry.data as any)?.name,
                  name: (entry.data as any)?.name,
                };
              } catch {
                return { _id: id }; // Fallback to ID object
              }
            })
          );
          setResolvedValue(resolved);
        } catch (e) {
          console.error('[FieldBlock] Failed to resolve references:', e);
          setResolvedValue(fieldValue.map((id) => ({ _id: id })));
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    // For other field types, use value as-is
    setResolvedValue(fieldValue);
    setLoading(false);
  }, [block.fieldType, block.fieldName, fieldValue]);

  console.log('[FieldBlock]', block.fieldName, {
    hasEntryData: !!entryData,
    fieldValue,
    resolvedValue,
    fieldType: block.fieldType,
    loading,
  });

  if (loading) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator color={C.accent} size="small" />
      </View>
    );
  }

  // Create a resolved FieldBlock with the value for rendering
  const resolvedBlock: FieldBlock = {
    ...block,
    value: resolvedValue ?? null,
  };

  return (
    <View style={containerStyle}>
      {block.showLabel && block.labelPosition !== 'hidden' && (
        <Text style={[
          s.fieldLabel,
          block.labelPosition === 'inline' && s.fieldLabelInline,
        ]}>
          {block.label}
        </Text>
      )}
      <FieldBlockComponent block={resolvedBlock} />
    </View>
  );
}

function ArchiveBlockRenderer({ block }: { block: ArchiveBlock }) {
  const [items, setItems] = useState<PublicEntryResponse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await listEntries(block.schemaSlug, 1, 50);
      setItems(result.items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [block.schemaSlug]);

  useEffect(() => { 
    load(); 
  }, [load]);

  if (loading) {
    return (
      <View style={[s.archiveBlock, { justifyContent: 'center', alignItems: 'center', height: 100 }]}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (error || !items || items.length === 0) {
    return (
      <View style={[
        s.archiveBlock,
        block.padding && getPaddingStyle(block.padding),
        block.margin && getMarginStyle(block.margin),
      ]}>
        <Text style={s.empty}>{block.emptyMessage ?? 'No items found'}</Text>
      </View>
    );
  }

  const containerStyle = [
    s.archiveBlock,
    block.backgroundColor && { backgroundColor: block.backgroundColor },
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ];

  if (block.layout === 'grid') {
    return (
      <View style={containerStyle}>
        {block.title && <Text style={s.archiveTitle}>{block.title}</Text>}
        <FlatList
          scrollEnabled={false}
          data={items}
          numColumns={block.columns ?? 1}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.gridItem}
              onPress={() => router.push(`/${item.schemaSlug}/${item._id}`)}
            >
              <Text style={s.archiveCardTitle}>{(item.data as any)?.title || (item.data as any)?.name || item.schemaSlug}</Text>
              <Text style={s.archiveCardSub}>{item._id.slice(0, 8)}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(_, i) => String(i)}
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {block.title && <Text style={s.archiveTitle}>{block.title}</Text>}
      {items.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={s.archiveCard}
          onPress={() => router.push(`/${item.schemaSlug}/${item._id}`)}
        >
          <Text style={s.archiveCardTitle}>{item.schemaSlug}</Text>
          <Text style={s.archiveCardSub}>ID: {item._id.slice(0, 12)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function EntryBlockRenderer({ block }: { block: EntryBlock }) {
  const [entry, setEntry] = useState<PublicEntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getEntry(block.schemaSlug, block.entryId);
      setEntry(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [block.schemaSlug, block.entryId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={[{ justifyContent: 'center', alignItems: 'center', height: 100 }]}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (error || !entry) {
    return (
      <Text style={[s.textMuted, block.padding && getPaddingStyle(block.padding)]}>
        — {error || 'Entry not found'}
      </Text>
    );
  }

  const containerStyle = [
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ];

  // For pages, blocks are in data.blocks; for other entries, they're at top level (if any)
  const blocks = (entry.data as any)?.blocks || entry.blocks || [];

  return (
    <View style={containerStyle}>
      {blocks.map((b: Block, i: number) => (
        <BlockRenderer key={i} block={b} entryData={entry.data as Record<string, any>} />
      ))}
    </View>
  );
}

// ── Layout Block Renderers ────────────────────────────────────────────────────

function RowBlockRenderer({ block, entryData }: { block: RowBlock; entryData?: Record<string, any> }) {
  const containerStyle = [
    s.row,
    {
      gap: block.gap ?? 8,
      justifyContent: getJustifyContent(block.align),
    },
    block.backgroundColor && { backgroundColor: block.backgroundColor },
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ];

  return (
    <View style={containerStyle}>
      {block.columns.map((col, i) => (
        <View
          key={i}
          style={[
            {
              flex: col.width === 'auto' ? undefined : 1,
              width: typeof col.width === 'number' ? col.width : undefined,
              justifyContent: 'flex-start',
            },
          ]}
        >
          {col.blocks.map((b, j) => (
            <BlockRenderer key={j} block={b} entryData={entryData} />
          ))}
        </View>
      ))}
    </View>
  );
}

function ColumnBlockRenderer({ block, entryData }: { block: ColumnBlock; entryData?: Record<string, any> }) {
  const containerStyle = [
    {
      flex: block.width === 'auto' ? undefined : 1,
      width: typeof block.width === 'number' ? block.width : undefined,
    },
    block.backgroundColor && { backgroundColor: block.backgroundColor },
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ];

  return (
    <View style={containerStyle}>
      {block.blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} entryData={entryData} />
      ))}
    </View>
  );
}

function CardBlockRenderer({ block, entryData }: { block: CardBlock; entryData?: Record<string, any> }) {
  const cardStyle = [
    s.card,
    {
      elevation: block.elevation ?? 2,
      backgroundColor: block.backgroundColor ?? '#fff',
    },
    block.padding && getPaddingStyle(block.padding),
    block.margin && getMarginStyle(block.margin),
  ];

  const cardContent = (
    <View style={cardStyle}>
      {block.blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} entryData={entryData} />
      ))}
    </View>
  );

  if (block.pressAction) {
    return (
      <TouchableOpacity
        onPress={() => block.pressAction && handleButtonAction(block.pressAction)}
        activeOpacity={0.7}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

// ── Main Block Renderer ────────────────────────────────────────────────────────

export function BlockRenderer({ block, entryData }: { block: Block; entryData?: Record<string, any> }) {
  // Skip invisible blocks (default to visible if not specified)
  if (block.visible === false) {
    return null;
  }

  // Apply global visibility (responsive)
  // TODO: Detect device type and check hideOn
  
  // Apply animation
  // TODO: Implement animation entrance effects

  switch (block.type) {
    case 'heading':
      return <HeadingBlockRenderer block={block} />;

    case 'text':
      return <TextBlockRenderer block={block} />;

    case 'divider':
      return <DividerBlockRenderer block={block} />;

    case 'spacer':
      return <SpacerBlockRenderer block={block} />;

    case 'image':
      return <ImageBlockRenderer block={block} />;

    case 'button':
      return <ButtonBlockRenderer block={block} />;

    case 'field':
      return <FieldBlockRenderer block={block} entryData={entryData} />;

    case 'archive':
      return <ArchiveBlockRenderer block={block} />;

    case 'entry':
      return <EntryBlockRenderer block={block} />;

    case 'row':
      return <RowBlockRenderer block={block} entryData={entryData} />;

    case 'column':
      return <ColumnBlockRenderer block={block} entryData={entryData} />;

    case 'card':
      return <CardBlockRenderer block={block} entryData={entryData} />;

    default:
      return null;
  }
}

// ── Helper Functions ───────────────────────────────────────────────────────────

function handleButtonAction(action: ButtonAction) {
  switch (action.type) {
    case 'navigate':
      router.push(`/pages/${action.pageSlug}` as never);
      break;
    case 'url':
      Linking.openURL(action.url);
      break;
    case 'schema':
      router.push(`/${action.schemaSlug}` as never);
      break;
    case 'entry':
      router.push(`/${action.schemaSlug}/${action.entryId}` as never);
      break;
    default: {
      const _exhaustive: never = action;
      console.error(`Unhandled action type: ${_exhaustive}`);
    }
  }
}

function getButtonVariantStyle(variant?: string) {
  const variants = {
    primary: s.buttonPrimary,
    secondary: s.buttonSecondary,
    outline: s.buttonOutline,
    ghost: s.buttonGhost,
  } as const;
  return variants[variant as keyof typeof variants] ?? s.buttonPrimary;
}

function getJustifyContent(align?: string) {
  const alignMap: Record<string, 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'space-around',
  };
  return alignMap[align ?? 'start'];
}

function getPaddingStyle(padding?: Spacing) {
  return {
    paddingTop: padding?.top,
    paddingRight: padding?.right,
    paddingBottom: padding?.bottom,
    paddingLeft: padding?.left,
  };
}

function getMarginStyle(margin?: Spacing) {
  return {
    marginTop: margin?.top,
    marginRight: margin?.right,
    marginBottom: margin?.bottom,
    marginLeft: margin?.left,
  };
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Text alignment
  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },
  textJustify: { textAlign: 'justify' },
  
  // Headings
  heading: { fontWeight: '700', color: C.text, marginBottom: 12 },
  h1: { fontSize: 32 },
  h2: { fontSize: 28 },
  h3: { fontSize: 24 },
  h4: { fontSize: 20 },
  
  // Text
  text: { fontSize: 16, color: C.text, lineHeight: 24, marginBottom: 16 },
  textSm: { fontSize: 14 },
  textLg: { fontSize: 18 },
  textXl: { fontSize: 20 },
  
  // Divider
  divider: { marginVertical: 12 },
  
  // Image
  image: { width: '100%', height: 200, marginVertical: 8 },
  fullWidth: { width: '100%' },
  caption: { fontSize: 13, color: C.subText, marginTop: 6, fontStyle: 'italic' },
  
  // Button
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: C.accent,
  },
  buttonSecondary: {
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.accent,
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: C.accent,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonCenter: { alignSelf: 'center' },
  buttonRight: { alignSelf: 'flex-end' },
  buttonFull: { alignSelf: 'stretch' },
  
  // Field
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.subText, marginBottom: 4 },
  fieldLabelInline: { marginRight: 8 },
  
  // Archive
  archiveBlock: { marginVertical: 16 },
  archiveTitle: { fontSize: 18, fontWeight: '600', color: C.text, marginBottom: 12 },
  archiveCard: { padding: 12, marginBottom: 8, backgroundColor: C.cardBg, borderRadius: 4 },
  archiveCardTitle: { fontSize: 15, fontWeight: '600', color: C.text },
  archiveCardSub: { fontSize: 12, color: C.subText, marginTop: 4 },
  listItem: { marginBottom: 16 },
  gridItem: { flex: 1, margin: 4 },
  
  // Card
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  
  // Row/Column
  row: { flexDirection: 'row', flex: 1 },
  
  // Utility
  empty: { fontSize: 14, color: C.subText, textAlign: 'center', marginVertical: 16 },
  textMuted: { fontSize: 14, color: C.subText },
});
