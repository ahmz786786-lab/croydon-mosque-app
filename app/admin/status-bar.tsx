import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getStatusBar, updateStatusBar } from '@/services/supabase';
import AnnouncementTicker from '@/components/AnnouncementTicker';

export default function StatusBarAdmin() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState(['', '', '', '']);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    loadStatusBar();
  }, []);

  const loadStatusBar = async () => {
    setLoading(true);
    try {
      const data = await getStatusBar();
      if (data) {
        setMessages([
          data.message || '',
          data.message_2 || '',
          data.message_3 || '',
          data.message_4 || '',
        ]);
        setIsActive(data.is_active);
      }
    } catch (error) {
      console.error('Error loading status bar:', error);
      Alert.alert('Error', 'Failed to load status bar settings');
    } finally {
      setLoading(false);
    }
  };

  const updateMessage = (index: number, text: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateStatusBar(
        {
          message: messages[0],
          message_2: messages[1],
          message_3: messages[2],
          message_4: messages[3],
        },
        isActive
      );
      if (success) {
        Alert.alert('Success', 'Status bar updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update status bar');
      }
    } catch (error) {
      console.error('Error saving status bar:', error);
      Alert.alert('Error', 'Failed to update status bar');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setMessages(['', '', '', '']);
    setIsActive(false);
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

  const filledMessages = messages.filter((m) => m.trim().length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Status Bar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Preview */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preview</Text>
        {isActive && filledMessages.length > 0 ? (
          <AnnouncementTicker messages={messages} colors={colors} />
        ) : (
          <View style={[styles.previewEmpty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="eye-off-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.previewEmptyText, { color: colors.textSecondary }]}>
              Status bar is currently hidden
            </Text>
          </View>
        )}

        {/* Toggle */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Show Status Bar</Text>
              <Text style={[styles.fieldDescription, { color: colors.textSecondary }]}>
                Display cycling messages on the home screen
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Message Inputs */}
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Message {index + 1}</Text>
            <TextInput
              style={[styles.input, {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
              }]}
              value={messages[index]}
              onChangeText={(text) => updateMessage(index, text)}
              placeholder={`Enter message ${index + 1} (leave empty to skip)`}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {messages[index].length} characters
            </Text>
          </View>
        ))}

        {/* Info */}
        <View style={[styles.noticeCard, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            Messages cycle every 5 seconds on the home screen. Empty messages are skipped. Changes are published immediately to all users.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: colors.border }]}
            onPress={handleClear}
          >
            <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>Clear All & Hide</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  previewEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  previewEmptyText: {
    fontSize: 13,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
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
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  fieldDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  input: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 60,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
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
  clearBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearBtnText: {
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
});
