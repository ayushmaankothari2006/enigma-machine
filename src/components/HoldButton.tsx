import React, { useRef, useCallback, useEffect } from 'react';

interface HoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onStep: () => void;
  stepInterval?: number;
  initialDelay?: number;
}

export const HoldButton: React.FC<HoldButtonProps> = ({
  onStep,
  stepInterval = 80,
  initialDelay = 350,
  children,
  className,
  ...props
}) => {
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return; // left click only
    // Perform step immediately
    onStepRef.current();

    clearTimers();
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        onStepRef.current();
      }, stepInterval);
    }, initialDelay);
  }, [clearTimers, initialDelay, stepInterval]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <button
      type="button"
      {...props}
      className={className}
      onPointerDown={handlePointerDown}
      onPointerUp={clearTimers}
      onPointerLeave={clearTimers}
      onPointerOut={clearTimers}
      onPointerCancel={clearTimers}
      onBlur={clearTimers}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          onStepRef.current();
        }
      }}
    >
      {children}
    </button>
  );
};
