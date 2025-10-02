import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Linking,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Image,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ContainerComponent,
  TextComponent,
  ButtonComponent,
  InputComponent,
} from '../../components';
import { appColors, appFonts } from '../../constants';
import { ModalNotification, LoadingModal } from '../../modals';
import { showError, showSuccess } from '../../utils/toastMessages';
import axiosClient from '../../apis/axiosClient';

import {
  launchCamera,
  launchImageLibrary,
  Asset,
  ImageLibraryOptions,
  CameraOptions,
} from 'react-native-image-picker';

type Props = { navigation: any };

const CATEGORIES = [
  { key: 'payment', label: 'Payment / Refund' },
  { key: 'order', label: 'Order Issue' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'account', label: 'Account' },
  { key: 'other', label: 'Other' },
] as const;

const SUPPORT_EMAIL = 'hungrynow2502@gmail.com';
const SUPPORT_PHONE = '0987654321';
const SUPPORT_ZALO = 'https://zalo.me/0982922682';

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;

type PickedFile = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

const HelpCenterScreen: React.FC<Props> = ({ navigation }) => {
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]['key']>('other');
  const [subject, setSubject] = useState('Need support');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);

  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const openURL = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      showError('Cannot open link on this device.');
    });
  }, []);

  const handleCall = () => openURL(`tel:${SUPPORT_PHONE}`);
  const handleEmail = () => {
    const s = subject.trim();
    const m = message.trim();
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      s,
    )}&body=${encodeURIComponent(m)}`;
    openURL(mailto);
  };
  const handleChat = () => openURL(SUPPORT_ZALO);

  const pushAssets = (assets?: Asset[]) => {
    if (!assets?.length) return;

    const mapped = assets
      .map(a => {
        if (!a.uri) return null;
        const type = a.type || 'image/jpeg';
        const name =
          a.fileName ||
          `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.${
            type.split('/')[1] || 'jpg'
          }`;
        return {
          uri: a.uri,
          type,
          name,
          size: a.fileSize,
        } as PickedFile;
      })
      .filter(Boolean) as PickedFile[];

    const over = mapped.find(f => (f.size || 0) > MAX_SIZE);
    if (over) {
      showError('Each image must be ≤ 5MB.');
      return;
    }
    setFiles(prev => {
      const next = [...prev, ...mapped].slice(0, MAX_FILES);
      if (next.length < prev.length + mapped.length) {
        showError(`Max ${MAX_FILES} images allowed.`);
      }
      return next;
    });
  };

  const pickFromLibrary = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: MAX_FILES - files.length,
      includeBase64: false,
    };
    const res = await launchImageLibrary(options);
    if (res.didCancel) return;
    if (res.errorCode) {
      showError(res.errorMessage || 'Open library failed.');
      return;
    }
    pushAssets(res.assets);
  };

  const takePhoto = async () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      saveToPhotos: true,
      includeBase64: false,
    };
    const res = await launchCamera(options);
    if (res.didCancel) return;
    if (res.errorCode) {
      showError(res.errorMessage || 'Open camera failed.');
      return;
    }
    pushAssets(res.assets);
  };

  const removeFile = (index: number) =>
    setFiles(prev => prev.filter((_, i) => i !== index));

  const resetForm = useCallback(() => {
    setCategory('other');
    setSubject('Need support');
    setMessage('');
    setFiles([]);
  }, []);

  const handleSubmit = async () => {
    if (loading) return;

    const s = subject.trim();
    const m = message.trim();
    if (!s || !m) {
      showError('Please fill in subject and message.');
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append('subject', s);
      fd.append('message', m);
      fd.append('category', category);

      files.forEach(f => {
        fd.append('files', {
          uri: f.uri,
          name: f.name,
          type: f.type,
        } as any);
      });

      await axiosClient.post('/support/send-email', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      resetForm();
      Keyboard.dismiss();
      setConfirmVisible(true);
      showSuccess('Your request was submitted.');
    } catch (err: any) {
      showError(err?.message || 'Failed to submit your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContainerComponent title="Help Center" back isScroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <Ionicons name="help-buoy" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <TextComponent
                text="Need help?"
                size={16}
                font={appFonts.semiBold}
              />
              <TextComponent
                text="We’re here to help with orders, payments, and more."
                size={12}
                color={appColors.gray}
                styles={{ marginTop: 2 }}
              />
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            <QuickAction
              icon="chatbubbles-outline"
              text="Live Chat"
              onPress={handleChat}
            />
            <QuickAction icon="call-outline" text="Call" onPress={handleCall} />
            <QuickAction
              icon="mail-outline"
              text="Email"
              onPress={handleEmail}
            />
          </View>

          {/* Category pills */}
          <TextComponent
            text="Category"
            size={13}
            color={appColors.gray}
            styles={{ marginTop: 12 }}
          />
          <View style={styles.pillsRow}>
            {CATEGORIES.map(c => {
              const active = category === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setCategory(c.key)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Category ${c.label}`}
                >
                  <TextComponent
                    text={c.label}
                    size={12}
                    font={appFonts.semiBold}
                    color={active ? appColors.orange : '#6b7280'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subject */}
          <TextComponent
            text="Subject"
            size={13}
            color={appColors.gray}
            styles={{ marginTop: 12 }}
          />
          <InputComponent
            placeholder="Brief summary"
            value={subject}
            onChange={setSubject}
            styles={{ marginTop: 6 }}
          />

          {/* Message */}
          <TextComponent
            text="Message"
            size={13}
            color={appColors.gray}
            styles={{ marginTop: 12 }}
          />
          <InputComponent
            placeholder="Describe your issue in detail…"
            value={message}
            onChange={setMessage}
            styles={{ marginTop: 6 }}
          />

          {/* Attachments */}
          <TextComponent
            text="Attachments (optional)"
            size={13}
            color={appColors.gray}
            styles={{ marginTop: 12 }}
          />
          <View style={styles.attachRow}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={pickFromLibrary}
            >
              <Ionicons
                name="images-outline"
                size={18}
                color={appColors.orange}
              />
              <TextComponent
                text="Photo Library"
                size={12}
                font={appFonts.semiBold}
                styles={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={takePhoto}>
              <Ionicons
                name="camera-outline"
                size={18}
                color={appColors.orange}
              />
              <TextComponent
                text="Camera"
                size={12}
                font={appFonts.semiBold}
                styles={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>

          {/* Thumbnails Preview */}
          {!!files.length && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10 }}
            >
              <View style={styles.thumbRow}>
                {files.map((f, idx) => (
                  <View key={idx} style={styles.thumbWrap}>
                    <Image source={{ uri: f.uri }} style={styles.thumb} />
                    <TouchableOpacity
                      style={styles.rmBadge}
                      onPress={() => removeFile(idx)}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Submit */}
          <ButtonComponent
            text={loading ? 'Submitting…' : 'Submit request'}
            type="primary"
            color={appColors.orange}
            onPress={handleSubmit}
            styles={styles.submitBtn}
            disable={loading}
          />

          {/* Helpful tips */}
          <View style={styles.helpBox}>
            <Ionicons name="book-outline" size={18} color="#2563eb" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <TextComponent
                text="Helpful tips"
                size={13}
                font={appFonts.semiBold}
                color="#1f2937"
              />
              <TextComponent
                text={`• How refunds work with ZaloPay
• Change or cancel an order
• Delivery ETA and tracking`}
                size={12}
                color={appColors.gray}
                styles={{ marginTop: 4 }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirm modal */}
      <ModalNotification
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title="Request submitted"
        message="Our team will reach out to you soon. You can also check your email for a confirmation."
        variant="success"
        actions={[{ label: 'Close', style: 'primary' }]}
        accessibilityLabel="Support request submitted"
      />

      <LoadingModal visible={loading} />
    </ContainerComponent>
  );
};

const QuickAction = ({
  icon,
  text,
  onPress,
}: {
  icon: string;
  text: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      style={styles.quick}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={text}
    >
      <View style={styles.quickIcon}>
        <Ionicons name={icon as any} size={20} color={appColors.orange} />
      </View>
      <TextComponent text={text} size={12} font={appFonts.semiBold} />
    </TouchableOpacity>
  );
};

export default HelpCenterScreen;

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 28 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef0f4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: appColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  quick: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eef0f4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pillActive: {
    backgroundColor: '#fff7ed',
    borderColor: appColors.orange,
  },
  attachRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  thumbWrap: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  thumb: { width: '100%', height: '100%' },
  rmBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0009',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    width: '100%',
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
});
