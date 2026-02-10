import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  getIslamicDateSettings,
  updateIslamicDateSettings,
  IslamicDateSettings,
} from '@/services/supabase';
import { gregorianToHijri } from '@/utils/hijriDate';

const HIJRI_MONTHS = [
  { value: 1, label: 'Muharram', arabic: 'محرم' },
  { value: 2, label: 'Safar', arabic: 'صفر' },
  { value: 3, label: "Rabi al-Awwal", arabic: 'ربيع الأول' },
  { value: 4, label: "Rabi al-Thani", arabic: 'ربيع الثاني' },
  { value: 5, label: "Jumada al-Awwal", arabic: 'جمادى الأولى' },
  { value: 6, label: "Jumada al-Thani", arabic: 'جمادى الثانية' },
  { value: 7, label: 'Rajab', arabic: 'رجب' },
  { value: 8, label: "Sha'ban", arabic: 'شعبان' },
  { value: 9, label: 'Ramadan', arabic: 'رمضان' },
  { value: 10, label: 'Shawwal', arabic: 'شوال' },
  { value: 11, label: "Dhu al-Qi'dah", arabic: 'ذو القعدة' },
  { value: 12, label: 'Dhu al-Hijjah', arabic: 'ذو الحجة' },
];

type PickerType = 'day' | 'month' | 'year' | null;

export default function IslamicDateAdmin() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<IslamicDateSettings | null>(null);
  const [pickerVisible, setPickerVisible] = useState<PickerType>(null);

  // Form state
  const [dayAdjustment, setDayAdjustment] = useState(0);
  const [manualEnabled, setManualEnabled] = useState(false);
  const [manualDay, setManualDay] = useState(1);
  const [manualMonth, setManualMonth] = useState(1);
  const [manualYear, setManualYear] = useState(1446);

  // Get calculated Hijri date for preview
  const calculatedHijri = gregorianToHijri();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getIslamicDateSettings();
      if (data) {
        setSettings(data);
        setDayAdjustment(data.day_adjustment || 0);
        setManualEnabled(data.manual_date_enabled || false);
        setManualDay(data.manual_day || calculatedHijri.day);
        setManualMonth(data.manual_month || calculatedHijri.month);
        setManualYear(data.manual_year || calculatedHijri.year);
      } else {
        // Initialize with calculated date
        setManualDay(calculatedHijri.day);
        setManualMonth(calculatedHijri.month);
        setManualYear(calculatedHijri.year);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load Islamic date settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateIslamicDateSettings({
        day_adjustment: dayAdjustment,
        manual_date_enabled: manualEnabled,
        manual_day: manualEnabled ? manualDay : null,
        manual_month: manualEnabled ? manualMonth : null,
        manual_year: manualEnabled ? manualYear : null,
      });

      if (success) {
        Alert.alert('Success', 'Islamic date settings saved successfully');
      } else {
        Alert.alert('Error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getPreviewDate = () => {
    if (manualEnabled) {
      const month = HIJRI_MONTHS.find(m => m.value === manualMonth);
      return `${manualDay} ${month?.label || ''} ${manualYear} AH`;
    }

    // Apply day adjustment to calculated date
    const adjustedDay = calculatedHijri.day + dayAdjustment;
    return `${adjustedDay} ${calculatedHijri.monthName} ${calculatedHijri.year} AH`;
  };

  const resetToCalculated = () => {
    setDayAdjustment(0);
    setManualEnabled(false);
    setManualDay(calculatedHijri.day);
    setManualMonth(calculatedHijri.month);
    setManualYear(calculatedHijri.year);
  };

  const getPickerData = () => {
    switch (pickerVisible) {
      case 'day':
        return Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
      case 'month':
        return HIJRI_MONTHS.map(m => ({ value: m.value, label: `${m.value}. ${m.label}` }));
      case 'year':
        return Array.from({ length: 10 }, (_, i) => {
          const year = calculatedHijri.year - 1 + i;
          return { value: year, label: String(year) };
        });
      default:
        return [];
    }
  };

  const handlePickerSelect = (value: number) => {
    switch (pickerVisible) {
      case 'day':
        setManualDay(value);
        break;
      case 'month':
        setManualMonth(value);
        break;
      case 'year':
        setManualYear(value);
        break;
    }
    setPickerVisible(null);
  };

  const getPickerTitle = () => {
    switch (pickerVisible) {
      case 'day': return 'Select Day';
      case 'month': return 'Select Month';
      case 'year': return 'Select Year';
      default: return '';
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Islamic Date Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Preview Card */}
        <View style={[styles.previewCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.previewLabel}>Current Display Date</Text>
          <Text style={styles.previewDate}>{getPreviewDate()}</Text>
          <Text style={styles.previewNote}>
            {manualEnabled ? 'Using manual override' :
             dayAdjustment !== 0 ? `Adjusted by ${dayAdjustment > 0 ? '+' : ''}${dayAdjustment} day(s)` :
             'Using calculated date'}
          </Text>
        </View>

        {/* Calculated Date Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="calculator-outline" size={20} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Calculated Hijri Date</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {calculatedHijri.formatted}
            </Text>
          </View>
        </View>

        {/* Day Adjustment */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Day Adjustment</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Adjust the calculated date by +/- days to match local moon sighting
          </Text>

          <View style={styles.adjustmentRow}>
            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: manualEnabled ? colors.border : colors.primary }]}
              onPress={() => setDayAdjustment(Math.max(-2, dayAdjustment - 1))}
              disabled={manualEnabled}
            >
              <Ionicons name="remove" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={[styles.adjustValue, { backgroundColor: colors.background }]}>
              <Text style={[styles.adjustValueText, { color: colors.text }]}>
                {dayAdjustment > 0 ? '+' : ''}{dayAdjustment}
              </Text>
              <Text style={[styles.adjustValueLabel, { color: colors.textSecondary }]}>
                day(s)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: manualEnabled ? colors.border : colors.primary }]}
              onPress={() => setDayAdjustment(Math.min(2, dayAdjustment + 1))}
              disabled={manualEnabled}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Manual Override */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Manual Override</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Set a specific Islamic date manually
              </Text>
            </View>
            <Switch
              value={manualEnabled}
              onValueChange={setManualEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {manualEnabled && (
            <View style={styles.manualDateContainer}>
              {/* Day Selector */}
              <TouchableOpacity
                style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setPickerVisible('day')}
              >
                <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Day</Text>
                <View style={styles.selectorValue}>
                  <Text style={[styles.selectorValueText, { color: colors.text }]}>{manualDay}</Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>

              {/* Month Selector */}
              <TouchableOpacity
                style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setPickerVisible('month')}
              >
                <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Month</Text>
                <View style={styles.selectorValue}>
                  <Text style={[styles.selectorValueText, { color: colors.text }]}>
                    {HIJRI_MONTHS.find(m => m.value === manualMonth)?.label || ''}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>

              {/* Year Selector */}
              <TouchableOpacity
                style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setPickerVisible('year')}
              >
                <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Year</Text>
                <View style={styles.selectorValue}>
                  <Text style={[styles.selectorValueText, { color: colors.text }]}>{manualYear} AH</Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Important Notice */}
        <View style={[styles.noticeCard, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            Changes will be reflected immediately for all app users. Use this to align with local mosque's moon sighting decision.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: colors.border }]}
            onPress={resetToCalculated}
          >
            <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Reset to Calculated</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Picker Modal */}
      <Modal
        visible={pickerVisible !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(null)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{getPickerTitle()}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={getPickerData()}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const isSelected =
                  (pickerVisible === 'day' && item.value === manualDay) ||
                  (pickerVisible === 'month' && item.value === manualMonth) ||
                  (pickerVisible === 'year' && item.value === manualYear);

                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => handlePickerSelect(item.value)}
                  >
                    <Text style={[
                      styles.modalItemText,
                      { color: isSelected ? colors.primary : colors.text },
                      isSelected && { fontWeight: '700' },
                    ]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.modalList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  previewCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewDate: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  previewNote: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  adjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustValue: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  adjustValueText: {
    fontSize: 28,
    fontWeight: '700',
  },
  adjustValueLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  manualDateContainer: {
    marginTop: 20,
    gap: 12,
  },
  selectorBtn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorValueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noticeCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
  resetBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalList: {
    paddingBottom: 30,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
});
