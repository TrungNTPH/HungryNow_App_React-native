import React from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RowComponent, SectionComponent, TextComponent } from './index';

interface RatingItemProps {
  item: {
    id: string;
    username: string;
    rating: number;
    comment: string;
    image?: string;
    userAvatar?: string;
  };
  onPress?: () => void;
}

const clampRating = (r?: number) => Math.max(0, Math.min(5, Number(r ?? 0)));

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
  return (first + last).toUpperCase();
};

const Stars = ({ value }: { value: number }) => {
  const full = Math.floor(value);
  const half = value - full >= 0.5 ? 1 : 0;
  return (
    <RowComponent>
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const name =
          idx <= full
            ? 'star'
            : idx === full + 1 && half
            ? 'star-half'
            : 'star-border';
        return (
          <MaterialIcons key={idx} name={name} size={16} color="#FFA500" />
        );
      })}
    </RowComponent>
  );
};

const RatingItemComponent: React.FC<RatingItemProps> = ({ item, onPress }) => {
  const rating = clampRating(item.rating);
  const hasAvatar = !!item.userAvatar;
  const hasImage = !!item.image;

  return (
    <SectionComponent>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: '#00000010' }}
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.995 }] },
        ]}
      >
        {hasAvatar ? (
          <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <TextComponent
              text={getInitials(item.username)}
              size={12}
              color="#444"
            />
          </View>
        )}

        <View style={styles.content}>
          <RowComponent justify="space-between" styles={styles.headerRow}>
            <TextComponent
              text={item.username}
              size={14}
              font="appFonts.semiBold"
              color="#222"
            />

            <RowComponent styles={{ alignItems: 'center', gap: 6 }}>
              <Stars value={rating} />
              <View style={styles.ratingPill}>
                <TextComponent
                  text={rating.toFixed(1)}
                  size={11}
                  color="#333"
                />
              </View>
            </RowComponent>
          </RowComponent>

          {!!item.comment && (
            <TextComponent
              text={item.comment}
              size={13}
              color="#444"
              styles={styles.comment}
            />
          )}

          {hasImage && (
            <Image source={{ uri: item.image }} style={styles.reviewImage} />
          )}
        </View>
      </Pressable>
    </SectionComponent>
  );
};

export default RatingItemComponent;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    marginBottom: 4,
  },
  ratingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FFF3E8',
    borderWidth: 1,
    borderColor: '#FFE1C8',
  },
  comment: {
    lineHeight: 18,
  },
  reviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#F5F5F5',
  },
});
