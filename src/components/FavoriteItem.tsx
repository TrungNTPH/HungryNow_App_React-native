import React, { memo, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TextComponent from './TextComponent';
import { appColors, appFonts } from '../constants';

type Props = {
  name: string;
  price: number;
  imageUrl?: string;
  onDelete: () => void;
  onPress?: (event: GestureResponderEvent) => void;
};

const ACTION_WIDTH = 88;

const FavoriteItem: React.FC<Props> = ({
  name,
  price,
  imageUrl,
  onDelete,
  onPress,
}) => {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <View style={styles.actionsWrap}>
      <RectButton
        style={styles.deleteAction}
        rippleColor="rgba(255,255,255,0.2)"
        onPress={() => {
          swipeRef.current?.close();
          onDelete();
        }}
      >
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={22}
          color="#FF3B30"
        />
        <TextComponent
          text="Delete"
          size={12}
          color="#FF3B30"
          styles={{ marginTop: 4 }}
        />
      </RectButton>
    </View>
  );

  const hasImage = !!imageUrl;

  const Card = (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
      android_ripple={{ color: '#00000010' }}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {hasImage ? (
        <Image source={{ uri: imageUrl! }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <MaterialCommunityIcons
            name="image-outline"
            size={22}
            color="#B5B5B5"
          />
        </View>
      )}

      <View style={styles.info}>
        <TextComponent
          text={name}
          size={15}
          font={appFonts.semiBold}
          styles={styles.name}
        />
        <View style={styles.pricePill}>
          <TextComponent
            text={`${Number(price || 0).toLocaleString()} VND`}
            size={13}
            color={appColors.orange}
            font={appFonts.semiBold}
          />
        </View>
      </View>

      {onPress ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#B5B5B5"
        />
      ) : (
        <View style={{ width: 20 }} />
      )}
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      containerStyle={styles.swipeContainer}
      childrenContainerStyle={{ borderRadius: 14 }}
    >
      {Card}
    </Swipeable>
  );
};

export default memo(FavoriteItem);

const styles = StyleSheet.create({
  swipeContainer: {
    marginVertical: 8,
    borderRadius: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  info: { flex: 1, justifyContent: 'center' },
  name: {
    color: '#222',
    marginBottom: 6,
  },
  pricePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF3E8',
    borderWidth: 1,
    borderColor: '#FFE1C8',
  },
  actionsWrap: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    width: ACTION_WIDTH,
    height: '100%',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
