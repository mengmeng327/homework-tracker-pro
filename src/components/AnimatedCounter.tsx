import React, { useEffect, useState } from 'react';
import { useSpring, useTransform } from 'framer-motion';

interface Props {
  value: number;
}

export const AnimatedCounter: React.FC<Props> = ({ value }) => {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [display]);

  return (
    <span className="font-bold tabular-nums tracking-tight">
      {displayValue}
    </span>
  );
};