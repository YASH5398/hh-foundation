import React, { useEffect, useRef, useState } from 'react';

const AnimatedCounter = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const startTimestamp = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const step = (timestamp) => {
      if (!startTimestamp.current) startTimestamp.current = timestamp;
      const progress = Math.min((timestamp - startTimestamp.current) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

export default AnimatedCounter; 