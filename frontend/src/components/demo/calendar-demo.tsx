import { useState } from 'react';

import { Calendar } from '@/components/ui/calendar';

export const CalendarDemo = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Calendar
      className="rounded-md border shadow"
      mode="single"
      selected={date}
      onSelect={setDate}
    />
  );
};
