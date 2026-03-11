import { useRef, useCallback, ReactNode } from 'react';

interface DraggableScrollProps {
  children: ReactNode;
  className?: string;
}

const DRAG_THRESHOLD = 5;

export default function DraggableScroll({ children, className = '' }: DraggableScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const isDown = useRef(false);
  const hasDragged = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    isDown.current = true;
    hasDragged.current = false;
    startX.current = e.pageX;
    scrollLeftStart.current = el.scrollLeft;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDown.current || !ref.current) return;
    e.preventDefault();
    const dx = e.pageX - startX.current;
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      hasDragged.current = true;
    }
    ref.current.scrollLeft = scrollLeftStart.current - dx;
  }, []);

  const onMouseUpOrLeave = useCallback(() => {
    isDown.current = false;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = ref.current;
    if (!el) return;
    isDown.current = true;
    hasDragged.current = false;
    startX.current = e.touches[0].pageX;
    scrollLeftStart.current = el.scrollLeft;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDown.current || !ref.current) return;
    const dx = e.touches[0].pageX - startX.current;
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      hasDragged.current = true;
    }
    ref.current.scrollLeft = scrollLeftStart.current - dx;
  }, []);

  const onTouchEnd = useCallback(() => {
    isDown.current = false;
  }, []);

  // Only block click if user actually dragged
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUpOrLeave}
      onMouseLeave={onMouseUpOrLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
      className={`flex gap-2 overflow-x-auto hide-scrollbar pb-1 select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </div>
  );
}
