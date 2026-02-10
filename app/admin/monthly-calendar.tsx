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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { supabase, getMonthlyCalendar, updateMonthlyCalendar } from '@/services/supabase';

export default function MonthlyCalendarAdmin() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    loadCalendar();
  }, []);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const data = await getMonthlyCalendar();
      if (data) {
        setTitle(data.title || '');
        setUrl(data.url || '');
        setIsActive(data.is_active);
        if (data.url) {
          const parts = data.url.split('/');
          setFileName(parts[parts.length - 1] || 'Current file');
        }
      }
    } catch (error) {
      console.error('Error loading calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFromBase64 = async (base64: string, name: string, mimeType: string): Promise<string | null> => {
    try {
      setUploading(true);

      const fileExt = name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `calendar/${Date.now()}.${fileExt}`;

      // Decode base64
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const clean = base64.replace(/=+$/, '');
      const bufferLength = Math.floor(clean.length * 3 / 4);
      const bytes = new Uint8Array(bufferLength);
      let p = 0;
      for (let i = 0; i < clean.length; i += 4) {
        const e1 = chars.indexOf(clean[i]);
        const e2 = chars.indexOf(clean[i + 1]);
        const e3 = chars.indexOf(clean[i + 2]);
        const e4 = chars.indexOf(clean[i + 3]);
        bytes[p++] = (e1 << 2) | (e2 >> 4);
        if (e3 !== -1) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
        if (e4 !== -1) bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
      }
      const finalBytes = bytes.slice(0, p);

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, finalBytes, { contentType: mimeType });

      if (uploadError) {
        Alert.alert('Upload Error', uploadError.message);
        return null;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadFromUri = async (uri: string, name: string, mimeType: string): Promise<string | null> => {
    try {
      setUploading(true);

      const fileExt = name.split('.').pop()?.toLowerCase() || 'pdf';
      const filePath = `calendar/${Date.now()}.${fileExt}`;

      // Fetch file as blob then as arraybuffer
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, bytes, { contentType: mimeType });

      if (uploadError) {
        Alert.alert('Upload Error', uploadError.message);
        return null;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const publicUrl = await uploadFromUri(
        file.uri,
        file.name,
        file.mimeType || 'application/pdf'
      );

      if (publicUrl) {
        setUrl(publicUrl);
        setFileName(file.name);
        Alert.alert('Uploaded', 'File uploaded successfully');
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const name = asset.uri.split('/').pop() || 'calendar.jpg';

      if (asset.base64) {
        const publicUrl = await uploadFromBase64(
          asset.base64,
          name,
          asset.mimeType || 'image/jpeg'
        );
        if (publicUrl) {
          setUrl(publicUrl);
          setFileName(name);
          Alert.alert('Uploaded', 'Image uploaded successfully');
        }
      } else {
        // Fallback to URI method
        const publicUrl = await uploadFromUri(asset.uri, name, asset.mimeType || 'image/jpeg');
        if (publicUrl) {
          setUrl(publicUrl);
          setFileName(name);
          Alert.alert('Uploaded', 'Image uploaded successfully');
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a calendar title');
      return;
    }
    if (!url.trim()) {
      Alert.alert('No File', 'Please upload a file first');
      return;
    }
    setSaving(true);
    try {
      const success = await updateMonthlyCalendar(title, url, isActive);
      if (success) {
        Alert.alert('Saved', 'Calendar updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update calendar');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update calendar');
    } finally {
      setSaving(false);
    }
  };

  const isImage = url && (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.webp'));

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
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
        <Text style={styles.headerTitle}>Monthly Calendar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Toggle */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Show in App</Text>
              <Text style={[styles.fieldDescription, { color: colors.textSecondary }]}>
                {isActive ? 'Calendar visible to users' : 'Calendar hidden from users'}
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

        {/* Title */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Calendar Title</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Islamic Calendar 2026"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* File Upload */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Upload File</Text>
          <Text style={[styles.fieldDescription, { color: colors.textSecondary }]}>
            Upload a PDF or image of the calendar
          </Text>

          {/* Current file preview */}
          {url ? (
            <View style={[styles.filePreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {isImage ? (
                <Image source={{ uri: url }} style={styles.previewImage} resizeMode="contain" />
              ) : (
                <View style={styles.fileInfo}>
                  <Ionicons name="document-text" size={32} color={colors.primary} />
                  <Text style={[styles.fileNameText, { color: colors.text }]} numberOfLines={1}>
                    {fileName || 'File uploaded'}
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Upload buttons */}
          <View style={styles.uploadBtns}>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
              onPress={pickDocument}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="document-attach-outline" size={20} color="#FFF" />
                  <Text style={styles.uploadBtnText}>Upload PDF</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: '#4CAF50' }]}
              onPress={pickImage}
              disabled={uploading}
            >
              <Ionicons name="image-outline" size={20} color="#FFF" />
              <Text style={styles.uploadBtnText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving || uploading}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  placeholder: { width: 32 },
  content: { padding: 16, paddingBottom: 32 },
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
  switchLabel: { flex: 1, marginRight: 16 },
  fieldLabel: { fontSize: 16, fontWeight: '700' },
  fieldDescription: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  input: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  filePreview: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  fileNameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  uploadBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
