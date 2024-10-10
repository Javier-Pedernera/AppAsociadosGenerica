import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Image, Alert, TextInput } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useDispatch, useSelector } from 'react-redux';
import { Promotion, UserData } from '../redux/types/types';
import { getMemoizedAccessToken, getMemoizedUserData } from '../redux/selectors/userSelectors';
import { fetchPartnerById, getUserInfo, logOutUser } from '../redux/actions/userActions';
import { AppDispatch } from '../redux/store/store';
import { fetchConsumedPromotions, fetchPromotions, submitConsumption } from '../redux/actions/promotionsActions';
import { getMemoizedConsumedPromotions, getMemoizedPromotions } from '../redux/selectors/promotionSelectors';
import { loadData } from '../redux/actions/dataLoader';
import { fetchBranches } from '../redux/actions/branchActions';
import Feather from '@expo/vector-icons/Feather';
import SemicirclesOverlay from '../components/SemicirclesOverlay';
import { Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getMemoizedStates } from '../redux/selectors/globalSelectors';
import ConsumedPromotionsModal from '../components/ConsumedPromotionsModalProps ';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import TermsModal from '../components/TermsModal';
import Loader from '../components/Loader';
import { useTranslation } from 'react-i18next';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
type homeScreenProp = StackNavigationProp<RootStackParamList>;
const API_URL = process.env.EXPO_PUBLIC_API_URL;
interface ScanData {
  type: string;
  data: string;
}

const QRScanButton = () => {
  const { t } = useTranslation();
  const user = useSelector(getMemoizedUserData) as UserData;
  const statuses = useSelector(getMemoizedStates);
  const accessToken = useSelector(getMemoizedAccessToken);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const lineAnimation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [permission, requestPermission] = useCameraPermissions();
  const dispatch: AppDispatch = useDispatch();
  const navigation = useNavigation<homeScreenProp>();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const promotions = useSelector(getMemoizedPromotions);
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedEmail, setScannedEmail] = useState<string | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [scannedUser, setScannedUser] = useState<string | null>(null);
  const [quantityConsumed, setQuantityConsumed] = useState('');
  const [amountSpent, setAmountSpent] = useState('');
  const [description, setDescription] = useState('');
  const currentDate = new Date();
  const promotionsConsumed = useSelector(getMemoizedConsumedPromotions);
  const [modalConsumedVisible, setModalConsumedVisible] = useState<boolean>(false);
  const [isModalTermsVisible, setModalTermsVisible] = useState(false);
  const [currentTerms, setCurrentTerms] = useState<any>(undefined);
  const [isloading, setIsLoading] = useState(false);

  // console.log("access token",accessToken);
  // console.log("terminos actuales",currentTerms);
  // console.log("promotions",promotions[0]);
  // console.log("statuses",statuses);
  // console.log("promotions consumidas",promotionsConsumed);
  const filteredPromotions = promotions.filter(promotion => {
    const startDate = new Date(promotion.start_date);
    const expirationDate = new Date(promotion.expiration_date);
    return promotion.status?.name === 'active' && currentDate >= startDate && currentDate <= expirationDate;
  });
  // console.log("filteredPromotions",filteredPromotions);

  useEffect(() => {
    dispatch(loadData());
    fetchCurrentTerms();
    if (user) {
      dispatch(fetchPartnerById(user.user_id));
      dispatch(fetchPromotions(user.user_id));
      dispatch(fetchBranches(user.user_id));
      dispatch(fetchConsumedPromotions(user.user_id));

    }

    // Solicitar permiso de la cámara si no está concedido
    if (!permission) {
      requestPermission();
    } else if (!permission.granted) {
      Alert.alert(
        t('qrScanner.permissionAlert.title'),
        t('qrScanner.permissionAlert.message'),
        [
          {
            text: t('qrScanner.permissionAlert.requestPermission'),
            onPress: requestPermission,
          },
          {
            text: t('qrScanner.permissionAlert.cancel'),
            style: "cancel",
          },
        ]
      );
    } else {
      setHasPermission(permission.granted);
    }
  }, [permission]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    startLineAnimation();
  }, [cameraVisible]);

  const fetchCurrentTerms = async () => {
    try {
      const response = await axios.get(`${API_URL}/terms`);
      // console.log("respuesta del back", response);

      setCurrentTerms(response.data);
    } catch (error) {
      console.error('Error al obtener los términos:', error);
    }
  };

  useEffect(() => {
    if (user?.terms && currentTerms !== undefined && user.terms?.version !== currentTerms?.version) {
      setModalTermsVisible(true);
    }
    if (user?.terms === null) {
      setModalTermsVisible(true);
    }
  }, [user, currentTerms]);

  const handleAcceptTerms = async () => {
    try {
      setIsLoading(true)
      await axios.put(`${API_URL}/users/${user.user_id}/accept-terms`);
      await dispatch(getUserInfo(accessToken))
      setModalTermsVisible(false);
      setIsLoading(false)
      Alert.alert(t('qrScanner.termsModal.termsAccepted'), t('qrScanner.termsModal.termsAcceptedMessage'));
    } catch (error) {
      console.error('Error al aceptar los términos:', error);
    }
  };
  const handleCancelTerms = async () => {
    await dispatch(logOutUser());
    setModalTermsVisible(false);
    Alert.alert(t('qrScanner.termsModal.termsNotAccepted'), t('qrScanner.termsModal.termsNotAcceptedMessage'));
    navigation.navigate('Login');
  };

  const startLineAnimation = () => {
    Animated.sequence([
      Animated.timing(lineAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(lineAnimation, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(lineAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const translateY = lineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 185], // Ajusta este valor para controlar el recorrido de la línea
  });

  const handleQRScan = () => {
    if (hasPermission) {
      setCameraVisible(true);
      timeoutRef.current = setTimeout(() => {
        setCameraVisible(false);
      }, 10000);
    } else {
      Alert.alert(t('qrScanner.permissionAlert.permissionDenied'), t('qrScanner.permissionAlert.goToSettings'));
    }
  };

  const handleBarCodeScanned = ({ type, data }: ScanData) => {
    console.log('Scanned QR Code:', data);
    setCameraVisible(false);
    const [userId, email] = data.split('-');
    if (!userId || !email) {
      Alert.alert(
        t('qrScanner.invalidCode'),
        t('qrScanner.scanQRCode'),
          [{ text: "OK" }]
      );
      return;
  }
    setScannedUser(userId);
    setScannedEmail(email)
    setModalVisible(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
  const handlePromotionSelect = (promotion: any) => {
    setSelectedPromotion(promotion);
  };

  const handleConfirm = async () => {
    const status = statuses.find(status => status.name === 'active');

    if (!selectedPromotion || !quantityConsumed || !amountSpent) {
      Alert.alert(t('qrScanner.errorAlert.title'), "Debes completar todos los campos.");
      return;
    }

    const data = {
      user_id: scannedUser && parseInt(scannedUser, 10),
      promotion_id: selectedPromotion?.promotion_id,
      status_id: status?.id,
      quantity_consumed: parseInt(quantityConsumed, 10),
      consumption_date: new Date().toISOString(),
      description,
      amount_consumed: parseFloat(amountSpent),
    };

    // console.log("datos de la consumition",data);

    try {
      const result = await dispatch(submitConsumption(data));
      if (result?.status == 200) {
        dispatch(fetchPromotions(user.user_id));
        setSelectedPromotion(null);
        setQuantityConsumed('');
        setAmountSpent('');
        setDescription('');
        setScannedUser(null);
        setScannedEmail(null);
        Alert.alert(t('qrScanner.successAlert.title'), t('qrScanner.successAlert.message'));
      } else {
        Alert.alert(t('qrScanner.errorAlert.title'), t('qrScanner.errorAlert.message'));
      }
    } catch (error) {
      Alert.alert(t('qrScanner.errorAlert.title'), "Ocurrió un error al registrar el consumo de la promoción.");
    }

    setModalVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedPromotion(null);
    setQuantityConsumed('');
    setAmountSpent('');
    setDescription('');
    setScannedUser(null);
    setScannedEmail(null);
  };
  const handleCloseCamera = () => {
    setCameraVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
  const handleQuantityChange = (text: string) => {
    const quantity = parseInt(text, 10);
    if (selectedPromotion && selectedPromotion.available_quantity && quantity > selectedPromotion.available_quantity) {
      Alert.alert(t('qrScanner.errorAlert.title'), `No puedes consumir más de ${selectedPromotion.available_quantity} promociones.`);
      return;
    }
    setQuantityConsumed(text);
  };

  const openConsumedPromotionsModal = () => {
    setModalConsumedVisible(true);
  };

  // Función para cerrar el modal
  const closeConsumedPromotionsModal = () => {
    setModalConsumedVisible(false);
  };
  const ScannerFrame = () => (
    <View style={styles.frameContainer}>
      <View style={styles.frameCornerTopLeft} />
      <View style={styles.frameCornerTopRight} />
      <View style={styles.frameCornerBottomLeft} />
      <View style={styles.frameCornerBottomRight} />
    </View>
  );

  if (cameraVisible && hasPermission) {
    return (
      <View style={StyleSheet.absoluteFillObject}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleBarCodeScanned}
        />
        <ScannerFrame />
        <TouchableOpacity style={styles.closeButton} onPress={handleCloseCamera}>
          <Feather name="camera-off" size={24} color="rgb(0, 122, 140)" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isloading && <Loader />}
      <View style={styles.containercircle}>
        <SemicirclesOverlay />
      </View>
      <View style={styles.iconContainer}>
        <Image source={require('../../assets/images/QR-Scan.png')} style={styles.icon} />
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ translateY }],
              opacity: opacity,
            },
          ]}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleQRScan}>
        <Text style={styles.buttonText}>{t('qrScanner.scanQRButton')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonconsumidas}
        onPress={() => setModalConsumedVisible(true)}
      >
        <Text style={styles.buttonTextconsum}>{t('qrScanner.consumptionsButton')}</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.formContainer}>
            <View style={styles.userName}>
              <Text style={styles.userText}>
              {t('qrScanner.clientLabel')}
              </Text>
              {scannedEmail ? (
                <Text style={styles.userText2}>
                  {scannedEmail}
                </Text>
              ) : (
                <Text style={styles.quantityTextError}>
                  {t('qrScanner.noUserDetected')}
                </Text>
              )}
            </View>

            {/* Línea horizontal */}
            <View style={styles.line} />
            <Text style={styles.modalTitle}>{t('qrScanner.selectPromotion')}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedPromotion}
                onValueChange={(itemValue) => handlePromotionSelect(itemValue)}
                style={styles.picker}
              ><Picker.Item label={t('qrScanner.selectPromotionPlaceholder')} value={null} />
                {filteredPromotions.map((promotion) => (
                  <Picker.Item
                    key={promotion.promotion_id}
                    label={promotion.title}
                    value={promotion}
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
            </View>
            {
              selectedPromotion &&
              <View style={styles.quantity}>
                <Text style={styles.quantityText}>
                {t('qrScanner.availableQuantity')}
                </Text>
                <Text style={styles.quantityText2}>
                  {selectedPromotion.available_quantity ? selectedPromotion.available_quantity : t('qrScanner.noLimit')}
                </Text>
              </View>
            }
            <TextInput
              style={styles.input}
              placeholder={t('qrScanner.quantityInputPlaceholder')}
              keyboardType="numeric"
              value={quantityConsumed}
              onChangeText={handleQuantityChange}
              editable={!!selectedPromotion}
            />
            <TextInput
              style={styles.input}
              placeholder={t('qrScanner.amountInputPlaceholder')}
              keyboardType="numeric"
              value={amountSpent}
              onChangeText={setAmountSpent}
              editable={!!selectedPromotion}
            />
            <TextInput
              style={styles.input}
              placeholder={t('qrScanner.descriptionInputPlaceholder')}
              value={description}
              onChangeText={setDescription}
              editable={!!selectedPromotion}
            />
            <TouchableOpacity onPress={handleConfirm} style={[
              styles.confirmButton,
              !selectedPromotion && styles.disabledButton
            ]} disabled={!selectedPromotion}>
              <Text style={styles.confirmButtonText}>{t('qrScanner.confirmButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{t('qrScanner.cancelButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal para aceptar los términos y condiciones */}
      {currentTerms &&
        <View style={styles.Terms}>
          <TermsModal
            isVisible={isModalTermsVisible}
            toggleModal={() => setModalTermsVisible(false)}
            acceptTerms={handleAcceptTerms}
            termsText={currentTerms?.content}
            onCancel={handleCancelTerms}
            newTerms={true}
          />
        </View>}
      <ConsumedPromotionsModal
        visible={modalConsumedVisible}
        onClose={closeConsumedPromotionsModal}
        consumedPromotions={promotionsConsumed}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    height:screenHeight,
    display:'flex',
    flexDirection:'column',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent:'center'
  },
  containercircle:{
    position:'absolute',
    top:-20,
    height:screenHeight *0.2,
    width:screenWidth
  },
  iconContainer: {
    marginBottom: 20,
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  icon: {
    width: 200,
    height: 200, 
  },
  scanLine: {
    position: 'absolute',
    width: 166,
    height: 1,
    backgroundColor: '#acd0d5',
    top: 0,
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(0, 122, 140)',
    elevation: 3,
  },
  buttonconsumidas:{
    marginTop: 20,
    paddingVertical: 5,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:1,
    borderColor: 'rgb(0, 122, 140)',
    color: 'rgb(0, 122, 140)',
  },
  buttonTextconsum: {
    color: 'rgb(0, 122, 140)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonPressed: {
    backgroundColor: '#275d8e', 
    transform: [{ scale: 0.98 }],
  },
  frameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Esquina superior izquierda
  frameCornerTopLeft: {
    position: 'absolute',
    top: 170,
    left: 70,
    width: 35,
    height: 35,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#acd0d5',
    borderStyle: 'solid',
    borderTopLeftRadius: 10,
  },
  // Esquina superior derecha
  frameCornerTopRight: {
    position: 'absolute',
    top: 170,
    right: 70,
    width: 35,
    height: 35,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#acd0d5',
    borderStyle: 'solid',
    borderTopRightRadius: 10,
  },
  // Esquina inferior izquierda
  frameCornerBottomLeft: {
    position: 'absolute',
    bottom: 150,
    left: 70,
    width: 35,
    height: 35,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#acd0d5',
    borderStyle: 'solid',
    borderBottomLeftRadius: 10,
  },
  // Esquina inferior derecha
  frameCornerBottomRight: {
    position: 'absolute',
    bottom: 150,
    right: 70,
    width: 35,
    height: 35,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#acd0d5',
    borderStyle: 'solid',
    borderBottomRightRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    bottom: 50,
    left: screenWidth*0.45,
    padding: 10,
    backgroundColor: 'rgb(246, 246, 246)',
    borderRadius: 25,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer:{
    display:'flex',
    flexDirection:'column',
    width:screenWidth *0.9,
    height:screenHeight*0.8,
    borderRadius:20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center'
  },
  modalTitle: {
    width:screenWidth *0.8,
    textAlign:'center',
    fontSize: screenWidth * 0.04,
    fontWeight: 'bold',
    color: '#007a8c',
    marginVertical: screenWidth * 0.04,
  },
  promotionItem: {
    padding: 15,
    backgroundColor: '#007A8C',
    borderRadius: 5,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  promotionText: {
    color: '#fff',
    marginTop:screenWidth *0.01,
    fontWeight: 'bold',
  },
  input: {
    width:screenWidth *0.8,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 15,
    fontSize: screenWidth * 0.04,
    marginVertical: 8,
  },
  confirmButton: {
    backgroundColor: 'rgb(0, 122, 140)',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    width:screenWidth *0.5,
    marginTop:screenWidth *0.04,
  },
  disabledButton: {
    opacity: 0.5, 
  },
  confirmButtonText: {
    textAlign:'center',
    color: '#fff',
    fontSize: screenWidth *0.04,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#686868',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    width:screenWidth *0.5,
    marginTop:screenWidth *0.04,
  },
  cancelButtonText: {
    
    textAlign:'center',
    color: '#fff',
    fontSize: screenWidth *0.04,
    fontWeight: 'bold',
  },
  pickerContainer: {
    width:screenWidth *0.8,
    fontSize: screenWidth * 0.02,
    backgroundColor:'#fff',
    alignContent:'center',
    alignItems:'center',
    justifyContent:'center',
    // borderWidth: 1,
    // borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    padding: 5,
  },
  picker: {
    fontSize: screenWidth * 0.04,
    height: 35,
    width: '100%',
  },
  pickerItem:{
    fontSize: screenWidth * 0.04,
    color:'#336749',
  },
  quantity:{
    display:'flex',
    flexDirection:'row',
    alignContent:'center',
    width:screenWidth * 0.78,
  },
  quantityText:{
    fontSize: screenWidth * 0.04,
    width:screenWidth*0.24,
    color:'#336749',
  },
  quantityText2:{
    fontWeight:'600',
    fontSize: screenWidth * 0.04,
    color:'#007a8c',
    width:screenWidth*0.6,
  },
  quantityTextError:{
    fontWeight:'600',
    fontSize: screenWidth * 0.04,
    color:'rgb(193, 34, 34)',
    width:screenWidth*0.6,
  },
  userName:{
    display:'flex',
    flexDirection:'row',
    alignContent:'center',
    justifyContent:'center',
    width:screenWidth * 0.78,
    marginVertical:screenWidth * 0.03,
  },
  userText:{
    fontSize: screenWidth * 0.04,
    width:screenWidth*0.18,
    color:'#336749',
  },
  userText2:{
    fontWeight:'600',
    fontSize: screenWidth * 0.04,
    color:'#007a8c',
    width:screenWidth*0.6,
  },
  line: {
    height: 1, 
    backgroundColor: '#acd0d5', 
    marginVertical: 10, 
    width:screenWidth * 0.78,
  },
  Terms:{
    borderRadius:10
  }
});

export default QRScanButton;
