import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import {
  ArrowDown2,
  ArrowUp2,
  ShieldSecurity,
  DocumentText1,
} from 'iconsax-react-native';

import {
  ContainerComponent,
  SectionComponent,
  RowComponent,
  TextComponent,
  SpaceComponent,
  ButtonComponent,
} from '../../components';
import { appColors, appFonts } from '../../constants';

type RootParamList = {
  TermsPolicyScreen: { initialTab?: 'terms' | 'privacy' };
};

const BRAND_NAME = 'HungryNow';
const DELIVERY_PARTNERS = ['Lalamove'];
const CARD_RADIUS = 16;

const isFabric = !!(global as any).nativeFabricUIManager;
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !isFabric
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TERMS_SECTIONS = [
  {
    title: '1) Acceptance of Terms',
    content: `By creating an account or using ${BRAND_NAME}, you agree to these Terms of Service. If you do not agree, please do not use the service.`,
  },
  {
    title: '2) Account & Security',
    content:
      'You are responsible for safeguarding your login credentials and all activities under your account. Notify us immediately if you suspect unauthorized access.',
  },
  {
    title: '3) Orders & Payments',
    content:
      'Prices, delivery fees, and taxes are shown at checkout. Some payment providers may charge additional fees. Once an order is “confirmed,” it may not be cancelable depending on prep status.',
  },
  {
    title: '4) Delivery & Partners',
    content: `Orders may be delivered by our team/partners such as ${DELIVERY_PARTNERS.join(
      ', ',
    )}. Delivery time is an estimate. Factors like weather/traffic may affect it. Please stay reachable when the courier arrives.`,
  },
  {
    title: '5) Substitutions & Out-of-Stock',
    content:
      'If an item is unavailable, we may: (a) suggest an equivalent item, (b) adjust the order, or (c) refund the unserved portion according to policy.',
  },
  {
    title: '6) Allergens & Diet Preferences',
    content:
      'You are responsible for informing us of allergens/dietary needs (e.g., gluten-free, no seafood). Restaurants will do their best but cannot guarantee 100% avoidance.',
  },
  {
    title: '7) Refunds & Claims',
    content:
      'Contact Support within 24 hours for issues (wrong/missing/damaged items, severe delay…). Photos/videos help speed up resolution. Refunds may be full, partial, credit, or voucher.',
  },
  {
    title: '8) Promotions & Loyalty',
    content:
      'Promo codes/points have specific conditions (validity period, region, minimum order…). Not redeemable for cash. Fraud leads to benefit cancellation and/or account restriction.',
  },
  {
    title: '9) Tips for Couriers',
    content:
      'Tips (if any) are voluntary and typically go directly to the courier unless otherwise stated.',
  },
  {
    title: '10) Prohibited Conduct',
    content:
      'Harassing couriers/restaurants, fraud, system abuse, or violating laws/community standards will be handled per our rules.',
  },
  {
    title: '11) Limitation of Liability',
    content: `To the extent permitted by law, ${BRAND_NAME} is not liable for indirect, incidental, or consequential damages.`,
  },
  {
    title: '12) Service Changes',
    content:
      'We may update/modify features. Material changes will be communicated in advance when possible.',
  },
  {
    title: '13) Contact',
    content:
      'Need help? Visit the in-app Help Center to chat or submit a request.',
  },
];

const PRIVACY_SECTIONS = [
  {
    title: '1) Introduction',
    content: `This Policy explains how ${BRAND_NAME} collects, uses, and protects your personal data.`,
  },
  {
    title: '2) Data We Collect',
    content:
      'Includes email, name, phone number, delivery address; order history; device information; approximate location for store discovery/delivery.',
  },
  {
    title: '3) How We Use Data',
    content:
      'To process orders, deliver, and take payments; improve service quality; prevent fraud; personalize menu suggestions and promotions.',
  },
  {
    title: '4) Data Sharing',
    content:
      'Shared on a need-to-know basis with restaurants, delivery partners, payment gateways, and service providers under confidentiality agreements.',
  },
  {
    title: '5) Storage & Retention',
    content:
      'Stored as long as necessary for the stated purposes/legal compliance. Afterwards, we anonymize or delete per procedure.',
  },
  {
    title: '6) Your Rights',
    content:
      'You may request access, correction, or deletion of your data as permitted by applicable law.',
  },
  {
    title: '7) Security',
    content:
      'We implement appropriate technical and organizational measures. However, no method is 100% secure.',
  },
  {
    title: '8) Cookies & Tracking',
    content:
      'We may use cookies/device IDs for login persistence, cart memory, and campaign measurement.',
  },
  {
    title: '9) Policy Updates',
    content:
      'We may update this Policy. Continued use after updates constitutes acceptance of changes.',
  },
];

const TabButton = ({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.tabBtn,
      { backgroundColor: active ? appColors.orange : 'transparent' },
    ]}
    activeOpacity={0.9}
  >
    <RowComponent styles={{ alignItems: 'center' }}>
      <View style={{ marginRight: 8 }}>{icon}</View>
      <TextComponent
        text={label}
        color={active ? appColors.white : appColors.text}
        font={appFonts.semiBold}
      />
    </RowComponent>
  </TouchableOpacity>
);

const AccordionItem = ({
  title,
  content,
  expanded,
  onToggle,
}: {
  title: string;
  content: string;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.9}>
        <RowComponent justify="space-between" styles={{ alignItems: 'center' }}>
          <TextComponent
            text={title}
            size={16}
            font={appFonts.semiBold}
            styles={{ flex: 1, paddingRight: 12 }}
          />
          {expanded ? (
            <ArrowUp2 size={18} color={appColors.gray} />
          ) : (
            <ArrowDown2 size={18} color={appColors.gray} />
          )}
        </RowComponent>
      </TouchableOpacity>
      {expanded && (
        <>
          <SpaceComponent height={8} />
          <TextComponent text={content} color={appColors.gray} size={14} />
        </>
      )}
    </View>
  );
};

const TermsPolicyScreen = ({ navigation }: any) => {
  const route = useRoute<RouteProp<RootParamList, 'TermsPolicyScreen'>>();
  const [tab, setTab] = useState<'terms' | 'privacy'>(
    route.params?.initialTab ?? 'terms',
  );

  const sections = useMemo(
    () => (tab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS),
    [tab],
  );

  const [expandedIndex, setExpandedIndex] = useState(0);

  const onChangeTab = (next: 'terms' | 'privacy') => {
    setTab(next);
    setExpandedIndex(0);
  };

  return (
    <ContainerComponent isScroll back title="Terms of Service & Privacy Policy">
      <SectionComponent styles={{ paddingTop: 0 }}>
        <TextComponent
          text="Terms of Service & Privacy Policy"
          size={24}
          font={appFonts.semiBold}
        />
        <SpaceComponent height={6} />
        <TextComponent
          text="Important legal information for our food delivery service."
          color={appColors.gray}
        />
        <SpaceComponent height={4} />
        <TextComponent
          text="Last updated: Aug 22, 2025"
          size={12}
          color={appColors.gray}
        />
      </SectionComponent>

      {/* Tabs */}
      <SectionComponent styles={{ paddingTop: 4 }}>
        <RowComponent>
          <TabButton
            active={tab === 'terms'}
            label="Terms of Service"
            icon={
              <DocumentText1
                size={18}
                color={tab === 'terms' ? appColors.white : appColors.text}
              />
            }
            onPress={() => onChangeTab('terms')}
          />
          <SpaceComponent width={10} />
          <TabButton
            active={tab === 'privacy'}
            label="Privacy Policy"
            icon={
              <ShieldSecurity
                size={18}
                color={tab === 'privacy' ? appColors.white : appColors.text}
              />
            }
            onPress={() => onChangeTab('privacy')}
          />
        </RowComponent>
      </SectionComponent>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((s, idx) => (
          <AccordionItem
            key={`${tab}-${idx}`}
            title={s.title}
            content={s.content}
            expanded={expandedIndex === idx}
            onToggle={() => setExpandedIndex(expandedIndex === idx ? -1 : idx)}
          />
        ))}
        <SpaceComponent height={8} />
        <ButtonComponent
          text="Back to Register"
          type="primary"
          color={appColors.orange}
          styles={{ width: '100%' }}
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    </ContainerComponent>
  );
};

export default TermsPolicyScreen;

const styles = StyleSheet.create({
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: appColors.white,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
