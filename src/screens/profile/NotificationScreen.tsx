import React, { useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import {
  Box,
  Heading,
  Text,
  HStack,
  Spinner,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { colors, borderRadius } from '../../config/theme';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../api/hooks';
import { Notification } from '../../api/notifications';
import { useTranslation } from '../../lib/i18n';
import { format } from 'date-fns';

export default function NotificationScreen() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handlePressItem = (item: Notification) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    setSelectedNotification(item);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handlePressItem(item)}
      activeOpacity={0.7}
    >
      <Box
        bg={item.is_read ? colors.background : colors.surface}
        p="$4"
        mb="$3"
        borderRadius={borderRadius.md}
        borderWidth={1}
        borderColor={item.is_read ? colors.border : colors.primary}
        opacity={item.is_read ? 0.7 : 1}
      >
        <HStack justifyContent="space-between" alignItems="flex-start" mb="$2">
          <HStack space="sm" alignItems="center" flex={1}>
            {!item.is_read && (
              <Box w={8} h={8} bg={colors.primary} borderRadius="$full" />
            )}
            <Heading size="sm" color="white" numberOfLines={1} flex={1}>
              {item.title}
            </Heading>
          </HStack>
          <Text size="xs" color={colors.textMuted} ml="$2">
            {format(new Date(item.created_at), 'MM-dd HH:mm')}
          </Text>
        </HStack>
        <Text color={colors.textSecondary} numberOfLines={3}>
           {item.content_format === 'markdown' 
             ? item.content.replace(/[#*`_]/g, '') 
             : item.content}
        </Text>
      </Box>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <Spinner size="large" color={colors.primary} />
      </Box>
    );
  }

  return (
    <Box flex={1} bg={colors.background} px="$4">
      <HStack justifyContent="space-between" alignItems="center" py="$4">
        <Heading size="lg" color="white">
          {t('profile.notifications')}
        </Heading>
        {data && data.unread_count > 0 && (
          <Button size="sm" variant="link" onPress={handleMarkAllRead}>
            <ButtonText color={colors.primary}>全部已读</ButtonText>
          </Button>
        )}
      </HStack>

      <FlatList
        data={data?.items || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <Box flex={1} justifyContent="center" alignItems="center" mt="$10">
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
            <Text color={colors.textMuted} mt="$4">
              暂无通知
            </Text>
          </Box>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selectedNotification}
        animationType="slide"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <Box flex={1} bg={colors.background} safeArea>
            <HStack justifyContent="space-between" alignItems="center" p="$4" borderBottomWidth={1} borderColor={colors.border}>
                    <Heading size="md" color="white" flex={1} numberOfLines={2}>
                    {selectedNotification?.title}
                    </Heading>
                    <TouchableOpacity onPress={() => setSelectedNotification(null)} style={{ padding: 8 }}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
            </HStack>
            <ScrollView contentContainerStyle={{padding: 16}}>
                <Text color={colors.textMuted} size="xs" mb="$4">
                    {selectedNotification?.created_at && format(new Date(selectedNotification.created_at), 'yyyy-MM-dd HH:mm')}
                </Text>
                
                {selectedNotification?.content_format === 'markdown' ? (
                    <Markdown style={markdownStyles}>
                        {selectedNotification.content}
                    </Markdown>
                ) : (
                        <Text color={colors.textSecondary} lineHeight="$lg" fontSize="$md">
                        {selectedNotification?.content}
                    </Text>
                )}
            </ScrollView>
        </Box>
      </Modal>
    </Box>
  );
}

const markdownStyles = {
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
  heading1: { color: colors.textPrimary, fontSize: 22, fontWeight: 'bold', marginVertical: 10 },
  heading2: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
  heading3: { color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginVertical: 6 },
  link: { color: colors.primary },
  list_item: { color: colors.textSecondary, fontSize: 16, marginVertical: 4 },
  strong: { color: colors.textPrimary, fontWeight: 'bold' },
};
