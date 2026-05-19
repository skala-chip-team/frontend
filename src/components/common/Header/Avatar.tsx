import { useState } from 'react';
import type { AvatarProps } from './types';

export function Avatar({ src, alt, fallback, size = 32 }: AvatarProps) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt ?? ''}
        onError={() => setErrored(true)}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="grid place-content-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-label-1 text-white"
      style={{ width: size, height: size }}
    >
      {fallback}
    </div>
  );
}
