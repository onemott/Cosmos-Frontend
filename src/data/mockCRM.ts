/**
 * Mock data for CRM Calendar and Meetings.
 * 
 * TODO: Replace with actual API calls once backend endpoints are implemented:
 * - GET /client/calendar/events
 * - GET /client/meetings
 * - POST /client/meetings
 */

export interface CalendarEvent {
  id: string;
  type: 'task' | 'meeting' | 'reminder';
  title: string;
  description?: string;
  date: string; // ISO date
  time?: string; // HH:mm format
  isAllDay: boolean;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  isVirtual: boolean;
  meetingLink?: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

// Generate dates relative to today
const today = new Date();
const addDays = (days: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ce-001',
    type: 'task',
    title: 'Tax Loss Harvesting Review',
    description: 'Review and approve tax optimization proposal',
    date: addDays(2),
    isAllDay: false,
    time: '10:00',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'ce-002',
    type: 'meeting',
    title: 'Quarterly Portfolio Review',
    description: 'Q4 review with your advisor',
    date: addDays(5),
    time: '14:00',
    isAllDay: false,
  },
  {
    id: 'ce-003',
    type: 'task',
    title: 'Sign Investment Agreement',
    description: 'Document review required',
    date: addDays(7),
    isAllDay: true,
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 'ce-004',
    type: 'reminder',
    title: 'Annual KYC Update',
    description: 'Update your personal information',
    date: addDays(14),
    isAllDay: true,
    priority: 'medium',
  },
  {
    id: 'ce-005',
    type: 'meeting',
    title: 'Investment Strategy Session',
    description: 'Discuss 2025 investment outlook',
    date: addDays(10),
    time: '11:00',
    isAllDay: false,
  },
];

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'mtg-001',
    title: 'Quarterly Portfolio Review',
    description: 'Review Q4 performance and discuss Q1 strategy',
    date: addDays(5),
    startTime: '14:00',
    endTime: '15:00',
    isVirtual: true,
    meetingLink: 'https://zoom.us/j/123456789',
    attendees: ['John Smith (You)', 'Sarah Chen (Advisor)'],
    status: 'scheduled',
  },
  {
    id: 'mtg-002',
    title: 'Investment Strategy Session',
    description: 'Deep dive into 2025 market outlook and portfolio positioning',
    date: addDays(10),
    startTime: '11:00',
    endTime: '12:00',
    isVirtual: true,
    meetingLink: 'https://zoom.us/j/987654321',
    attendees: ['John Smith (You)', 'Sarah Chen (Advisor)', 'Michael Wong (CIO)'],
    status: 'scheduled',
  },
  {
    id: 'mtg-003',
    title: 'Tax Planning Consultation',
    description: 'Year-end tax optimization strategies',
    date: addDays(-7),
    startTime: '10:00',
    endTime: '10:30',
    isVirtual: false,
    location: '123 Financial Plaza, Suite 500',
    attendees: ['John Smith (You)', 'David Lee (Tax Specialist)'],
    status: 'completed',
    notes: 'Discussed tax loss harvesting opportunities. Client approved strategy.',
  },
  {
    id: 'mtg-004',
    title: 'Account Opening Review',
    description: 'Review new brokerage account setup',
    date: addDays(-14),
    startTime: '15:00',
    endTime: '15:30',
    isVirtual: true,
    meetingLink: 'https://teams.microsoft.com/meet/abc',
    attendees: ['John Smith (You)', 'Sarah Chen (Advisor)'],
    status: 'completed',
  },
];

// Helper to get upcoming meetings
export const getUpcomingMeetings = (): Meeting[] => {
  const now = new Date();
  return MOCK_MEETINGS
    .filter(m => new Date(m.date) >= now && m.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Helper to get past meetings
export const getPastMeetings = (): Meeting[] => {
  const now = new Date();
  return MOCK_MEETINGS
    .filter(m => new Date(m.date) < now || m.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

