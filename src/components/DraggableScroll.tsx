import { useRef, useState, useCallback, ReactNode } from 'react';

interface DraggableScrollProps {
  children: ReactNode;
  className?: string;
}

export default function DraggableScroll({ children, className = '' }: DraggableScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    scrollLeft.current = el.scrollLeft;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !ref.current) return;
    const dx = e.clientX - startX.current;
    ref.current.scrollLeft = scrollLeft.current - dx;
  }, [isDragging]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    ref.current?.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`flex gap-2 overflow-x-auto hide-scrollbar pb-1 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </div>
  );
}
