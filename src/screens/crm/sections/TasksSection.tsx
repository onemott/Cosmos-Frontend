import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  AppState,
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
import { useTasks, useTaskDetail, useApproveTask, useDeclineTask, useArchiveTask } from '../../../api/hooks';
import { formatDate } from '../../../utils/format';
import { useTranslation, useLocalizedDate } from '../../../lib/i18n';
import type { Task } from '../../../types/api';

type FilterType = 'all' | 'in_progress' | 'action' | 'completed' | 'archived';

export default function TasksSection() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [actionComment, setActionComment] = useState('');
  const { t } = useTranslation();
  const { formatFullDateTime } = useLocalizedDate();

  // User-friendly workflow state labels
  const WORKFLOW_STATE_LABELS: Record<string, string> = {
    pending_eam: t('crm.tasks.states.underReview'),
    pending_client: t('crm.tasks.states.awaitingResponse'),
    approved: t('crm.tasks.states.approved'),
    declined: t('crm.tasks.states.declined'),
    draft: t('crm.tasks.states.draft'),
    expired: t('crm.tasks.states.expired'),
  };

  // Fetch non-archived tasks by default
  const isArchivedView = filter === 'archived';
  const { data: tasksData, isLoading, refetch, isRefetching } = useTasks(undefined, isArchivedView);
  
  // Fetch full task detail when viewing
  const { data: taskDetailData, isLoading: isLoadingDetail } = useTaskDetail(selectedTaskId || '');
  const selectedTask = taskDetailData as Task | undefined;
  
  const approveMutation = useApproveTask();
  const declineMutation = useDeclineTask();
  const archiveMutation = useArchiveTask();

  const allTasks = (tasksData as any)?.tasks || [];
  
  // Client-side filtering
  const tasks = allTasks.filter((task: any) => {
    // If we're in archived view, the API already filtered for is_archived=true
    if (isArchivedView) return true;

    // For other views, API returns is_archived=false tasks
    switch (filter) {
      case 'in_progress':
        return task.status === 'in_progress' || task.workflow_state === 'pending_eam';
      case 'action':
        return task.requires_action;
      case 'completed':
        // Show completed but not archived tasks
        return (task.status === 'completed' || task.status === 'cancelled' || task.workflow_state === 'approved' || task.workflow_state === 'declined');
      case 'all':
      default:
        return true;
    }
  });

  // Refetch when app comes to foreground or filter changes (for archive toggle)
  useEffect(() => {
    refetch();
  }, [filter, refetch]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refetch();
      }
    });
    return () => subscription.remove();
  }, [refetch]);

  const handleTaskPress = (task: Task) => {
    setSelectedTaskId(task.id);
    setActionComment('');
    setIsDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setIsDetailVisible(false);
    setSelectedTaskId(null);
  };

  const handleApprove = async () => {
    if (!selectedTaskId) return;
    
    try {
      await approveMutation.mutateAsync({
        taskId: selectedTaskId,
        comment: actionComment,
      });
      Alert.alert(t('common.success'), t('crm.tasks.approveSuccess'));
      handleCloseDetail();
      refetch();
    } catch (error) {
      Alert.alert(t('common.error'), t('crm.tasks.approveFailed'));
    }
  };

  const handleDecline = async () => {
    if (!selectedTaskId) return;
    
    if (!actionComment.trim()) {
      Alert.alert(t('common.required'), t('crm.tasks.declineReasonRequired'));
      return;
    }
    
    try {
      await declineMutation.mutateAsync({
        taskId: selectedTaskId,
        comment: actionComment,
      });
      Alert.alert(t('common.success'), t('crm.tasks.declineSuccess'));
      handleCloseDetail();
      refetch();
    } catch (error) {
      Alert.alert(t('common.error'), t('crm.tasks.declineFailed'));
    }
  };

  const handleArchive = async () => {
    if (!selectedTaskId) return;

    Alert.alert(
      t('crm.tasks.archiveTask'),
      t('crm.tasks.archiveConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('crm.tasks.archive'),
          onPress: async () => {
            try {
              await archiveMutation.mutateAsync(selectedTaskId);
              handleCloseDetail();
              refetch(); // Refresh list to remove archived task
            } catch (error) {
              Alert.alert(t('common.error'), t('crm.tasks.archiveFailed'));
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color={colors.primary} />
      </Box>
    );
  }

  const actionCount = allTasks.filter((t: any) => t.requires_action).length;

  const FILTER_LABELS: Record<FilterType, string> = {
    all: t('common.all'),
    in_progress: t('crm.tasks.filters.inProgress'),
    action: t('crm.tasks.filters.action', { count: actionCount }),
    completed: t('crm.tasks.filters.completed'),
    archived: t('crm.tasks.filters.archived'),
  };

  return (
    <Box flex={1}>
      {/* Filter Tabs */}
      <Box paddingHorizontal="$4" paddingBottom="$2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space="sm">
            {(['all', 'in_progress', 'action', 'completed', 'archived'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterTab,
                  filter === f && styles.filterTabActive,
                  f === 'action' && actionCount > 0 && styles.filterTabAction,
                ]}
              >
                <Text
                  size="sm"
                  color={filter === f ? colors.primary : (f === 'action' && actionCount > 0 ? colors.error : colors.textSecondary)}
                  fontWeight={filter === f ? '$semibold' : '$normal'}
                >
                  {FILTER_LABELS[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </HStack>
        </ScrollView>
      </Box>

      {/* Action Required Alert */}
      {actionCount > 0 && filter === 'all' && (
        <TouchableOpacity onPress={() => setFilter('action')}>
          <Box paddingHorizontal="$4" paddingBottom="$2">
            <Box bg={`${colors.error}20`} padding="$3" borderRadius={borderRadius.md}>
              <HStack alignItems="center" justifyContent="space-between">
                <HStack alignItems="center" space="sm" flex={1}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text size="sm" color={colors.error} fontWeight="$medium">
                    {t('crm.tasks.actionRequired', { count: actionCount })}
                  </Text>
                </HStack>
                <Ionicons name="chevron-forward" size={16} color={colors.error} />
              </HStack>
            </Box>
          </Box>
        </TouchableOpacity>
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
              {t('crm.tasks.noTasks')}
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
        onRequestClose={handleCloseDetail}
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
              <TouchableOpacity onPress={handleCloseDetail}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </HStack>

            <ScrollView style={{ padding: spacing.md }}>
              {isLoadingDetail ? (
                <Box alignItems="center" paddingVertical="$8">
                  <Spinner size="large" color={colors.primary} />
                </Box>
              ) : selectedTask ? (
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
                    <Text 
                      size="sm" 
                      color={selectedTask.requires_action ? colors.primary : 'white'}
                      fontWeight={selectedTask.requires_action ? '$semibold' : '$normal'}
                    >
                      {WORKFLOW_STATE_LABELS[selectedTask.workflow_state || ''] || selectedTask.status?.replace('_', ' ')}
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

                  {/* EAM Message from Advisor */}
                  {(selectedTask as any).proposal_data?.eam_message && (
                    <Box
                      bg={`${colors.primary}15`}
                      borderRadius={borderRadius.md}
                      padding="$3"
                      borderLeftWidth={3}
                      borderLeftColor={colors.primary}
                    >
                      <HStack alignItems="center" space="sm" marginBottom="$2">
                        <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
                        <Text size="sm" color={colors.primary} fontWeight="$semibold">
                          Message from your advisor
                        </Text>
                      </HStack>
                      <Text size="sm" color="white">
                        {(selectedTask as any).proposal_data.eam_message}
                      </Text>
                    </Box>
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

                  {/* Archive Action (for completed tasks) */}
                  {!selectedTask.is_archived && 
                   (selectedTask.status === 'completed' || 
                    selectedTask.status === 'cancelled' || 
                    selectedTask.workflow_state === 'approved' || 
                    selectedTask.workflow_state === 'declined') && (
                    <VStack space="md" marginTop="$4">
                      <Divider bg={colors.border} />
                      <Button
                        variant="outline"
                        borderColor={colors.textMuted}
                        onPress={handleArchive}
                        disabled={archiveMutation.isPending}
                      >
                        <ButtonText color={colors.textSecondary}>Archive Task</ButtonText>
                      </Button>
                    </VStack>
                  )}

                  <Box height={40} />
                </VStack>
              ) : null}
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
  filterTabAction: {
    borderWidth: 1,
    borderColor: `${colors.error}50`,
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

