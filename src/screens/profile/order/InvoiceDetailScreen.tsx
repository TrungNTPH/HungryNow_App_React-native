import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { fetchInvoiceByIdThunk } from '../../../redux/actions/invoiceAction';
import {
  selectedInvoiceSelector,
  invoiceLoadingSelector,
  invoiceErrorSelector,
} from '../../../redux/reducer/invoiceReducer';
import {
  ButtonComponent,
  ContainerComponent,
  TextComponent,
} from '../../../components';
import { appColors, appFonts } from '../../../constants';

type InvoiceStatus =
  | 'pending'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'canceled';

const statusColorMap: Record<InvoiceStatus, string> = {
  pending: '#FFC107',
  processing: '#17A2B8',
  shipping: '#007BFF',
  delivered: '#28A745',
  canceled: '#DC3545',
};

const formatMoney = (v?: number) => `${(v || 0).toLocaleString()} VND`;
const fromNow = (d?: string) => (d ? moment(d).fromNow() : '');

const Badge = ({ label, color }: { label: string; color: string }) => (
  <View
    style={[
      styles.badge,
      { backgroundColor: `${color}1A`, borderColor: color },
    ]}
  >
    <TextComponent
      text={label}
      size={11}
      color={color}
      font={appFonts.semiBold}
    />
  </View>
);

const Row = ({
  left,
  right,
  bold,
  accent = false,
}: {
  left: string;
  right: string;
  bold?: boolean;
  accent?: boolean;
}) => (
  <View style={styles.row}>
    <TextComponent text={left} size={13} color="#666" />
    <TextComponent
      text={right}
      size={bold ? 16 : 13}
      font={bold ? appFonts.semiBold : appFonts.regular}
      color={accent ? appColors.orange : '#222'}
    />
  </View>
);

const StepDot = ({
  active,
  canceled,
}: {
  active: boolean;
  canceled?: boolean;
}) => (
  <View
    style={[
      styles.stepDot,
      active && {
        backgroundColor: canceled ? statusColorMap.canceled : appColors.orange,
        borderColor: 'transparent',
      },
    ]}
  />
);

const StepLine = ({
  active,
  canceled,
}: {
  active: boolean;
  canceled?: boolean;
}) => (
  <View
    style={[
      styles.stepLine,
      active && {
        backgroundColor: canceled ? statusColorMap.canceled : appColors.orange,
      },
    ]}
  />
);

const InvoiceDetailScreen = ({ route, navigation }: any) => {
  const { invoiceId } = route.params;
  const dispatch = useAppDispatch();

  const invoice = useAppSelector(selectedInvoiceSelector);
  const loading = useAppSelector(invoiceLoadingSelector);
  const error = useAppSelector(invoiceErrorSelector);

  useEffect(() => {
    if (invoiceId) dispatch(fetchInvoiceByIdThunk(invoiceId));
  }, [invoiceId, dispatch]);

  const statusColor = useMemo(
    () =>
      statusColorMap[(invoice?.status as InvoiceStatus) || 'pending'] ||
      appColors.orange,
    [invoice?.status],
  );

  const stepIndex = useMemo(() => {
    const map: Record<InvoiceStatus, number> = {
      pending: 0,
      processing: 1,
      shipping: 2,
      delivered: 3,
      canceled: 1,
    };
    return map[(invoice?.status as InvoiceStatus) || 'pending'];
  }, [invoice?.status]);

  if (loading && !invoice) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={appColors.orange} />
        <TextComponent
          text="Loading invoice..."
          size={13}
          color="#777"
          styles={{ marginTop: 8 }}
        />
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={28} color={appColors.orange} />
        <TextComponent
          text={error || 'Invoice not found'}
          size={14}
          color="#777"
          styles={{ marginTop: 8 }}
        />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <ButtonComponent
            text="Retry"
            type="primary"
            color={appColors.orange}
            onPress={() => dispatch(fetchInvoiceByIdThunk(invoiceId))}
            styles={{ borderRadius: 12, paddingHorizontal: 16 }}
          />
          <ButtonComponent
            text="Back"
            type="primary"
            color={'#999'}
            onPress={() => navigation.goBack()}
            styles={{
              borderRadius: 12,
              paddingHorizontal: 16,
              backgroundColor: '#999',
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <ContainerComponent title="Invoice Detail" back isScroll={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <TextComponent
                text={`Invoice #${invoice._id?.slice(-6)}`}
                font={appFonts.semiBold}
                size={18}
              />
              <TextComponent
                text={`${moment(invoice.invoiceDate).format(
                  'DD/MM/YYYY HH:mm',
                )} · ${fromNow(invoice.invoiceDate)}`}
                size={12}
                color="#777"
                styles={{ marginTop: 4 }}
              />
            </View>
            <Badge
              label={invoice.status?.toUpperCase() || 'PENDING'}
              color={statusColor}
            />
          </View>

          <View style={styles.stepsWrap}>
            <View style={styles.stepItem}>
              <StepDot
                active={stepIndex >= 0}
                canceled={invoice.status === 'canceled'}
              />
              <TextComponent
                text="Pending"
                size={11}
                color="#666"
                styles={{ marginTop: 6 }}
              />
            </View>
            <StepLine
              active={stepIndex >= 1}
              canceled={invoice.status === 'canceled'}
            />
            <View style={styles.stepItem}>
              <StepDot
                active={stepIndex >= 1}
                canceled={invoice.status === 'canceled'}
              />
              <TextComponent
                text="Processing"
                size={11}
                color="#666"
                styles={{ marginTop: 6 }}
              />
            </View>
            <StepLine
              active={stepIndex >= 2 && invoice.status !== 'canceled'}
              canceled={false}
            />
            <View style={styles.stepItem}>
              <StepDot
                active={stepIndex >= 2 && invoice.status !== 'canceled'}
              />
              <TextComponent
                text="Shipping"
                size={11}
                color="#666"
                styles={{ marginTop: 6 }}
              />
            </View>
            <StepLine
              active={invoice.status === 'delivered'}
              canceled={false}
            />
            <View style={styles.stepItem}>
              <StepDot active={invoice.status === 'delivered'} />
              <TextComponent
                text="Delivered"
                size={11}
                color="#666"
                styles={{ marginTop: 6 }}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <TextComponent
            text="Items"
            font={appFonts.semiBold}
            size={15}
            styles={{ marginBottom: 10 }}
          />
          {invoice.items.map((item, index) => {
            const isFood = item.itemType === 'Food';
            const name = item?.itemId?.name || 'Unknown Item';
            const imageUrl = item?.itemId?.image || '';
            const qty = item.quantity || 0;
            const unit = item.unitPrice || 0;
            const sizeInfo =
              isFood && (item as any).size
                ? `Size: ${(item as any).size.name} • ${formatMoney(
                    (item as any).size.price,
                  )}`
                : '';

            return (
              <View
                key={`${(item as any).itemId?._id || index}_${index}`}
                style={styles.itemRow}
              >
                <Image
                  source={
                    imageUrl
                      ? { uri: imageUrl }
                      : require('../../../assets/images/logo.png')
                  }
                  style={styles.itemImage}
                />
                <View style={{ flex: 1 }}>
                  <TextComponent
                    text={name}
                    size={14}
                    font={appFonts.semiBold}
                  />
                  {!!sizeInfo && (
                    <TextComponent
                      text={sizeInfo}
                      size={12}
                      color="#777"
                      styles={{ marginTop: 2 }}
                    />
                  )}
                  <TextComponent
                    text={`x${qty} • ${formatMoney(unit)}`}
                    size={12}
                    color="#777"
                    styles={{ marginTop: 2 }}
                  />
                </View>
                <TextComponent
                  text={formatMoney(unit * qty)}
                  size={14}
                  font={appFonts.semiBold}
                  color={appColors.orange}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <TextComponent
            text="Summary"
            font={appFonts.semiBold}
            size={15}
            styles={{ marginBottom: 10 }}
          />
          <Row left="Subtotal" right={formatMoney(invoice.total)} />
          {invoice.discountAmount != null && invoice.discountAmount > 0 && (
            <Row
              left="Discount"
              right={`- ${formatMoney(invoice.discountAmount)}`}
            />
          )}
          <Row left="Shipping Fee" right={formatMoney(invoice.shippingFee)} />
          <View style={styles.divider} />
          <Row left="Total" right={formatMoney(invoice.total)} bold accent />
        </View>

        <View style={styles.actions}>
          <ButtonComponent
            text="Back"
            type="primary"
            color={'#999'}
            onPress={() => navigation.goBack()}
            styles={[styles.btn, { backgroundColor: '#999' }]}
          />
          <ButtonComponent
            text="Reorder"
            type="primary"
            color={appColors.orange}
            onPress={() => {
              navigation.navigate('TabNavigator', {
                screen: 'Home',
              });
            }}
            styles={styles.btn}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </ContainerComponent>
  );
};

export default InvoiceDetailScreen;

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E6E6E6',
    borderWidth: 2,
    borderColor: '#fff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E6E6E6',
    marginHorizontal: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 10,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  btn: {
    width: 100,
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
});
