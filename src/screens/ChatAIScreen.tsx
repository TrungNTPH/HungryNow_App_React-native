import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
  Animated,
  Linking,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Call, DirectInbox, Send2, Trash } from 'iconsax-react-native';
import {
  ContainerComponent,
  InputComponent,
  RowComponent,
  SpaceComponent,
  TextComponent,
} from '../components';
import {
  chatMessagesSelector,
  chatSendingSelector,
  chatErrorSelector,
  appendLocalUserMessage,
} from '../redux/reducer/chatAIReducer';
import {
  sendChatMessageThunk,
  clearChatHistoryThunk,
} from '../redux/actions/chatAIAction';
import { appColors } from '../constants';
import axiosClient from '../apis/axiosClient';
import { useAppSelector } from '../redux/hooks';
import { foodSizeSelector } from '../redux/reducer/foodSizeReducer';
import { fetchFoodSizesThunk } from '../redux/actions/foodSizeAction';
import { navigateToItemDetail } from '../utils/navigateToItemDetail';

type Suggestion = {
  id: string;
  type: 'food' | 'combo' | 'unknown';
  name: string;
  line: string;
};

const STORE_EMAIL = 'hungrynow2502@gmail.com';
const STORE_PHONE = '0987654321';

const isObjectId = (s: string) => /^[0-9a-fA-F]{24}$/.test(s);

const parseSuggestions = (
  text: string,
): { suggestions: Suggestion[]; otherLines: string[] } => {
  const lines = text.split(/\r?\n/);
  const suggestions: Suggestion[] = [];
  const otherLines: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    const isBullet = /^(\*|-)\s+/.test(line);
    if (!isBullet) {
      if (line) otherLines.push(line);
      continue;
    }

    const idMatch = line.match(/['"`]?([0-9a-fA-F]{24})['"`]?/);
    if (!idMatch) {
      otherLines.push(line.replace(/^(\*|-)\s+/, ''));
      continue;
    }
    const id = idMatch[1];

    const typeMatch = line.match(/\b(food|combo)\b/i);
    const type =
      (typeMatch?.[1]?.toLowerCase() as 'food' | 'combo') || 'unknown';

    const afterId = line.slice(line.indexOf(id) + id.length);
    const emDashIdx = afterId.indexOf('—');
    let name = afterId
      .slice(0, emDashIdx >= 0 ? emDashIdx : afterId.length)
      .replace(/^[\s\-–—:]+/, '')
      .replace(/^[`'"]+|[`'"]+$/g, '')
      .trim();

    if (!name) {
      name = line
        .replace(/^(\*|-)\s+/, '')
        .replace(id, '')
        .replace(/^[\s`'":\-–—]+|[\s`'":\-–—]+$/g, '')
        .trim();
    }

    suggestions.push({ id, type, name, line });
  }

  const seen: Record<string, boolean> = {};
  const deDuped = suggestions.filter(
    s => isObjectId(s.id) && (seen[s.id] ? false : (seen[s.id] = true)),
  );

  return { suggestions: deDuped, otherLines };
};

type Product = {
  id: string;
  type: 'food' | 'combo';
  name: string;
  image?: string;
  price?: number;
  oldPrice?: number;
  sold?: number;
};

type ProductWithRaw = Product & { raw?: any };

const unwrap = <T,>(res: any): T => {
  if (res && typeof res === 'object' && 'data' in res) return res.data as T;
  return res as T;
};

const formatVND = (n?: number) => {
  if (typeof n !== 'number') return '';
  try {
    return n.toLocaleString('vi-VN') + ' VND';
  } catch {
    return `${n} VND`;
  }
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <TextComponent
    text={String(children)}
    size={16}
    styles={{ marginBottom: 10 }}
  />
);

const TypingDot = ({ delay = 0 }: { delay?: number }) => {
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -3,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(150),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={[styles.dot, { transform: [{ translateY }], opacity }]}
    />
  );
};

const TypingBubble = () => (
  <View
    style={[
      styles.bubble,
      styles.bubbleBot,
      { flexDirection: 'row', alignItems: 'center' },
    ]}
  >
    <TypingDot delay={0} />
    <TypingDot delay={150} />
    <TypingDot delay={300} />
    <SpaceComponent width={8} />
    <TextComponent text="Composing a reply…" size={13} color={'#6b7280'} />
  </View>
);

const QuickPrompt = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
  >
    <TextComponent text={label} size={13} color={appColors.text} />
  </Pressable>
);

const minPriceFromSizes = (
  foodId: string,
  foodSizes: any[],
): number | undefined => {
  const matched = foodSizes.filter(s => s?.foodId && s.foodId._id === foodId);
  if (!matched.length) return undefined;
  const prices = matched
    .map(s => s?.price)
    .filter((n: any) => typeof n === 'number' && Number.isFinite(n));
  return prices.length ? Math.min(...prices) : undefined;
};

const SuggestionListCard: React.FC<{
  title?: string;
  suggestions: Suggestion[];
  foodSizes: any[];
  onPressItem: (p: ProductWithRaw, all: ProductWithRaw[]) => void;
}> = ({ title, suggestions, foodSizes, onPressItem }) => {
  const [items, setItems] = useState<ProductWithRaw[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!suggestions.length) {
      setItems([]);
      return;
    }

    const ctrl = new AbortController();
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          suggestions.map(async sug => {
            const endpoint =
              sug.type === 'combo' ? `/combos/${sug.id}` : `/foods/${sug.id}`;
            try {
              const raw = await axiosClient.get(endpoint, {
                signal: ctrl.signal,
              });
              const data: any = unwrap(raw);

              const resolvedType: 'food' | 'combo' = (
                sug.type === 'unknown'
                  ? typeof data?.price === 'number'
                    ? 'combo'
                    : 'food'
                  : sug.type
              ) as 'food' | 'combo';

              let price: number | undefined;
              if (resolvedType === 'combo') {
                price =
                  typeof data?.price === 'number' ? data.price : undefined;
              } else {
                price =
                  typeof data?.minPrice === 'number'
                    ? data.minPrice
                    : minPriceFromSizes(sug.id, foodSizes);
              }

              const mapped: ProductWithRaw = {
                id: sug.id,
                type: resolvedType,
                name: data?.name || sug.name,
                image: data?.image,
                price,
                oldPrice:
                  typeof data?.oldPrice === 'number'
                    ? data.oldPrice
                    : undefined,
                sold: typeof data?.sold === 'number' ? data.sold : undefined,
                raw: data,
              };
              return mapped;
            } catch {
              return {
                id: sug.id,
                type: (sug.type === 'unknown' ? 'food' : sug.type) as
                  | 'food'
                  | 'combo',
                name: sug.name,
              } as ProductWithRaw;
            }
          }),
        );

        if (mounted) setItems(results.filter(Boolean));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
      ctrl.abort();
    };
  }, [suggestions.map(s => s.id).join(','), foodSizes.length]);

  return (
    <View style={styles.card}>
      {title ? <SectionTitle>{`✨ ${title}`}</SectionTitle> : null}
      {loading ? (
        <View style={{ paddingVertical: 12 }}>
          <ActivityIndicator size="small" color={appColors.orange} />
        </View>
      ) : null}

      {items.map((p: Product) => {
        const t: 'food' | 'combo' | 'unknown' =
          p?.type === 'food' || p?.type === 'combo' ? p.type : 'unknown';
        const palette =
          t === 'food'
            ? { bg: '#EEF7FF', border: '#D6ECFF', text: '#2F7DD0' }
            : t === 'combo'
            ? { bg: '#F2EEFF', border: '#E4DCFF', text: '#6E56CF' }
            : { bg: '#F3F4F6', border: '#E5E7EB', text: '#4B5563' };

        return (
          <TouchableOpacity
            key={p.id}
            style={styles.cardItem}
            activeOpacity={0.9}
            onPress={() => onPressItem(p, items)}
          >
            <Image
              source={
                p.image
                  ? { uri: p.image }
                  : require('../assets/images/logo.png')
              }
              style={styles.cardThumb}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <RowComponent styles={{ alignItems: 'center' }}>
                <TextComponent
                  text={p.name || (t === 'combo' ? 'Combo' : 'Food')}
                  size={15}
                  color={appColors.text}
                  numberOfLine={1}
                  styles={{ fontWeight: '700' }}
                />
                <View
                  style={[
                    styles.typePill,
                    {
                      backgroundColor: palette.bg,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <TextComponent
                    text={
                      t === 'food'
                        ? 'Food'
                        : t === 'combo'
                        ? 'Combo'
                        : 'Unknown'
                    }
                    size={11}
                    color={palette.text}
                  />
                </View>
              </RowComponent>

              {typeof p.sold === 'number' ? (
                <TextComponent
                  text={`Sold ${p.sold}`}
                  size={12}
                  color={'#6b7280'}
                  styles={{ marginTop: 2 }}
                />
              ) : (
                <SpaceComponent height={2} />
              )}

              <RowComponent styles={{ alignItems: 'baseline' }}>
                {typeof p.price === 'number' ? (
                  <TextComponent
                    text={formatVND(p.price)}
                    size={16}
                    color={appColors.danger}
                    styles={{ fontWeight: '800' }}
                  />
                ) : (
                  <TextComponent
                    text={'Price unavailable'}
                    size={13}
                    color={'#9ca3af'}
                  />
                )}
                {typeof p.oldPrice === 'number' ? (
                  <TextComponent
                    text={formatVND(p.oldPrice)}
                    size={13}
                    color={'#9ca3af'}
                    styles={{
                      marginLeft: 8,
                      textDecorationLine: 'line-through',
                    }}
                  />
                ) : null}
              </RowComponent>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ChatAIScreen = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();

  const messages = useSelector(chatMessagesSelector);
  const sending = useSelector(chatSendingSelector);
  const error = useSelector(chatErrorSelector);

  const foodSizes = useAppSelector(foodSizeSelector);

  useEffect(() => {
    if (!foodSizes || !foodSizes.length) {
      dispatch(fetchFoodSizesThunk());
    }
  }, [dispatch, foodSizes?.length]);

  const [text, setText] = useState('');
  const [showContact, setShowContact] = useState(true);

  const listRef = useRef<FlatList>(null);

  const canSend = useMemo(
    () => text.trim().length > 0 && !sending,
    [text, sending],
  );

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToEnd({ animated: true });
      } catch {}
    });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, scrollToEnd]);

  const onSend = () => {
    const q = text.trim();
    if (!q || sending) return;
    setText('');
    dispatch(appendLocalUserMessage({ content: q }));
    dispatch(sendChatMessageThunk({ question: q }));
  };

  const onClear = () => {
    dispatch(clearChatHistoryThunk());
  };

  const goDetail = (clicked: ProductWithRaw, all: ProductWithRaw[]) => {
    const itemType: 'Food' | 'Combo' =
      clicked.type === 'food' ? 'Food' : 'Combo';

    const rawItem = clicked.raw || {
      _id: clicked.id,
      id: clicked.id,
      name: clicked.name,
      image: clicked.image,
      price: clicked.price,
    };

    const filteredItems = all
      .filter(x => x.id !== clicked.id && x.type === clicked.type)
      .map(x => ({
        ...(x.raw || { _id: x.id, id: x.id, name: x.name, image: x.image }),
        price: x.price,
      }));

    navigateToItemDetail({
      navigation,
      item: rawItem,
      itemType,
      foodSizes,
      allItems: filteredItems,
    });
  };

  const renderAssistantMessage = (content: string, at: number) => {
    const { suggestions, otherLines } = parseSuggestions(content);

    if (suggestions.length > 0) {
      const title = otherLines[0] || 'Everyone loves these items!';
      return (
        <View style={[styles.bubble, styles.bubbleBot]}>
          <SuggestionListCard
            title={title}
            suggestions={suggestions}
            foodSizes={foodSizes}
            onPressItem={goDetail}
          />
          <View style={styles.timeWrap}>
            <TextComponent
              text={new Date(at).toLocaleTimeString()}
              color={'#6b7280'}
              size={11}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.bubble, styles.bubbleBot]}>
        <TextComponent
          text={content}
          color={appColors.text}
          size={15}
          styles={{ lineHeight: 20 }}
        />
        <View style={styles.timeWrap}>
          <TextComponent
            text={new Date(at).toLocaleTimeString()}
            color={'#6b7280'}
            size={11}
          />
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: any) => {
    const isUser = item.role === 'user';
    if (isUser) {
      return (
        <View style={[styles.bubble, styles.bubbleUser]}>
          <TextComponent
            text={item.content}
            color={appColors.white}
            size={15}
            styles={{ lineHeight: 20 }}
          />
          <View style={styles.timeWrapRight}>
            <TextComponent
              text={new Date(item.at).toLocaleTimeString()}
              color={'#e5e7eb'}
              size={11}
            />
          </View>
        </View>
      );
    }
    return renderAssistantMessage(item.content, item.at);
  };

  const quickPrompts = [
    'Combo for 2 people under 150',
    'Top selling foods this week',
    'Top selling combos this week',
  ];

  const ContactSuggestion = () => (
    <View style={styles.contactCard}>
      <TextComponent
        text="Need help? Contact the store"
        size={14}
        color={appColors.text}
        styles={{ fontWeight: '700' }}
      />
      <SpaceComponent height={6} />
      <TextComponent
        text={`Phone: ${STORE_PHONE}`}
        size={13}
        color={'#6b7280'}
      />
      <TextComponent
        text={`Email: ${STORE_EMAIL}`}
        size={13}
        color={'#6b7280'}
      />

      <RowComponent styles={{ marginTop: 10, flexWrap: 'wrap' }}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            styles.ctaCall,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => Linking.openURL(`tel:${STORE_PHONE}`)}
        >
          <Call size={18} color="#fff" variant="Bold" />
          <SpaceComponent width={8} />
          <TextComponent text="Call now" size={13} color="#ffffff" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            styles.ctaMail,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => Linking.openURL(`mailto:${STORE_EMAIL}`)}
        >
          <DirectInbox size={18} color="#fff" variant="Bold" />
          <SpaceComponent width={8} />
          <TextComponent text="Send email" size={13} color="#ffffff" />
        </Pressable>
      </RowComponent>
    </View>
  );

  const ContactToggleBar = () => (
    <RowComponent styles={styles.contactToggleBar}>
      <TextComponent text="Show contact card" size={12} color={'#6b7280'} />
      <View style={{ flex: 1 }} />
      <Switch value={showContact} onValueChange={setShowContact} />
    </RowComponent>
  );

  return (
    <ContainerComponent title="AI Assistant" isScroll={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 10, android: 0 })}
      >
        {/* Header actions */}
        <RowComponent styles={styles.headerRow}>
          <TextComponent text="Hello 👋" size={13} color={'#6b7280'} />
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={onClear}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Trash size={20} color={'#9ca3af'} />
          </Pressable>
        </RowComponent>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={it => it.id}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
          onContentSizeChange={scrollToEnd}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.emptyLogo}
              />
              <TextComponent
                text="I can suggest dishes based on your preferences, budget, and taste."
                size={14}
                color={'#6b7280'}
                styles={{ textAlign: 'center' }}
              />
              <RowComponent styles={{ marginTop: 12, flexWrap: 'wrap' }}>
                {quickPrompts.map(q => (
                  <QuickPrompt
                    key={q}
                    label={q}
                    onPress={() => {
                      setText(q);
                      setTimeout(onSend, 50);
                    }}
                  />
                ))}
              </RowComponent>
            </View>
          }
          ListFooterComponent={
            <View>
              {sending ? <TypingBubble /> : null}
              <SpaceComponent height={4} />
            </View>
          }
        />

        {/* Error row */}
        {error ? (
          <>
            <TextComponent
              text={`Error: ${String(error)}`}
              color={appColors.danger}
              size={12}
              styles={{ paddingHorizontal: 16 }}
            />
            <SpaceComponent height={4} />
          </>
        ) : null}

        {/* Toggle + Contact card */}
        <ContactToggleBar />
        {showContact && <ContactSuggestion />}

        {/* Input Bar */}
        <View style={styles.inputWrap}>
          <InputComponent
            value={text}
            onChange={setText}
            placeholder="Enter your question…"
            onEnd={onSend}
            suffix={
              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  (!text.trim() || sending) && { opacity: 0.4 },
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
                onPress={canSend ? onSend : undefined}
              >
                <Send2 size={20} color={appColors.white} />
              </Pressable>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </ContainerComponent>
  );
};

export default ChatAIScreen;

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    alignItems: 'center',
  },
  iconBtn: {
    height: 34,
    width: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  bubble: {
    maxWidth: '92%',
    marginVertical: 6,
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: appColors.orange,
    borderTopRightRadius: 8,
  },
  bubbleBot: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eef2f7',
  },
  timeWrap: {
    marginTop: 6,
  },
  timeWrapRight: {
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  inputWrap: {
    paddingHorizontal: 12,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  sendBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: appColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  card: {
    width: '90%',
    backgroundColor: appColors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eef2f7',
    overflow: 'hidden',
  },
  cardItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  cardThumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#f3f4f6',
  },
  cardCTA: {
    marginTop: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    backgroundColor: appColors.orange,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
  },
  emptyWrap: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
    marginRight: 4,
  },
  contactToggleBar: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactCard: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  ctaBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaCall: {
    backgroundColor: appColors.orange,
  },
  ctaMail: {
    backgroundColor: appColors.orange,
  },
});
