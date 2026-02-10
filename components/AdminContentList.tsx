import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { supabase } from '@/services/supabase';

export type ContentType = 'announcements' | 'events' | 'janazah' | 'news';

interface ContentItem {
  id: string;
  title: string;
  body?: string;
  description?: string;
  type?: string;
  date?: string;
  time?: string;
  location?: string;
  deceased_name?: string;
  prayer_date?: string;
  prayer_time?: string;
  burial_location?: string;
  image_url?: string;
  created_at: string;
}

interface AdminContentListProps {
  contentType: ContentType;
  title: string;
  color: string;
}

export default function AdminContentList({ contentType, title, color }: AdminContentListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formEventType, setFormEventType] = useState('lecture');
  const [formImage, setFormImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from(contentType)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  }, []);

  const resetForm = () => {
    setFormTitle('');
    setFormBody('');
    setFormDate('');
    setFormTime('');
    setFormLocation('');
    setFormEventType('lecture');
    setFormImage(null);
    setEditingItem(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      // Store both URI for preview and base64 for upload
      const asset = result.assets[0];
      setFormImage(asset.uri);
      // Store base64 in a ref or state for upload
      (global as any).pendingImageBase64 = asset.base64;
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setUploadingImage(true);

      // Get base64 data from global storage
      const base64Data = (global as any).pendingImageBase64;
      if (!base64Data) {
        Alert.alert('Error', 'No image data found. Please select the image again.');
        return null;
      }

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `events/${fileName}`;

      // Upload using base64 decode
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, decode(base64Data), {
          contentType: `image/${fileExt}`,
        });

      // Clear the stored base64
      (global as any).pendingImageBase64 = null;

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload Error', uploadError.message);
        return null;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Base64 decode function for React Native
  function decode(base64: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const bufferLength = base64.length * 0.75;
    const bytes = new Uint8Array(bufferLength);
    let p = 0;

    for (let i = 0; i < base64.length; i += 4) {
      const encoded1 = chars.indexOf(base64[i]);
      const encoded2 = chars.indexOf(base64[i + 1]);
      const encoded3 = chars.indexOf(base64[i + 2]);
      const encoded4 = chars.indexOf(base64[i + 3]);

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return bytes;
  }

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item: ContentItem) => {
    setEditingItem(item);
    setFormTitle(item.title || item.deceased_name || '');
    setFormBody(item.body || item.description || '');
    setFormDate(item.date || item.prayer_date || '');
    setFormTime(item.time || item.prayer_time || '');
    setFormLocation(item.location || item.burial_location || '');
    setFormEventType(item.type || 'lecture');
    setFormImage(item.image_url || null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editingItem?.image_url || null;

      // Upload new image if selected (only for events)
      if (contentType === 'events' && formImage && formImage !== editingItem?.image_url) {
        const uploadedUrl = await uploadImage(formImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      let payload: any = {};

      if (contentType === 'announcements' || contentType === 'news') {
        payload = { title: formTitle, body: formBody, type: contentType === 'announcements' ? 'announcement' : 'news' };
      } else if (contentType === 'events') {
        if (!formDate) {
          Alert.alert('Error', 'Please enter event date');
          setSaving(false);
          return;
        }
        payload = {
          title: formTitle,
          description: formBody,
          date: formDate,
          time: formTime || null,
          location: formLocation || null,
          type: formEventType,
          image_url: imageUrl,
        };
      } else if (contentType === 'janazah') {
        payload = {
          title: formTitle,
          deceased_name: formTitle,
          body: formBody,
          description: formBody,
          prayer_date: formDate || null,
          date: formDate || null,
          prayer_time: formTime || null,
          time: formTime || null,
          burial_location: formLocation || null,
          location: formLocation || null,
          type: 'janazah',
        };
      }

      if (editingItem) {
        const { error } = await supabase.from(contentType).update(payload).eq('id', editingItem.id);
        if (error) throw error;
        Alert.alert('Success', 'Updated successfully');
      } else {
        const { error } = await supabase.from(contentType).insert([payload]);
        if (error) throw error;
        Alert.alert('Success', 'Created successfully');
      }

      setShowModal(false);
      resetForm();
      loadContent();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: ContentItem) => {
    Alert.alert('Delete', `Are you sure you want to delete "${item.title || item.deceased_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from(contentType).delete().eq('id', item.id);
            if (error) throw error;
            loadContent();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderItem = ({ item }: { item: ContentItem }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.itemImage} />
      )}
      <View style={styles.itemHeader}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title || item.deceased_name}
        </Text>
        <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>

      {(item.body || item.description) && (
        <Text style={[styles.itemBody, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.body || item.description}
        </Text>
      )}

      {(item.date || item.prayer_date) && (
        <View style={styles.itemMeta}>
          <Ionicons name="calendar" size={14} color={color} />
          <Text style={[styles.itemMetaText, { color: colors.textSecondary }]}>
            {formatDate(item.date || item.prayer_date || '')}
            {(item.time || item.prayer_time) && ` at ${item.time || item.prayer_time}`}
          </Text>
        </View>
      )}

      {(item.location || item.burial_location) && (
        <View style={styles.itemMeta}>
          <Ionicons name="location" size={14} color={color} />
          <Text style={[styles.itemMetaText, { color: colors.textSecondary }]}>
            {item.location || item.burial_location}
          </Text>
        </View>
      )}

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: color + '15' }]}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil" size={16} color={color} />
          <Text style={[styles.actionBtnText, { color }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FF525215' }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={16} color="#FF5252" />
          <Text style={[styles.actionBtnText, { color: '#FF5252' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForm = () => {
    const isEvent = contentType === 'events';
    const isJanazah = contentType === 'janazah';

    return (
      <>
        {isEvent && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>Event Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {['lecture', 'class', 'community', 'special'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    { backgroundColor: formEventType === type ? color : colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => setFormEventType(type)}
                >
                  <Text style={[styles.chipText, { color: formEventType === type ? '#FFF' : colors.text }]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.text }]}>Event Image</Text>
            <TouchableOpacity
              style={[styles.imagePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {formImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: formImage }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setFormImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerContent}>
                  <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                  <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>
                    Tap to select event image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        <Text style={[styles.label, { color: colors.text }]}>
          {isJanazah ? 'Deceased Name *' : 'Title *'}
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder={isJanazah ? 'Full name of the deceased...' : 'Enter title...'}
          placeholderTextColor={colors.textSecondary}
          value={formTitle}
          onChangeText={setFormTitle}
        />

        <Text style={[styles.label, { color: colors.text }]}>
          {isEvent ? 'Description' : isJanazah ? 'Details / Message' : 'Content'}
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder={isJanazah ? "Inna lillahi wa inna ilayhi raji'un..." : 'Enter content...'}
          placeholderTextColor={colors.textSecondary}
          value={formBody}
          onChangeText={setFormBody}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {(isEvent || isJanazah) && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>
              {isJanazah ? 'Prayer Date' : 'Date *'} (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="2025-03-15"
              placeholderTextColor={colors.textSecondary}
              value={formDate}
              onChangeText={setFormDate}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              {isJanazah ? 'Prayer Time' : 'Time'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder={isJanazah ? 'e.g. After Zuhr' : 'e.g. 7:00 PM'}
              placeholderTextColor={colors.textSecondary}
              value={formTime}
              onChangeText={setFormTime}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              {isJanazah ? 'Burial Location' : 'Location'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder={isJanazah ? 'e.g. Croydon Cemetery' : 'e.g. Main Hall'}
              placeholderTextColor={colors.textSecondary}
              value={formLocation}
              onChangeText={setFormLocation}
            />
          </>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="documents-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No {title.toLowerCase()} yet
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: color }]}
              onPress={openCreateModal}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.emptyBtnText}>Create First</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color} />
        }
      />

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: color }]} onPress={openCreateModal}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingItem ? 'Edit' : 'New'} {title.slice(0, -1)}
                </Text>
                <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {renderForm()}
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.modalBtn, { borderColor: colors.border }]}
                  onPress={() => { setShowModal(false); resetForm(); }}
                >
                  <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: color }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                      {editingItem ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },

  // Item Card
  itemCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  itemHeader: { marginBottom: 8 },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemDate: { fontSize: 12, marginTop: 4 },
  itemBody: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  itemMetaText: { fontSize: 13 },
  itemActions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12, marginBottom: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 6 },
  emptyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },

  // Form
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { height: 100, paddingTop: 14 },
  chipScroll: { marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 13, fontWeight: '600' },

  // Image Picker
  imagePicker: { borderWidth: 1, borderRadius: 12, borderStyle: 'dashed', overflow: 'hidden', marginBottom: 8 },
  imagePickerContent: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  imagePickerText: { fontSize: 14, marginTop: 8 },
  imagePreviewContainer: { position: 'relative' },
  imagePreview: { width: '100%', height: 180, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFF', borderRadius: 12 },
  itemImage: { width: '100%', height: 140, borderRadius: 8, marginBottom: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { maxHeight: '90%' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { padding: 20, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalBtnPrimary: { borderWidth: 0 },
  modalBtnText: { fontSize: 16, fontWeight: '600' },
});
