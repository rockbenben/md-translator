'use client';

import React, { useCallback } from 'react';
import Split from 'react-split';
import { useLocalStorage } from '@/app/hooks/useLocalStorage';

export interface SplitPaneContainerProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  storageKey?: string;
  defaultSizes?: [number, number];
  minSize?: number;
  gutterSize?: number;
  className?: string;
}

const STORAGE_KEY_DEFAULT = 'mdTranslatorSplitRatio';
const DEFAULT_SIZES: [number, number] = [50, 50];

export default function SplitPaneContainer({
  leftPanel,
  rightPanel,
  storageKey = STORAGE_KEY_DEFAULT,
  defaultSizes = DEFAULT_SIZES,
  minSize = 100,
  gutterSize = 8,
  className = '',
}: SplitPaneContainerProps) {
  // 使用 useLocalStorage 持久化分屏比例
  const [sizes, setSizes] = useLocalStorage<[number, number]>(storageKey, defaultSizes);

  // 拖拽结束时的回调，用于保存用户调整后的比例
  const handleDragEnd = useCallback(
    (newSizes: number[]) => {
      setSizes(newSizes as [number, number]);
    },
    [setSizes]
  );

  return (
    <Split
      className={`split-pane-container split-horizontal h-full w-full ${className}`}
      sizes={sizes}
      minSize={minSize}
      gutterSize={gutterSize}
      direction="horizontal"
      cursor="col-resize"
      onDragEnd={handleDragEnd}
      gutterStyle={(dimension, gutterSize, index) => ({
        [dimension === 'width' ? 'height' : 'width']: '100%',
        [dimension === 'width' ? 'width' : 'height']: `${gutterSize}px`,
        cursor: 'col-resize',
        backgroundColor: 'var(--color-border)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })}
      elementStyle={(dimension, elementSize, gutterSize, index) => ({
        [dimension === 'width' ? 'height' : 'width']: '100%',
        [dimension]: `${elementSize}%`,
        overflow: 'hidden',
      })}
    >
      {leftPanel}
      {rightPanel}
    </Split>
  );
}
