import { useRef, useState, useCallback, ReactNode } from 'react';

interface DraggableScrollProps {
  children: ReactNode;
  className?: string;
}

const DRAG_THRESHOLD = 5;

export default function DraggableScroll({ children, className = '' }: DraggableScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const pointerId = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    pointerId.current = e.pointerId;
    el.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    scrollLeft.current = el.scrollLeft;
    hasDragged.current = false;
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !ref.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      hasDragged.current = true;
    }
    ref.current.scrollLeft = scrollLeft.current - dx;
  }, [isDragging]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    ref.current?.releasePointerCapture(e.pointerId);
    pointerId.current = null;
  }, []);

  // Block click events on children when a drag occurred
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      className={`flex gap-2 overflow-x-auto hide-scrollbar pb-1 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </div>
  );
}
