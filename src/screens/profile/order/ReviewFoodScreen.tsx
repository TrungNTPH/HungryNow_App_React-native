import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import StarRating from 'react-native-star-rating-widget';
import { uploadApi } from '../../../apis/uploadApi';
import { addRatingThunk } from '../../../redux/actions/ratingAction';
import { AppDispatch } from '../../../redux/store';
import {
  ContainerComponent,
  TextComponent,
  ButtonComponent,
} from '../../../components';
import { appColors, appFonts } from '../../../constants';
import { showError, showSuccess } from '../../../utils/toastMessages';
import { ModalNotification, LoadingModal } from '../../../modals';

const MAX_TITLE = 60;
const MAX_MESSAGE = 500;

const snapInt = (v: number) => Math.max(1, Math.min(5, Math.round(v)));

const ReviewFoodScreen = ({ route, navigation }: any) => {
  const { item } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const [ratingTitle, setRatingTitle] = useState('');
  const [ratingMessage, setRatingMessage] = useState('');
  const [stars, setStars] = useState<number>(5);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [leavingGuardVisible, setLeavingGuardVisible] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<null | (() => void)>(null);

  const foodName = item?.itemId?.name || item?.name || 'Unknown Item';
  const sizeName =
    item?.type === 'Food'
      ? item?.foodSizeId?.sizeId?.name ?? item?.size?.name ?? 'Default'
      : 'Combo';
  const qty = item?.quantity ?? 1;
  const imageUrl = item?.itemId?.image || item?.image || '';

  const titleCount = `${ratingTitle.length}/${MAX_TITLE}`;
  const messageCount = `${ratingMessage.length}/${MAX_MESSAGE}`;

  const canSubmit = useMemo(() => !loading, [loading]);

  const isDirty = useMemo(
    () =>
      !!selectedImage ||
      ratingTitle.trim().length > 0 ||
      ratingMessage.trim().length > 0 ||
      stars !== 5,
    [selectedImage, ratingTitle, ratingMessage, stars],
  );

  // Guard leaving screen if there are unsaved changes (hardware back / gestures)
  useEffect(() => {
    const onBeforeRemove = (e: any) => {
      if (!isDirty || leavingGuardVisible) return;
      e.preventDefault();
      setLeavingGuardVisible(true);
      setPendingLeave(() => () => {
        setLeavingGuardVisible(false);
        navigation.dispatch(e.data.action);
      });
    };

    const unsubNav = navigation.addListener('beforeRemove', onBeforeRemove);
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isDirty) return false;
      setLeavingGuardVisible(true);
      setPendingLeave(() => () => navigation.goBack());
      return true;
    });

    return () => {
      unsubNav();
      backSub.remove();
    };
  }, [navigation, isDirty, leavingGuardVisible]);

  const pickImage = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        selectionLimit: 1,
      });
      if (result.didCancel) return;
      if (result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri || null);
      }
    } catch {
      showError('Unable to open gallery.');
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!item?.itemId?._id || !item?.type || !item?.invoiceId) {
      return showError('Missing item information for rating.');
    }

    setLoading(true);
    let imageUrlUploaded = '';
    try {
      if (selectedImage) {
        const res = await uploadApi.uploadImage(selectedImage);
        imageUrlUploaded = res?.imageUrl || '';
      }

      await dispatch(
        addRatingThunk({
          itemId: item.itemId._id,
          itemType: item.type,
          invoiceId: item.invoiceId,
          ratingTitle: ratingTitle.trim(),
          ratingMessage: ratingMessage.trim(),
          stars: snapInt(stars),
          image: imageUrlUploaded,
        }),
      ).unwrap();

      showSuccess('Thanks for your feedback!');
      navigation.goBack();
    } catch {
      showError('Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    dispatch,
    item,
    selectedImage,
    ratingTitle,
    ratingMessage,
    stars,
    navigation,
  ]);

  const starLabel = useMemo(() => {
    const map: Record<number, string> = {
      1: 'Terrible',
      2: 'Poor',
      3: 'Average',
      4: 'Good',
      5: 'Excellent',
    };
    const whole = snapInt(stars);
    return map[whole];
  }, [stars]);

  return (
    <ContainerComponent title="Rate Food" back isScroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header card */}
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Image
                source={
                  imageUrl
                    ? { uri: imageUrl }
                    : require('../../../assets/images/logo.png')
                }
                style={styles.foodImage}
              />
              <View style={{ flex: 1 }}>
                <TextComponent
                  text={foodName}
                  font={appFonts.semiBold}
                  size={16}
                />
                <View style={styles.metaRow}>
                  <View style={styles.chip}>
                    <TextComponent
                      text={sizeName}
                      size={11}
                      color={appColors.gray}
                    />
                  </View>
                  <View style={[styles.chip, { backgroundColor: '#FFF3E8' }]}>
                    <TextComponent
                      text={`x${qty}`}
                      size={11}
                      color={appColors.orange}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.starsWrap}>
              <StarRating
                rating={stars}
                onChange={v => setStars(snapInt(v))}
                starSize={28}
                color={appColors.orange}
                enableHalfStar
                animationConfig={{ scale: 1.08 }}
                starStyle={{ marginHorizontal: 2 }}
              />
              <TextComponent
                text={`You rated ${snapInt(stars)}/5 • ${starLabel}`}
                size={12}
                color="#777"
                styles={{ marginTop: 6 }}
              />
            </View>
          </View>

          {/* Image card */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="image-outline"
                size={18}
                color={appColors.orange}
              />
              <TextComponent
                text="Add an image (optional)"
                size={13}
                color={appColors.gray}
                styles={{ marginLeft: 6 }}
              />
            </View>

            <View style={styles.imageRow}>
              <TouchableOpacity
                style={styles.addImageBtn}
                onPress={pickImage}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color={appColors.orange} />
                <TextComponent
                  text={selectedImage ? 'Change image' : 'Choose image'}
                  size={13}
                  color={appColors.orange}
                  styles={{ marginLeft: 6 }}
                />
              </TouchableOpacity>

              {selectedImage && (
                <View style={styles.previewWrap}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.preview}
                  />
                  <TouchableOpacity
                    style={styles.removeBadge}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Text fields card */}
          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <View style={styles.fieldHeader}>
                <TextComponent text="Review title" size={13} color="#555" />
                <TextComponent text={titleCount} size={11} color="#999" />
              </View>
              <TextInput
                style={styles.input}
                value={ratingTitle}
                onChangeText={v => v.length <= MAX_TITLE && setRatingTitle(v)}
                placeholder="E.g. Tasty and fresh!"
                placeholderTextColor="#AAA"
                accessibilityLabel="Review title"
              />
            </View>

            <View style={{ height: 10 }} />

            <View style={styles.fieldWrap}>
              <View style={styles.fieldHeader}>
                <TextComponent text="Review message" size={13} color="#555" />
                <TextComponent text={messageCount} size={11} color="#999" />
              </View>
              <TextInput
                style={[
                  styles.input,
                  { height: 120, textAlignVertical: 'top' },
                ]}
                value={ratingMessage}
                onChangeText={v =>
                  v.length <= MAX_MESSAGE && setRatingMessage(v)
                }
                placeholder="Share your experience about taste, portion size, packaging, delivery..."
                placeholderTextColor="#AAA"
                multiline
                accessibilityLabel="Review message"
              />
            </View>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Sticky footer */}
        <View style={styles.footer}>
          <RowActions
            canSubmit={canSubmit}
            loading={loading}
            onReset={() => {
              setRatingTitle('');
              setRatingMessage('');
              setSelectedImage(null);
              setStars(5);
            }}
            onSubmit={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Leave-without-saving guard */}
      <ModalNotification
        visible={leavingGuardVisible}
        onClose={() => setLeavingGuardVisible(false)}
        title="Discard review?"
        message="You have unsaved changes. Do you want to leave without submitting?"
        variant="warning"
        actions={[
          {
            label: 'Stay',
            style: 'secondary',
            onPress: () => setLeavingGuardVisible(false),
          },
          {
            label: 'Discard',
            style: 'danger',
            onPress: () => {
              setLeavingGuardVisible(false);
              setRatingTitle('');
              setRatingMessage('');
              setSelectedImage(null);
              setStars(5);
              pendingLeave?.();
              setPendingLeave(null);
            },
          },
        ]}
      />

      {/* Overlay for submit / upload */}
      <LoadingModal visible={loading} />
    </ContainerComponent>
  );
};

export default ReviewFoodScreen;

const RowActions = ({
  canSubmit,
  loading,
  onReset,
  onSubmit,
}: {
  canSubmit: boolean;
  loading: boolean;
  onReset: () => void;
  onSubmit: () => void;
}) => {
  return (
    <View style={styles.actionsRow}>
      <TouchableOpacity
        style={[styles.secondaryBtn, loading && { opacity: 0.6 }]}
        activeOpacity={0.85}
        onPress={onReset}
        disabled={loading}
        accessibilityLabel="Reset review"
      >
        <Ionicons name="refresh" size={16} color={appColors.orange} />
        <TextComponent
          text="Reset"
          size={13}
          color={appColors.orange}
          styles={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      <ButtonComponent
        text={loading ? 'Submitting…' : 'Submit Review'}
        type="primary"
        color={loading ? '#C9C9C9' : appColors.orange}
        onPress={onSubmit}
        styles={[styles.submitBtn, loading && { opacity: 0.8 }]}
        disable={!canSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  foodImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
  },
  starsWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  addImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColors.orange,
    backgroundColor: '#FFF8F0',
  },
  previewWrap: {
    position: 'relative',
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#EEE',
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  removeBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: appColors.orange,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldWrap: {},
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    color: appColors.darkText,
  },
  footer: {
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.orange,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
});
