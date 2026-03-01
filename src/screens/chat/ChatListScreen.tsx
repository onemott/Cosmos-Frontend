import React, { useEffect, useCallback, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Box, Text, Avatar, AvatarFallbackText, HStack, VStack, Badge, BadgeText, Button, ButtonText, ButtonIcon } from '@gluestack-ui/themed';
import { useChat } from '../../contexts/ChatContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { colors, spacing, borderRadius } from '../../config/theme';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '../../api/chat';

export default function ChatListScreen() {
  const { sessions, refreshSessions, isLoading: isChatLoading } = useChat();
  const navigation = useNavigation();
  const [isCreating, setIsCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshSessions();
    }, [refreshSessions])
  );

  const handlePress = (item: any) => {
    // @ts-ignore
    navigation.navigate('ChatDetail', { sessionId: item.id, title: item.advisor_name || 'My Advisor' });
  };

  const handleCreateSession = async () => {
    try {
      setIsCreating(true);
      const session = await chatApi.createSession();
      await refreshSessions();
      // @ts-ignore
      navigation.navigate('ChatDetail', { sessionId: session.id, title: session.advisor_name || 'My Advisor' });
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handlePress(item)}
      style={styles.itemContainer}
      activeOpacity={0.7}
    >
      <HStack space="md" alignItems="center">
        <Avatar size="md" bgColor="$primary500">
          <AvatarFallbackText>{item.advisor_name || 'A'}</AvatarFallbackText>
        </Avatar>
        <VStack flex={1}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="$bold" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
              {item.advisor_name || 'Support Team'}
            </Text>
            {item.last_message_at && (
              <Text size="xs" color="$textLight500">
                {formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })}
              </Text>
            )}
          </HStack>
          <HStack justifyContent="space-between" alignItems="center" mt="$1">
             <Text size="sm" color="$textLight500" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
               {item.last_message || 'Start a conversation...'}
             </Text>
             {item.unread_count > 0 && (
               <Badge size="md" variant="solid" action="error" borderRadius="$full">
                 <BadgeText>{item.unread_count}</BadgeText>
               </Badge>
             )}
          </HStack>
        </VStack>
      </HStack>
    </TouchableOpacity>
  );

  if (isChatLoading && sessions.length === 0) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Box>
    );
  }

  return (
    <Box flex={1} bg={colors.background}>
      <FlatList
        data={sessions}
        extraData={sessions} // Ensure re-render on updates
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <Box flex={1} justifyContent="center" alignItems="center" mt="$10">
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
            <Text color="$textLight500" mt="$4" mb="$6">No active chats</Text>
            <Button 
              size="md" 
              variant="solid" 
              action="primary" 
              isDisabled={isCreating}
              onPress={handleCreateSession}
            >
              <ButtonText>{isCreating ? 'Starting...' : 'Start New Chat'}</ButtonText>
            </Button>
          </Box>
        }
        refreshing={isChatLoading}
        onRefresh={refreshSessions}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  }
});
