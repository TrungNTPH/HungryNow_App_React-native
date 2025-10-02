import {
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardType,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import React, { ReactNode, useState } from 'react';
import { appColors } from '../constants';
import { globalStyles } from '../styles';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';

interface Props {
  value: string;
  onChange: (val: string) => void;
  affix?: ReactNode;
  placeholder?: string;
  suffix?: ReactNode;
  isPassword?: boolean;
  allowClear?: boolean;
  type?: KeyboardType;
  onEnd?: () => void;
  editable?: boolean;
  styles?: StyleProp<ViewStyle>;
  textStyles?: StyleProp<TextStyle>;
}

const InputComponent = (props: Props) => {
  const {
    value,
    onChange = () => {},
    affix,
    suffix,
    placeholder,
    isPassword,
    allowClear,
    type,
    onEnd,
    editable,
    styles: containerStyle,
    textStyles,
  } = props;

  const [isShowPass, setIsShowPass] = useState(isPassword ?? false);

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {affix && <View style={styles.affix}>{affix}</View>}
      <TextInput
        style={[
          styles.input,
          globalStyles.text,
          textStyles,
          !affix && { paddingLeft: 0 },
          !suffix && !isPassword && { paddingRight: 0 },
        ]}
        value={value}
        placeholder={placeholder ?? ''}
        onChangeText={val => onChange(val)}
        secureTextEntry={isShowPass}
        placeholderTextColor={'#747688'}
        keyboardType={type ?? 'default'}
        autoCapitalize="none"
        onEndEditing={onEnd}
        editable={editable ?? true}
      />
      {suffix && <View style={styles.suffix}>{suffix}</View>}
      {isPassword ? (
        <TouchableOpacity onPress={() => setIsShowPass(!isShowPass)}>
          <FontAwesome
            name={isShowPass ? 'eye-slash' : 'eye'}
            size={22}
            color={appColors.gray}
          />
        </TouchableOpacity>
      ) : (
        value.length > 0 &&
        allowClear && (
          <TouchableOpacity onPress={() => onChange('')}>
            <AntDesign name="close" size={22} color={appColors.text} />
          </TouchableOpacity>
        )
      )}
    </View>
  );
};

export default InputComponent;

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColors.gray,
    width: '100%',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: appColors.white,
    marginBottom: 19,
  },
  input: {
    padding: 0,
    margin: 0,
    flex: 1,
    color: appColors.text,
  },
  affix: {
    marginRight: 8,
  },
  suffix: {
    marginLeft: 8,
  },
});
