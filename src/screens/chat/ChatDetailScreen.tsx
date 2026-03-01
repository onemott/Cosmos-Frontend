import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Box, Text, HStack, VStack, Avatar, AvatarFallbackText } from '@gluestack-ui/themed';
import { useChat } from '../../contexts/ChatContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { colors, spacing, borderRadius } from '../../config/theme';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../../types/api';

export default function ChatDetailScreen() {
  const { messages, sendMessage, selectSession, leaveSession, currentSessionId } = useChat();
  const route = useRoute();
  const navigation = useNavigation();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // @ts-ignore
  const { sessionId, title } = route.params;

  useEffect(() => {
    if (sessionId) {
      selectSession(sessionId);
      navigation.setOptions({ title: title || 'My Advisor' });
    }
    return () => {
      leaveSession();
    };
  }, [sessionId, selectSession, leaveSession, navigation, title]);

  const currentMessages = messages[sessionId] || [];

  const handleSend = () => {
    if (inputText.trim()) {
      const content = inputText.trim();
      sendMessage(content);
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    // Backend uses 'client_user' for mobile app users, 'user' for admin/staff
    const isUser = item.sender_type === 'client_user' || item.sender_type === 'client'; 
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.otherMessage
      ]}>
        {!isUser && (
          <Avatar size="xs" bgColor="$blueGray500" mr="$2">
            <AvatarFallbackText>A</AvatarFallbackText>
          </Avatar>
        )}
        <VStack 
          bg={isUser ? colors.primary : colors.surface} 
          px="$3" py="$2" 
          borderRadius={borderRadius.lg}
          borderBottomRightRadius={isUser ? 0 : borderRadius.lg}
          borderBottomLeftRadius={!isUser ? 0 : borderRadius.lg}
          maxWidth="80%"
        >
          <Text color={isUser ? 'white' : colors.textPrimary}>{item.content}</Text>
          <Text size="xs" color={isUser ? '$textLight200' : '$textLight500'} alignSelf="flex-end" mt="$1">
             {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </VStack>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={currentMessages} // Assuming oldest to newest
        renderItem={renderMessage}
        keyExtractor={item => item.id || item.client_side_id || Math.random().toString()}
        contentContainerStyle={{ padding: spacing.md }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      <HStack 
        p="$3" 
        bg={colors.surface} 
        alignItems="center" 
        borderTopWidth={1} 
        borderColor="$borderLight200"
      >
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()} style={{ marginLeft: spacing.sm }}>
          <Ionicons name="send" size={24} color={inputText.trim() ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </HStack>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  }
});
