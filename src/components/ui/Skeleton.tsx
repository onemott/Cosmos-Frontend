import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleSheet } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { colors, borderRadius } from '../../config/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius: r = borderRadius.md,
  style,
}: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Box
      style={[
        {
          width,
          height,
          borderRadius: r,
          backgroundColor: colors.surfaceHighlight,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          opacity,
          backgroundColor: colors.textMuted,
        }}
      />
    </Box>
  );
};

export const TaskCardSkeleton = () => (
  <Box
    bg={colors.surface}
    padding="$3"
    borderRadius={borderRadius.lg}
    marginBottom="$3"
    borderWidth={1}
    borderColor={colors.border}
  >
    <Box flexDirection="row" alignItems="flex-start">
      <Skeleton width={40} height={40} borderRadius={borderRadius.md} style={{ marginRight: 12 }} />
      <Box flex={1}>
        <Skeleton width="80%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={16} />
      </Box>
    </Box>
  </Box>
);

export const ChartSkeleton = () => (
  <Box alignItems="center" justifyContent="center" height={300}>
    <Skeleton width={200} height={200} borderRadius={100} style={{ marginBottom: 20 }} />
    <Box flexDirection="row" justifyContent="space-around" width="100%">
      <Skeleton width={80} height={40} />
      <Skeleton width={80} height={40} />
    </Box>
  </Box>
);
