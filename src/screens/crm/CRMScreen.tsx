import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Box, HStack, Text } from '@gluestack-ui/themed';
import { colors, spacing, borderRadius } from '../../config/theme';
import DocumentsSection from './sections/DocumentsSection';
import TasksSection from './sections/TasksSection';
import CalendarSection from './sections/CalendarSection';
import MeetingsSection from './sections/MeetingsSection';

type CRMTab = 'documents' | 'tasks' | 'calendar' | 'meetings';

const TABS: { key: CRMTab; label: string }[] = [
  { key: 'documents', label: 'Docs' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'meetings', label: 'Meetings' },
];

export default function CRMScreen() {
  const [activeTab, setActiveTab] = useState<CRMTab>('tasks');

  const renderContent = () => {
    switch (activeTab) {
      case 'documents':
        return <DocumentsSection />;
      case 'tasks':
        return <TasksSection />;
      case 'calendar':
        return <CalendarSection />;
      case 'meetings':
        return <MeetingsSection />;
    }
  };

  return (
    <Box flex={1} bg={colors.background}>
      {/* Segmented Control */}
      <Box paddingHorizontal="$4" paddingTop="$2" paddingBottom="$3">
        <HStack
          bg={colors.surface}
          borderRadius={borderRadius.lg}
          padding="$1"
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                size="sm"
                fontWeight={activeTab === tab.key ? '$semibold' : '$normal'}
                color={activeTab === tab.key ? 'white' : colors.textSecondary}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </HStack>
      </Box>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
});

