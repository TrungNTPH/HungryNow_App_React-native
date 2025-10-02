import {
  View,
  ImageBackground,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ScrollViewProps,
} from 'react-native';
import React, { ReactNode } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'iconsax-react-native';
import { appColors } from '../constants/appColors';
import { appFonts } from '../constants';
import TextComponent from './TextComponent';

interface Props {
  isImageBackground?: boolean;
  isScroll?: boolean;
  title?: string;
  children: ReactNode;
  back?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
}

const ContainerComponent = (props: Props) => {
  const { children, isScroll, isImageBackground, title, back, refreshControl } =
    props;

  const navigation: any = useNavigation();

  const headerComponent = () => {
    if (!title && !back) return null;

    return (
      <SafeAreaView>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            minHeight: 48,
            justifyContent: 'space-between',
          }}
        >
          {back ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={appColors.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
          <TextComponent
            text={title || ''}
            size={16}
            font={appFonts.medium}
            styles={{ textAlign: 'center', flex: 1 }}
          />
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
    );
  };

  const content = isScroll ? (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>
  );

  const Wrapper = isImageBackground ? ImageBackground : SafeAreaView;
  const wrapperProps = isImageBackground
    ? {
        source: require('../assets/images/white.jpg'),
        style: { flex: 1 },
        imageStyle: { flex: 1 },
      }
    : { style: { flex: 1 } };

  return (
    <Wrapper {...wrapperProps}>
      {headerComponent()}
      {content}
    </Wrapper>
  );
};

export default ContainerComponent;