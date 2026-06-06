import { useEffect, useState } from 'react';

import { MachineScheduleGanttRow, type MachineScheduleRowData } from './MachineScheduleGanttRow';

type MachineScheduleGanttBoardProps = {
  startHour: number;
  endHour: number;
  schedules: MachineScheduleRowData[];
};

function formatHourLabel(hour: number) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function createHourTicks(startHour: number, endHour: number) {
  return Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
}

function formatCurrentTimeLabel(currentHour: number) {
  const hours = Math.floor(currentHour);
  const minutes = Math.floor((currentHour - hours) * 60);
  const seconds = Math.floor((((currentHour - hours) * 60) - minutes) * 60);

  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':');
}

export function MachineScheduleGanttBoard({
  startHour,
  endHour,
  schedules,
}: MachineScheduleGanttBoardProps) {
  const labelColumnWidth = '10rem';
  const columnGap = '1rem';
  const getCurrentHour = () => {
    const now = new Date();
    return (
      now.getHours() +
      now.getMinutes() / 60 +
      now.getSeconds() / 3600 +
      now.getMilliseconds() / 3600000
    );
  };

  const [currentHour, setCurrentHour] = useState(getCurrentHour);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentHour(getCurrentHour());
    }, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const hourTicks = createHourTicks(startHour, endHour);
  const totalHours = endHour - startHour;
  const currentLinePosition = Math.min(Math.max(((currentHour - startHour) / totalHours) * 100, 0), 100);
  const currentTimeLabel = formatCurrentTimeLabel(currentHour);
  const currentLineLeft = `calc(${labelColumnWidth} + ${columnGap} + ((100% - ${labelColumnWidth} - ${columnGap}) * ${currentLinePosition / 100}))`;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur lg:p-7">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-12%] top-[-18%] h-32 w-32 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] h-28 w-28 rounded-full bg-secondary-orange/6 blur-3xl" />
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute bottom-0 top-0 z-20 w-px -translate-x-1/2 bg-primary-500 shadow-[0_0_12px_rgba(234,0,44,0.28)]"
          style={{ left: currentLineLeft }}
        >
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-primary-500 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-white shadow-[0_6px_18px_rgba(234,0,44,0.22)]">
            {currentTimeLabel}
          </div>
        </div>

        <div className="grid grid-cols-[10rem_minmax(0,1fr)] items-end gap-4 pb-1">
          <div />

          <div className="relative h-9">
            {hourTicks.map((hour, index) => {
              const position = (index / totalHours) * 100;

              return (
                <div
                  key={hour}
                  className="absolute top-0 text-caption-1 text-gray-400"
                  style={{
                    left: `${position}%`,
                    transform:
                      index === 0
                        ? 'translateX(0)'
                        : index === hourTicks.length - 1
                          ? 'translateX(-100%)'
                          : 'translateX(-50%)',
                  }}
                >
                  {formatHourLabel(hour)}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 grid gap-2">
          {schedules.map((schedule) => (
            <MachineScheduleGanttRow
              key={schedule.machineCode}
              schedule={schedule}
              startHour={startHour}
              endHour={endHour}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export type { MachineScheduleGanttBoardProps };
