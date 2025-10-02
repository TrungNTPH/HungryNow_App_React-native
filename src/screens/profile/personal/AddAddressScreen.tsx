import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service';
import { useDispatch } from 'react-redux';
import { addAddressThunk } from '../../../redux/actions/addressAction';
import { unwrapResult } from '@reduxjs/toolkit';
import type { Variant } from '../../../modals/ModalNotification';
import NotificationModal, {
  ModalNotificationAction,
} from '../../../modals/ModalNotification';
import { AppDispatch } from '../../../redux/store';
import { ContainerComponent, TextComponent } from '../../../components';
import { appColors, appFonts } from '../../../constants';

const useAppDispatch = () => useDispatch<AppDispatch>();

const VN_BOUNDS = {
  minLat: 8.179,
  maxLat: 23.392,
  minLng: 102.144,
  maxLng: 109.469,
};
const isInVietnam = (lat: number, lng: number) =>
  lat >= VN_BOUNDS.minLat &&
  lat <= VN_BOUNDS.maxLat &&
  lng >= VN_BOUNDS.minLng &&
  lng <= VN_BOUNDS.maxLng;

const FALLBACK_VN = { latitude: 21.027763, longitude: 105.83416 };

const createMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pick Location</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <script src="https://unpkg.com/maplibre-gl/dist/maplibre-gl.js"></script>
  <link href="https://unpkg.com/maplibre-gl/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    :root{ --brand:#FF5722; --bg:#ffffff; --muted:#98a2b3; --line:#eef0f4; --text:#0f172a; --shadow:0 14px 32px rgba(17,24,39,.15); }
    *{box-sizing:border-box} html,body,#map{height:100%;width:100%;margin:0;padding:0}
    #map{position:relative}
    .marker{ background-color: var(--brand); border:2px solid #fff; border-radius:50% 50% 50% 0; width:30px; height:30px; transform:rotate(45deg); position:relative; box-shadow:0 10px 24px rgba(0,0,0,.25); cursor:grab; }
    .marker::after{ content:''; width:14px; height:14px; background:#fff; position:absolute; top:50%; left:50%; margin:-7px 0 0 -7px; border-radius:50%; }
    .my-location{ position:absolute; right:18px; bottom:220px; width:52px; height:52px; border-radius:16px; display:flex; align-items:center; justify-content:center; background:#fff; box-shadow: var(--shadow); border:1px solid var(--line); z-index:10; }
    .my-location svg{ width:24px; height:24px; fill:#0f172a }
    .panel{ position:absolute; left:0; right:0; bottom:0; padding:10px 12px 14px; background:transparent; z-index:9; }
    .card{ margin:0 12px; background:rgba(255,255,255,.98); border:1px solid var(--line);
      border-top-left-radius:22px; border-top-right-radius:22px; padding:14px 14px 16px; box-shadow:var(--shadow); }
    .handle{width:44px; height:5px; border-radius:99px; background:#e5e7eb; margin:6px auto 10px}
    .title{font:600 16px/1.2 system-ui, -apple-system, Segoe UI, Roboto; color:var(--text)}
    .subtitle{margin-top:4px; font:400 12px/1.4 system-ui; color:#6b7280}
    .field{display:flex; align-items:center; border:1px solid var(--line); background:#f7f8fb; border-radius:12px; padding:10px 12px; gap:8px; height:48px; margin-top:10px}
    .field svg{width:18px; height:18px; fill:#9aa3af}
    .field input{ flex:1; border:none; outline:none; background:transparent; font:400 15px system-ui; color:var(--text); }
    .row{display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:8px}
    .checkbox{display:flex; align-items:center; gap:8px; margin-top:6px; color:#475569; font:400 14px system-ui}
    .checkbox input{width:18px; height:18px}
    .chips{display:flex; gap:8px; margin-top:8px}
    .chip{background:#f1f5f9; border:1px solid var(--line); color:#334155; border-radius:999px; padding:6px 10px; font:500 12px system-ui}
    .buttons{display:flex; gap:10px; margin-top:12px}
    .btn{ flex:1; height:48px; border-radius:12px; border:1px solid var(--line); font:700 15px system-ui; display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; }
    .btn.primary{ background:var(--brand); color:#fff; border-color:transparent }
    .btn.ghost{ background:#fff; color:#0f172a }
    .btn[disabled]{ opacity:.45; cursor:not-allowed }
    .maplibregl-ctrl-top-right{ top:10px; right:10px }
  </style>
</head>
<body>
  <div id="map"></div>

  <button class="my-location" onclick="requestLocationFromRN()" aria-label="Use my current location">
    <svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.94 3A9.995 9.995 0 0013 3.06V1h-2v2.06A9.995 9.995 0 003.06 11H1v2h2.06A9.995 9.995 0 0011 20.94V23h2v-2.06A9.995 9.995 0 0020.94 13H23v-2h-2.06zM12 19a7 7 0 110-14 7 7 0 010 14z"/></svg>
  </button>

  <div class="panel">
    <div class="card">
      <div class="handle"></div>
      <div class="title">Add Address</div>
      <div class="subtitle">Drag the pin or tap the map. Fill in details below.</div>

      <div class="field">
        <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        <input id="labelInput" placeholder="Label (e.g., Home, Work)" />
      </div>

      <div class="field">
        <svg viewBox="0 0 24 24"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z"/></svg>
        <input id="detailInput" placeholder="Address detail (street, ward...)" />
      </div>

      <label class="checkbox">
        <input type="checkbox" id="defaultCheckbox" />
        Use as default address
      </label>

      <div class="chips">
        <div class="chip" id="chipLat">Lat: ${lat.toFixed(6)}</div>
        <div class="chip" id="chipLng">Lng: ${lng.toFixed(6)}</div>
      </div>

      <div class="buttons">
        <button class="btn ghost" onclick="cancel()">Cancel</button>
        <button class="btn primary" id="saveBtn" onclick="saveAddress()" disabled>Add address</button>
      </div>
    </div>
  </div>

  <script>
    // ===== VN bounds helpers (mirror từ RN) =====
    const BOUNDS = { LAT_MIN: ${VN_BOUNDS.minLat}, LAT_MAX: ${
  VN_BOUNDS.maxLat
}, LNG_MIN: ${VN_BOUNDS.minLng}, LNG_MAX: ${VN_BOUNDS.maxLng} };
    const inVN = (lat,lng) => lat>=BOUNDS.LAT_MIN && lat<=BOUNDS.LAT_MAX && lng>=BOUNDS.LNG_MIN && lng<=BOUNDS.LNG_MAX;
    const nearestInVN = (lat,lng) => ({
      lat: Math.min(Math.max(lat, BOUNDS.LAT_MIN), BOUNDS.LAT_MAX),
      lng: Math.min(Math.max(lng, BOUNDS.LNG_MIN), BOUNDS.LNG_MAX),
    });

    let marker;
    const map = new maplibregl.Map({
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [${lng}, ${lat}],
      zoom: 16,
      container: 'map',
      maxBounds: [[${VN_BOUNDS.minLng}, ${VN_BOUNDS.minLat}], [${
  VN_BOUNDS.maxLng
}, ${VN_BOUNDS.maxLat}]],
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass:false }), 'top-right');

    const chipLat = document.getElementById('chipLat');
    const chipLng = document.getElementById('chipLng');
    const saveBtn = document.getElementById('saveBtn');
    const $label = document.getElementById('labelInput');
    const $detail = document.getElementById('detailInput');

    function setChips({lat,lng}) {
      chipLat.textContent = 'Lat: ' + lat.toFixed(6);
      chipLng.textContent = 'Lng: ' + lng.toFixed(6);
    }
    function validate(){ saveBtn.disabled = !($label.value.trim() && $detail.value.trim()); }
    $label.addEventListener('input', validate); $detail.addEventListener('input', validate);

    map.on('load', () => {
      const el = document.createElement('div'); el.className = 'marker';
      marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([${lng}, ${lat}]).addTo(map);

      marker.on('drag', () => { const ll = marker.getLngLat(); setChips({lat: ll.lat, lng: ll.lng}); });
      marker.on('dragend', () => {
        const ll = marker.getLngLat();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:'new_location', payload:{ latitude: ll.lat, longitude: ll.lng }
        }));
      });

      setTimeout(() => map.resize(), 0);
      $label.focus();
    });

    map.on('click', (e) => {
      if (!marker) return;
      marker.setLngLat(e.lngLat);
      setChips({lat: e.lngLat.lat, lng: e.lngLat.lng});
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'new_location', payload:{ latitude: e.lngLat.lat, longitude: e.lngLat.lng }
      }));
    });

    // ===== Geocode VN bằng Nominatim (debounce) =====
    function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
    async function geocodeVN(query){
      if (!query || query.trim().length < 5) return null;
      const url = 'https://nominatim.openstreetmap.org/search'
        + '?format=jsonv2&addressdetails=1&limit=1&countrycodes=vn'
        + '&accept-language=vi'
        + '&q=' + encodeURIComponent(query.trim());
      try{
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        if (!Array.isArray(data) || !data.length) return null;
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          label: data[0].display_name
        };
      }catch(e){ return null; }
    }

    // Expose cho RN
    window.updateMapLocation = function(lat, lng){
      let ll = { lat, lng };
      if (!inVN(lat, lng)) {
        ll = nearestInVN(lat, lng);
      }
      map.flyTo({ center:[ll.lng,ll.lat], zoom:16, essential:true, duration:800 });
      if (marker) { marker.setLngLat([ll.lng,ll.lat]); setChips(ll); }
    }

    function requestLocationFromRN(){
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:'request_location' }));
    }

    function saveAddress(){
      if (saveBtn.disabled) return;
      const label = $label.value.trim();
      const detail = $detail.value.trim();
      const isDefault = document.getElementById('defaultCheckbox')?.checked || false;
      const ll = marker.getLngLat();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'save',
        payload:{ label, addressDetail: detail, isDefault, latitude: ll.lat, longitude: ll.lng }
      }));
    }

    function cancel(){
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:'cancel' }));
    }

    // Gắn tự động tìm theo address detail
    const searchByDetail = debounce(async () => {
      const q = $detail.value;
      const r = await geocodeVN(q);
      if (!r) {
        // window.ReactNativeWebView.postMessage(JSON.stringify({ type:'geocode_no_results', payload:{ q } }));
        return;
      }
      let { lat, lng } = r;
      if (!inVN(lat, lng)) {
        const back = nearestInVN(lat, lng);
        lat = back.lat; lng = back.lng;
        // window.ReactNativeWebView.postMessage(JSON.stringify({ type:'warn_out_of_vn' }));
      }
      window.updateMapLocation(lat, lng);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'new_location',
        payload:{ latitude: lat, longitude: lng, source: 'geocode' }
      }));
    }, 600);

    $detail.addEventListener('input', searchByDetail);
    $detail.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchByDetail(); } });
  </script>
</body>
</html>
`;

export default function MapScreen({ navigation }: any) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalVariant, setModalVariant] = useState<Variant>('info');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalActions, setModalActions] = useState<
    ModalNotificationAction[] | undefined
  >(undefined);

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const webViewRef = useRef<WebView>(null);
  const [webViewKey, setWebViewKey] = useState(Date.now().toString());
  const dispatch = useAppDispatch();

  const showModal = (
    message: string,
    variant: Variant = 'info',
    title?: string,
    actions?: ModalNotificationAction[],
  ) => {
    setModalMessage(message);
    setModalVariant(variant);
    setModalTitle(title ?? '');
    setModalActions(actions);
    setModalVisible(true);
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      return status === 'granted';
    }
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Request Location Permission',
            message:
              'The app needs access to your location to display it on the map.',
            buttonNeutral: 'Ask me later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        return false;
      }
    }
    return false;
  };

  const setSafeLocation = (lat: number, lng: number, reason?: string) => {
    if (!isInVietnam(lat, lng)) {
      showModal(
        reason ||
          'Your GPS seems to be outside Vietnam (emulator default). We’ll center the map to Hà Nội. You can drag the pin to your real address.',
        'info',
        'Location notice',
        [
          {
            label: 'OK',
            style: 'primary',
            onPress: () => setModalVisible(false),
          },
        ],
      );
      setCurrentLocation(FALLBACK_VN);
      return;
    }
    setCurrentLocation({ latitude: lat, longitude: lng });
  };

  const getCurrentPosition = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      showModal(
        'You need to grant location permission to use the app.',
        'error',
        'Permission Denied',
        [
          {
            label: 'Go back',
            style: 'primary',
            onPress: () => {
              setModalVisible(false);
              navigation.goBack();
            },
          },
          {
            label: 'Close',
            style: 'secondary',
            onPress: () => setModalVisible(false),
          },
        ],
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setSafeLocation(latitude, longitude);
        setIsLoading(false);
      },
      () => {
        setSafeLocation(
          FALLBACK_VN.latitude,
          FALLBACK_VN.longitude,
          'Cannot get your GPS. We’ll center the map to Hà Nội.',
        );
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const injectUpdateLocation = (lat: number, lng: number) => {
    if (!webViewRef.current) return;
    const js = `
      try { window.updateMapLocation && window.updateMapLocation(${lat}, ${lng}); } catch(e) {}
      true;
    `;
    webViewRef.current.injectJavaScript(js);
  };

  const onWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      const { type, payload } = message;

      switch (type) {
        case 'save': {
          const { label, addressDetail, isDefault, latitude, longitude } =
            payload || {};
          if (!isInVietnam(Number(latitude), Number(longitude))) {
            showModal(
              'The selected location is outside Vietnam. Please move the pin to a valid address in Vietnam.',
              'error',
              'Invalid location',
              [
                {
                  label: 'OK',
                  style: 'primary',
                  onPress: () => setModalVisible(false),
                },
              ],
            );
            return;
          }
          if (
            !String(label || '').trim() ||
            !String(addressDetail || '').trim()
          ) {
            showModal(
              'Please fill in label and address detail.',
              'warning',
              'Missing fields',
              [
                {
                  label: 'OK',
                  style: 'primary',
                  onPress: () => setModalVisible(false),
                },
              ],
            );
            return;
          }
          dispatch(
            addAddressThunk({
              label,
              addressDetail,
              isDefault: !!isDefault,
              latitude,
              longitude,
            }),
          )
            .then(unwrapResult)
            .then(() => {
              showModal('Address added successfully!', 'success', 'Success', [
                {
                  label: 'OK',
                  style: 'primary',
                  onPress: () => {
                    setModalVisible(false);
                    navigation.goBack();
                  },
                },
              ]);
            })
            .catch((error: any) => {
              showModal(
                `Cannot add address: ${error?.message || error}`,
                'error',
                'Error',
                [
                  {
                    label: 'Close',
                    style: 'primary',
                    onPress: () => setModalVisible(false),
                  },
                ],
              );
            });
          break;
        }

        case 'cancel':
          navigation.goBack();
          break;

        case 'request_location':
          Geolocation.getCurrentPosition(
            pos => {
              const { latitude, longitude } = pos.coords;
              if (isInVietnam(latitude, longitude)) {
                injectUpdateLocation(latitude, longitude);
              } else {
                injectUpdateLocation(
                  FALLBACK_VN.latitude,
                  FALLBACK_VN.longitude,
                );
                showModal(
                  'Your GPS seems to be outside Vietnam (emulator default). We centered the map to Hà Nội.',
                  'info',
                  'Location notice',
                  [
                    {
                      label: 'OK',
                      style: 'primary',
                      onPress: () => setModalVisible(false),
                    },
                  ],
                );
              }
            },
            () => {
              injectUpdateLocation(FALLBACK_VN.latitude, FALLBACK_VN.longitude);
              showModal(
                'Cannot get your GPS. We centered the map to Hà Nội.',
                'info',
                'Location notice',
                [
                  {
                    label: 'OK',
                    style: 'primary',
                    onPress: () => setModalVisible(false),
                  },
                ],
              );
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
          );
          break;

        case 'new_location':
          break;

        default:
          break;
      }
    } catch {}
  };

  useEffect(() => {
    getCurrentPosition();
  }, []);
  useEffect(() => {
    if (currentLocation) setWebViewKey(Date.now().toString());
  }, [currentLocation]);

  return (
    <ContainerComponent title="Add Address" back>
      <View style={styles.container}>
        {isLoading || !currentLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.orange} />
            <TextComponent
              text="Taking position..."
              font={appFonts.regular}
              size={15}
              styles={{ marginTop: 6 }}
            />
          </View>
        ) : (
          <WebView
            key={webViewKey}
            ref={webViewRef}
            originWhitelist={['*']}
            source={{
              html: createMapHtml(
                currentLocation.latitude,
                currentLocation.longitude,
              ),
            }}
            style={styles.webview}
            onMessage={onWebViewMessage}
            javaScriptEnabled
            geolocationEnabled={false}
          />
        )}
      </View>

      <NotificationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
        message={modalMessage}
        variant={modalVariant}
        actions={modalActions}
        showProgress={false}
      />
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
