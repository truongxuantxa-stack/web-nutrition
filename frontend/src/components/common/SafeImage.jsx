import { useState, useEffect } from 'react';

export default function SafeImage({ src, alt, className, fallback, onClick }) {
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsError(false);
  }, [src]);

  if (!src || isError) {
    return fallback;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={() => setIsError(true)}
    />
  );
}
