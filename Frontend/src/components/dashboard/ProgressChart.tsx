import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants/theme';

interface ProgressChartData {
  day: string;
  value: number;
  maxValue?: number;
}

interface ProgressChartProps {
  data: ProgressChartData[];
  title?: string;
  style?: ViewStyle;
  maxValue?: number;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  title = 'Weekly Progress',
  style,
  maxValue = 100,
}) => {
  const chartMaxValue = maxValue || Math.max(...data.map(d => d.value || 0));

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const heightPercentage = (item.value / chartMaxValue) * 100;

          return (
            <View key={index} style={styles.barWrapper}>
              <Text style={styles.barValue}>
                {item.value > 0 ? item.value : '—'}
              </Text>

              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPercentage}%` },
                  ]}
                />
              </View>

              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          );
        })}
      </View>

      {/* Chart Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={styles.legendColor} />
          <Text style={styles.legendText}>Reps Completed</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
    marginBottom: 16,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    height: 16,
  },
  barBackground: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.primaryLight,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
