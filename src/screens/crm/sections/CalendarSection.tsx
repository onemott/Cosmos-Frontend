import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../../config/theme';
import { MOCK_CALENDAR_EVENTS, CalendarEvent } from '../../../data/mockCRM';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';

// Group events by date
const groupEventsByDate = (events: CalendarEvent[]) => {
  const grouped: Record<string, CalendarEvent[]> = {};
  
  events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
  
  return grouped;
};

const getDateLabel = (dateStr: string): string => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isThisWeek(date)) return format(date, 'EEEE'); // Day name
  return format(date, 'MMM d, yyyy');
};

const EVENT_TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  task: { icon: 'checkbox', color: colors.warning },
  meeting: { icon: 'videocam', color: colors.primary },
  reminder: { icon: 'notifications', color: '#8B5CF6' },
};

export default function CalendarSection() {
  const groupedEvents = groupEventsByDate(MOCK_CALENDAR_EVENTS);
  const dateKeys = Object.keys(groupedEvents);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <Box marginBottom="$4">
        <Text size="sm" color={colors.textSecondary}>
          Upcoming events and deadlines
        </Text>
      </Box>

      {dateKeys.length === 0 ? (
        <Box alignItems="center" paddingVertical="$8">
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text color={colors.textSecondary} marginTop="$2">
            No upcoming events
          </Text>
        </Box>
      ) : (
        dateKeys.map((date) => (
          <Box key={date} marginBottom="$4">
            {/* Date Header */}
            <HStack alignItems="center" space="sm" marginBottom="$2">
              <Box
                bg={colors.surfaceHighlight}
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius={borderRadius.md}
              >
                <Text size="sm" fontWeight="$semibold" color="white">
                  {getDateLabel(date)}
                </Text>
              </Box>
              <Text size="xs" color={colors.textMuted}>
                {format(parseISO(date), 'MMMM d')}
              </Text>
            </HStack>

            {/* Events for this date */}
            <VStack space="sm">
              {groupedEvents[date].map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </VStack>
          </Box>
        ))
      )}

      <Box height={20} />
    </ScrollView>
  );
}

interface EventCardProps {
  event: CalendarEvent;
}

function EventCard({ event }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.reminder;

  return (
    <Box style={styles.eventCard}>
      <HStack space="md" alignItems="flex-start">
        {/* Time or All Day indicator */}
        <Box width={50} alignItems="center">
          {event.isAllDay ? (
            <Text size="xs" color={colors.textMuted}>
              All day
            </Text>
          ) : event.time ? (
            <Text size="sm" fontWeight="$medium" color="white">
              {event.time}
            </Text>
          ) : null}
        </Box>

        {/* Colored bar */}
        <Box
          width={3}
          height="100%"
          minHeight={40}
          bg={config.color}
          borderRadius={2}
        />

        {/* Content */}
        <VStack flex={1} space="xs">
          <HStack alignItems="center" space="xs">
            <Ionicons name={config.icon} size={14} color={config.color} />
            <Text size="xs" color={config.color} textTransform="capitalize">
              {event.type}
            </Text>
          </HStack>

          <Text size="md" fontWeight="$semibold" color="white">
            {event.title}
          </Text>

          {event.description && (
            <Text size="sm" color={colors.textSecondary} numberOfLines={2}>
              {event.description}
            </Text>
          )}

          {event.priority && event.priority !== 'medium' && (
            <HStack alignItems="center" space="xs">
              <Ionicons
                name="flag"
                size={12}
                color={event.priority === 'high' || event.priority === 'urgent' ? colors.error : colors.textMuted}
              />
              <Text
                size="xs"
                color={event.priority === 'high' || event.priority === 'urgent' ? colors.error : colors.textMuted}
                textTransform="capitalize"
              >
                {event.priority} priority
              </Text>
            </HStack>
          )}
        </VStack>
      </HStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

