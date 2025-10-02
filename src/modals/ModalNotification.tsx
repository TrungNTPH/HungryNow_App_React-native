import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ActivityIndicator,
  ScrollView,
  AccessibilityInfo,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { appColors, appFonts } from '../constants';
import { TextComponent } from '../components';

export type Variant = 'success' | 'error' | 'info' | 'warning';

export interface ModalNotificationAction {
  label: string;
  onPress?: () => Promise<void> | void;
  style?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  accessibilityLabel?: string;
}

export interface ModalNotificationProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  message?: string;
  children?: React.ReactNode;
  variant?: Variant;
  showCloseIcon?: boolean;
  actions?: ModalNotificationAction[];
  autoDismiss?: boolean;
  dismissTimeout?: number;
  closeOnBackdropPress?: boolean;
  accessibilityLabel?: string;
  showProgress?: boolean;
}

const DEFAULT_COLORS: Record<Variant, string> = {
  success: '#28A745',
  error: '#D9534F',
  info: '#2F80ED',
  warning: '#F2994A',
};

function getVariantColor(v: Variant) {
  const colorsAsAny = appColors as any;
  return (
    colorsAsAny?.[v] ??
    (v === 'success' ? colorsAsAny?.success : undefined) ??
    DEFAULT_COLORS[v]
  );
}

const VariantIcon: React.FC<{
  variant: Variant;
  color: string;
  size?: number;
}> = ({ variant, color, size = 28 }) => {
  switch (variant) {
    case 'success':
      return <Ionicons name="checkmark-circle" size={size} color={color} />;
    case 'error':
      return <MaterialIcons name="error" size={size} color={color} />;
    case 'info':
      return <Ionicons name="information-circle" size={size} color={color} />;
    case 'warning':
      return <Ionicons name="warning" size={size} color={color} />;
    default:
      return <Ionicons name="information-circle" size={size} color={color} />;
  }
};

const ModalNotification: React.FC<ModalNotificationProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  message,
  children,
  variant = 'info',
  showCloseIcon = true,
  actions,
  autoDismiss = false,
  dismissTimeout = 3000,
  closeOnBackdropPress = true,
  accessibilityLabel,
  showProgress = false,
}) => {
  const [open, setOpen] = useState<boolean>(visible);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.96);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setOpen(true);
      AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
        if (enabled && title) AccessibilityInfo.announceForAccessibility(title);
      });

      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
      scale.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });

      if (autoDismiss) {
        progress.value = 0;
        progress.value = withTiming(
          1,
          { duration: dismissTimeout },
          finished => {
            if (finished) runOnJS(handleClose)();
          },
        );
      }
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 });
      scale.value = withTiming(0.96, { duration: 200 });
      progress.value = 0;
      setTimeout(() => setOpen(false), 200);
    }
  }, [visible]);

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(20, { duration: 200 });
    scale.value = withTiming(0.96, { duration: 200 });
    progress.value = 0;
    setTimeout(() => {
      setOpen(false);
      setLoadingIndex(null);
      onClose && onClose();
    }, 200);
  };

  const handleActionPress = async (
    action: ModalNotificationAction,
    index: number,
  ) => {
    if (action.disabled) return;
    setLoadingIndex(index);
    try {
      await action.onPress?.();
    } finally {
      setLoadingIndex(null);
      handleClose();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const color = getVariantColor(variant);
  const isActionsHorizontal = !actions || actions.length <= 2;

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
      accessible
      accessibilityLabel={accessibilityLabel ?? title ?? 'Notification'}
    >
      <TouchableWithoutFeedback
        onPress={closeOnBackdropPress ? handleClose : undefined}
      >
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <Animated.View
              style={[styles.container, animatedStyle]}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {/* Header */}
              <View style={styles.header}>
                <View
                  style={[styles.iconCircle, { backgroundColor: `${color}15` }]}
                >
                  <VariantIcon variant={variant} color={color} size={28} />
                </View>

                <View style={styles.headerTextWrap}>
                  {!!title && (
                    <TextComponent
                      text={title}
                      font={appFonts.semiBold}
                      size={16}
                      color={appColors.text}
                      styles={{ marginBottom: subtitle ? 4 : 0 }}
                    />
                  )}
                  {!!subtitle && (
                    <TextComponent
                      text={subtitle}
                      size={13}
                      color={'#6B6B6B'}
                    />
                  )}
                </View>

                {showCloseIcon && (
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeBtn}
                    accessibilityLabel="Close notification"
                  >
                    <Ionicons name="close" size={20} color={'#6B7280'} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Body */}
              <ScrollView
                style={styles.body}
                contentContainerStyle={{ paddingVertical: 8 }}
              >
                {children ? (
                  children
                ) : (
                  <TextComponent
                    text={message ?? ''}
                    size={14}
                    color={appColors.text}
                    styles={{ lineHeight: 20 }}
                  />
                )}
              </ScrollView>

              {/* Progress */}
              {autoDismiss && showProgress && (
                <View style={styles.progressWrap}>
                  <Animated.View
                    style={[
                      styles.progress,
                      progressStyle,
                      { backgroundColor: color },
                    ]}
                  />
                </View>
              )}

              {/* Actions */}
              <View
                style={[
                  styles.actions,
                  isActionsHorizontal ? styles.actionsRow : styles.actionsCol,
                ]}
              >
                {actions && actions.length > 0 ? (
                  actions.map((a, idx) => {
                    const isPrimary = a.style === 'primary';
                    const isDanger = a.style === 'danger';
                    const isSecondary = a.style === 'secondary';
                    const textColor = isPrimary || isDanger ? '#fff' : color;

                    const baseBtn: (ViewStyle | undefined)[] = [
                      styles.actionBtn,
                      isActionsHorizontal && idx > 0
                        ? { marginLeft: 10 }
                        : undefined,
                      !isActionsHorizontal
                        ? { width: '100%', marginTop: idx > 0 ? 8 : 0 }
                        : undefined,
                    ];

                    if (isPrimary) baseBtn.push({ backgroundColor: color });
                    else if (isDanger)
                      baseBtn.push({
                        backgroundColor:
                          appColors.danger ?? DEFAULT_COLORS.error,
                      });
                    else if (isSecondary)
                      baseBtn.push({
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: color,
                      });

                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleActionPress(a, idx)}
                        disabled={!!a.disabled || loadingIndex !== null}
                        activeOpacity={0.85}
                        style={baseBtn}
                        accessibilityLabel={a.accessibilityLabel ?? a.label}
                      >
                        {loadingIndex === idx ? (
                          <ActivityIndicator size="small" color={textColor} />
                        ) : (
                          <TextComponent
                            text={a.label}
                            size={14}
                            color={textColor}
                            font={appFonts.semiBold}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.85}
                    style={[styles.actionBtn, { backgroundColor: color }]}
                    accessibilityLabel="Close"
                  >
                    <TextComponent
                      text="Close"
                      size={14}
                      color="#fff"
                      font={appFonts.semiBold}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ModalNotification;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,12,20,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 8,
  },
  body: {
    maxHeight: 180,
    marginTop: 10,
  },
  progressWrap: {
    height: 4,
    backgroundColor: '#F2F2F2',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
  },
  progress: {
    height: '100%',
    width: '0%',
  },
  actions: {
    marginTop: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionsCol: {
    flexDirection: 'column',
  },
  actionBtn: {
    minWidth: 96,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
