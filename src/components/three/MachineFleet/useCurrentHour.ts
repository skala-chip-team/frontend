import { useEffect, useState } from 'react';

function getCurrentHour() {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

/** 현재 시각을 소수 시(hour) 단위로 반환하고 1초마다 갱신한다. */
export function useCurrentHour() {
  const [hour, setHour] = useState(getCurrentHour);

  useEffect(() => {
    const timerId = window.setInterval(() => setHour(getCurrentHour()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  return hour;
}

export function formatHour(hour: number) {
  const clamped = ((hour % 24) + 24) % 24;
  const h = Math.floor(clamped);
  const m = Math.floor((clamped - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
