import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  ButtonText,
  Divider,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../../config/theme';
import { GradientCard } from '../../../components/ui/GradientCard';
import {
  getUpcomingMeetings,
  getPastMeetings,
  Meeting,
} from '../../../data/mockCRM';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../../../lib/i18n';

type ViewType = 'upcoming' | 'past';

export default function MeetingsSection() {
  const { t } = useTranslation();
  const [viewType, setViewType] = useState<ViewType>('upcoming');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const upcomingMeetings = getUpcomingMeetings();
  const pastMeetings = getPastMeetings();
  const meetings = viewType === 'upcoming' ? upcomingMeetings : pastMeetings;

  const handleMeetingPress = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsDetailVisible(true);
  };

  const handleJoinMeeting = (meetingLink?: string) => {
    if (meetingLink) {
      Linking.openURL(meetingLink).catch(() => {
        Alert.alert(t('common.error'), t('crm.meetings.couldNotOpenLink'));
      });
    }
  };

  const handleBookMeeting = () => {
    Alert.alert(
      t('crm.meetings.bookMeeting'),
      t('crm.meetings.bookMeetingMessage'),
      [{ text: t('common.ok') }]
    );
  };

  return (
    <Box flex={1}>
      {/* View Toggle */}
      <Box paddingHorizontal="$4" paddingBottom="$2">
        <HStack space="sm">
          <TouchableOpacity
            onPress={() => setViewType('upcoming')}
            style={[
              styles.viewTab,
              viewType === 'upcoming' && styles.viewTabActive,
            ]}
          >
            <Text
              size="sm"
              color={viewType === 'upcoming' ? colors.primary : colors.textSecondary}
              fontWeight={viewType === 'upcoming' ? '$semibold' : '$normal'}
            >
              {t('crm.meetings.upcoming')} ({upcomingMeetings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewType('past')}
            style={[
              styles.viewTab,
              viewType === 'past' && styles.viewTabActive,
            ]}
          >
            <Text
              size="sm"
              color={viewType === 'past' ? colors.primary : colors.textSecondary}
              fontWeight={viewType === 'past' ? '$semibold' : '$normal'}
            >
              {t('crm.meetings.past')} ({pastMeetings.length})
            </Text>
          </TouchableOpacity>
        </HStack>
      </Box>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Book Meeting CTA */}
        {viewType === 'upcoming' && (
          <TouchableOpacity onPress={handleBookMeeting} activeOpacity={0.8}>
            <GradientCard variant="primary" style={{ marginBottom: spacing.md }}>
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space="md" alignItems="center">
                  <Box
                    bg="rgba(255,255,255,0.2)"
                    padding="$2"
                    borderRadius={borderRadius.md}
                  >
                    <Ionicons name="calendar-outline" size={24} color="white" />
                  </Box>
                  <VStack>
                    <Text fontWeight="$semibold" color="white">
                      {t('crm.meetings.scheduleMeeting')}
                    </Text>
                    <Text size="sm" color="white" opacity={0.8}>
                      {t('crm.meetings.bookTimeWithAdvisor')}
                    </Text>
                  </VStack>
                </HStack>
                <Ionicons name="add-circle" size={28} color="white" />
              </HStack>
            </GradientCard>
          </TouchableOpacity>
        )}

        {/* Meetings List */}
        {meetings.length === 0 ? (
          <Box alignItems="center" paddingVertical="$8">
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text color={colors.textSecondary} marginTop="$2">
              {viewType === 'upcoming' ? t('crm.meetings.noUpcoming') : t('crm.meetings.noPast')}
            </Text>
          </Box>
        ) : (
          meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onPress={() => handleMeetingPress(meeting)}
              onJoin={() => handleJoinMeeting(meeting.meetingLink)}
              t={t}
            />
          ))
        )}

        <Box height={20} />
      </ScrollView>

      {/* Meeting Detail Modal */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsDetailVisible(false)}
      >
        <Box flex={1} justifyContent="flex-end" bg="rgba(0,0,0,0.5)">
          <Box
            bg={colors.background}
            borderTopLeftRadius={borderRadius.xl}
            borderTopRightRadius={borderRadius.xl}
            maxHeight="80%"
          >
            <HStack
              justifyContent="space-between"
              alignItems="center"
              padding="$4"
              borderBottomWidth={1}
              borderBottomColor={colors.border}
            >
              <Heading size="md" color="white">{t('crm.meetings.meetingDetails')}</Heading>
              <TouchableOpacity onPress={() => setIsDetailVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </HStack>

            <ScrollView style={{ padding: spacing.md }}>
              {selectedMeeting && (
                <VStack space="md">
                  <Text size="lg" fontWeight="$bold" color="white">
                    {selectedMeeting.title}
                  </Text>

                  {selectedMeeting.description && (
                    <Text color={colors.textSecondary}>
                      {selectedMeeting.description}
                    </Text>
                  )}

                  <Divider bg={colors.border} />

                  <HStack space="md" alignItems="center">
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <Text color="white">
                      {format(parseISO(selectedMeeting.date), 'EEEE, MMMM d, yyyy')}
                    </Text>
                  </HStack>

                  <HStack space="md" alignItems="center">
                    <Ionicons name="time" size={20} color={colors.primary} />
                    <Text color="white">
                      {selectedMeeting.startTime} - {selectedMeeting.endTime}
                    </Text>
                  </HStack>

                  <HStack space="md" alignItems="center">
                    <Ionicons
                      name={selectedMeeting.isVirtual ? 'videocam' : 'location'}
                      size={20}
                      color={colors.primary}
                    />
                    <Text color="white">
                      {selectedMeeting.isVirtual ? t('crm.meetings.virtualMeeting') : selectedMeeting.location}
                    </Text>
                  </HStack>

                  <Divider bg={colors.border} />

                  <VStack space="sm">
                    <Text size="sm" fontWeight="$semibold" color={colors.textSecondary}>
                      {t('crm.meetings.attendees')}
                    </Text>
                    {selectedMeeting.attendees.map((attendee, idx) => (
                      <HStack key={idx} space="sm" alignItems="center">
                        <Ionicons name="person-circle" size={20} color={colors.textMuted} />
                        <Text color="white">{attendee}</Text>
                      </HStack>
                    ))}
                  </VStack>

                  {selectedMeeting.notes && (
                    <>
                      <Divider bg={colors.border} />
                      <VStack space="sm">
                        <Text size="sm" fontWeight="$semibold" color={colors.textSecondary}>
                          {t('crm.meetings.meetingNotes')}
                        </Text>
                        <Box bg={colors.surface} padding="$3" borderRadius={borderRadius.md}>
                          <Text color="white">{selectedMeeting.notes}</Text>
                        </Box>
                      </VStack>
                    </>
                  )}

                  {selectedMeeting.status === 'scheduled' && selectedMeeting.isVirtual && (
                    <Button
                      bg={colors.primary}
                      marginTop="$4"
                      onPress={() => handleJoinMeeting(selectedMeeting.meetingLink)}
                    >
                      <Ionicons name="videocam" size={18} color="white" />
                      <ButtonText marginLeft="$2">{t('crm.meetings.joinMeeting')}</ButtonText>
                    </Button>
                  )}

                  <Box height={40} />
                </VStack>
              )}
            </ScrollView>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

interface MeetingCardProps {
  meeting: Meeting;
  onPress: () => void;
  onJoin: () => void;
  t: (key: string) => string;
}

function MeetingCard({ meeting, onPress, onJoin, t }: MeetingCardProps) {
  const isPast = meeting.status === 'completed';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Box style={[styles.meetingCard, isPast && styles.pastCard]}>
        <HStack space="md" alignItems="flex-start">
          <Box
            bg={isPast ? colors.surfaceHighlight : colors.primary}
            padding="$2"
            borderRadius={borderRadius.md}
            alignItems="center"
            width={50}
          >
            <Text size="xs" color={isPast ? colors.textSecondary : 'white'}>
              {format(parseISO(meeting.date), 'MMM')}
            </Text>
            <Text size="lg" fontWeight="$bold" color={isPast ? colors.textSecondary : 'white'}>
              {format(parseISO(meeting.date), 'd')}
            </Text>
          </Box>

          <VStack flex={1} space="xs">
            <Text
              size="md"
              fontWeight="$semibold"
              color={isPast ? colors.textSecondary : 'white'}
            >
              {meeting.title}
            </Text>

            <HStack space="sm" alignItems="center">
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text size="sm" color={colors.textMuted}>
                {meeting.startTime} - {meeting.endTime}
              </Text>
            </HStack>

            <HStack space="sm" alignItems="center">
              <Ionicons
                name={meeting.isVirtual ? 'videocam-outline' : 'location-outline'}
                size={14}
                color={colors.textMuted}
              />
              <Text size="sm" color={colors.textMuted}>
                {meeting.isVirtual ? t('crm.meetings.virtual') : meeting.location}
              </Text>
            </HStack>
          </VStack>

          {meeting.status === 'scheduled' && meeting.isVirtual ? (
            <TouchableOpacity onPress={onJoin} style={styles.joinButton}>
              <Text size="sm" fontWeight="$semibold" color={colors.primary}>
                {t('crm.meetings.join')}
              </Text>
            </TouchableOpacity>
          ) : isPast ? (
            <Box
              bg={colors.surfaceHighlight}
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius={borderRadius.sm}
            >
              <Text size="xs" color={colors.textMuted}>
                {t('crm.meetings.completed')}
              </Text>
            </Box>
          ) : null}
        </HStack>
      </Box>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  viewTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  viewTabActive: {
    backgroundColor: `${colors.primary}20`,
  },
  meetingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pastCard: {
    opacity: 0.7,
  },
  joinButton: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
});

