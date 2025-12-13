import React, { useState } from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Spinner,
  Divider,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../../config/theme';
import { TaskCard } from '../../../components/crm/TaskCard';
import { useTasks, useApproveTask, useDeclineTask } from '../../../api/hooks';
import { formatDate } from '../../../utils/format';
import type { Task } from '../../../types/api';

type FilterType = 'all' | 'pending' | 'completed';

export default function TasksSection() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [actionComment, setActionComment] = useState('');

  const { data: tasksData, isLoading, refetch, isRefetching } = useTasks(
    filter === 'all' ? undefined : filter
  );
  const approveMutation = useApproveTask();
  const declineMutation = useDeclineTask();

  const tasks = (tasksData as any)?.tasks || [];

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setActionComment('');
    setIsDetailVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedTask) return;
    
    try {
      await approveMutation.mutateAsync({
        taskId: selectedTask.id,
        comment: actionComment,
      });
      Alert.alert('Success', 'Task approved successfully');
      setIsDetailVisible(false);
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve task');
    }
  };

  const handleDecline = async () => {
    if (!selectedTask) return;
    
    if (!actionComment.trim()) {
      Alert.alert('Required', 'Please provide a reason for declining');
      return;
    }
    
    try {
      await declineMutation.mutateAsync({
        taskId: selectedTask.id,
        comment: actionComment,
      });
      Alert.alert('Success', 'Task declined');
      setIsDetailVisible(false);
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to decline task');
    }
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color={colors.primary} />
      </Box>
    );
  }

  const pendingCount = tasks.filter((t: any) => t.requires_action).length;

  return (
    <Box flex={1}>
      {/* Filter Tabs */}
      <Box paddingHorizontal="$4" paddingBottom="$2">
        <HStack space="sm">
          {(['all', 'pending', 'completed'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterTab,
                filter === f && styles.filterTabActive,
              ]}
            >
              <Text
                size="sm"
                color={filter === f ? colors.primary : colors.textSecondary}
                fontWeight={filter === f ? '$semibold' : '$normal'}
                textTransform="capitalize"
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </HStack>
      </Box>

      {/* Pending Alert */}
      {pendingCount > 0 && filter === 'all' && (
        <Box paddingHorizontal="$4" paddingBottom="$2">
          <Box bg={`${colors.error}20`} padding="$3" borderRadius={borderRadius.md}>
            <HStack alignItems="center" space="sm">
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text size="sm" color={colors.error} fontWeight="$medium">
                {pendingCount} task{pendingCount > 1 ? 's' : ''} require{pendingCount === 1 ? 's' : ''} your attention
              </Text>
            </HStack>
          </Box>
        </Box>
      )}

      {/* Tasks List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {tasks.length === 0 ? (
          <Box alignItems="center" paddingVertical="$8">
            <Ionicons name="checkbox-outline" size={48} color={colors.textMuted} />
            <Text color={colors.textSecondary} marginTop="$2">
              No tasks found
            </Text>
          </Box>
        ) : (
          tasks.map((task: any) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              description={task.description}
              taskType={task.task_type}
              status={task.status}
              priority={task.priority}
              workflowState={task.workflow_state}
              dueDate={task.due_date}
              requiresAction={task.requires_action}
              onPress={() => handleTaskPress(task)}
            />
          ))
        )}
      </ScrollView>

      {/* Task Detail Modal */}
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
            {/* Header */}
            <HStack
              justifyContent="space-between"
              alignItems="center"
              padding="$4"
              borderBottomWidth={1}
              borderBottomColor={colors.border}
            >
              <Heading size="md" color="white">Task Details</Heading>
              <TouchableOpacity onPress={() => setIsDetailVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </HStack>

            <ScrollView style={{ padding: spacing.md }}>
              {selectedTask && (
                <VStack space="md">
                  <Text size="lg" fontWeight="$bold" color="white">
                    {selectedTask.title}
                  </Text>
                  
                  {selectedTask.description && (
                    <Text color={colors.textSecondary}>
                      {selectedTask.description}
                    </Text>
                  )}

                  <Divider bg={colors.border} />

                  <HStack justifyContent="space-between">
                    <Text size="sm" color={colors.textMuted}>Status</Text>
                    <Text size="sm" color="white" textTransform="capitalize">
                      {selectedTask.workflow_state?.replace('_', ' ') || selectedTask.status}
                    </Text>
                  </HStack>

                  {selectedTask.due_date && (
                    <HStack justifyContent="space-between">
                      <Text size="sm" color={colors.textMuted}>Due Date</Text>
                      <Text size="sm" color="white">
                        {formatDate(selectedTask.due_date)}
                      </Text>
                    </HStack>
                  )}

                  {/* Action Area */}
                  {selectedTask.workflow_state === 'pending_client' && (
                    <VStack space="md" marginTop="$4">
                      <Divider bg={colors.border} />
                      <Text size="sm" color={colors.textSecondary}>
                        Add a comment (required for declining):
                      </Text>
                      <TextInput
                        style={styles.commentInput}
                        placeholder="Your comment..."
                        placeholderTextColor={colors.textMuted}
                        value={actionComment}
                        onChangeText={setActionComment}
                        multiline
                        numberOfLines={3}
                      />

                      <HStack space="md">
                        <Button
                          flex={1}
                          bg={colors.error}
                          onPress={handleDecline}
                          disabled={declineMutation.isPending}
                        >
                          <ButtonText>Decline</ButtonText>
                        </Button>
                        <Button
                          flex={1}
                          bg={colors.success}
                          onPress={handleApprove}
                          disabled={approveMutation.isPending}
                        >
                          <ButtonText>Approve</ButtonText>
                        </Button>
                      </HStack>
                    </VStack>
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

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  filterTabActive: {
    backgroundColor: `${colors.primary}20`,
  },
  commentInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: 'white',
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
  },
});

