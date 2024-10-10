import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import Modal from 'react-native-modal';
import { userLogIn } from '../redux/actions/userActions';
import Loader from '../components/Loader';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type LoginScreenProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation<LoginScreenProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleLogin = async () => {
    const lowerCaseEmail = email.trim().toLowerCase();
    if (lowerCaseEmail === '' || password === '') {
      Alert.alert('Error',  t('errorEmptyFields'));
      return;
    }

    try {
      setLoading(true);
      const response = await dispatch<any>(userLogIn(lowerCaseEmail, password));
      // console.log("Respuesta en la función handleLogin", response);

      // Validación del estado del usuario
      if (response.user.status.name !== 'active') {
        Alert.alert('Asociado inactivo', 'Tu cuenta está inactiva. Contacta al soporte para más información.');
        return;
      }

      // Validación del rol del usuario
      const hasAssociatedRole = response.user.roles.some((role: { role_name: string }) => role.role_name === 'associated');
      if (!hasAssociatedRole) {

        Alert.alert('Acceso restringido', 'Solo se permite el ingreso a los asociados.');

        return;
      }

      // Si pasa todas las validaciones
      setError(null);
      // setModalMessage('Bienvenido ' + response.user.first_name + '!');
      // toggleModal();
      setEmail('');
      setPassword('');
      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate('MainAppScreen');
      }, 1500);
    } catch (err: any) {
      setEmail('');
      setPassword('');
      setError(err.message);
      setModalMessage(err.message);
      toggleModal();
    } finally {

      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#007a8c', '#f6f6f6']}
      style={styles.container}
    >
      <View style={styles.card}>
        <Image source={require('../../assets/logo.png')} style={styles.logoLog} />
        <TextInput
          style={styles.input}
          placeholder={t('login.emailPlaceholder')}
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder={t('login.passwordPlaceholder')}
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color="#acd0d5" />
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>{t('login.login')}</Text>
        </TouchableOpacity>
        <View  style={styles.asociadosCont} >
        <Image source={require('../../assets/images/LOGOASOCIADOS.png')} style={styles.logoAsociados} />
        <Text  style={styles.asociadostext} >{t('login.associates')}</Text>
        </View>
        {/* <Text style={styles.forgotPasswordText}>No tienes cuenta? Contáctanos</Text> */}
        {loading && <Loader />}
      </View>
        <Text  style={styles.versionText} >{t('login.version')} {process.env.EXPO_PUBLIC_API_VERSION}</Text>
      <Modal isVisible={isModalVisible}>
        <View style={styles.modalContent}>
          <Text style={styles.modalMessage}>{modalMessage}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={toggleModal}>
            <Text style={styles.modalButtonText}>{t('login.close')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#f6f6f6',
    padding: 20,
    borderRadius: 25,
    width: '90%',
    alignItems: 'center',

    // Sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  logoLog: {
    height: 110,
    width: 110,
    marginBottom: 30,
  },
  asociadosCont:{
    position:'relative',
    height:50,
    width:screenWidth*0.8,
  },
  logoAsociados:{
    position:'absolute',
    height:120,
    width:100,
    top:-50,
    left:50

  },
  asociadostext:{
      position:'absolute',
      height:50,
      top:0,
      left:110,
      fontFamily: 'Inter-Regular-400',
      color: '#007a8c',
      fontWeight:'700'
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'rgb(172, 208, 213)',
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    width: '100%',
    borderColor: 'rgb(172, 208, 213)',
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 0,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  inputPassword: {
    flex: 1,
    fontSize: 14,
  },
  error: {
    color: '#007a8c',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007a8c',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 30,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
    fontFamily: 'Inter-Regular-400',
    // Sombra en el botón
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: screenWidth*0.045,
    fontWeight: 'bold',
    fontFamily: 'Inter-Regular-400',
  },
  buttonSecondary: {
    backgroundColor: '#f6f6f6',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    width: '90%',
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#007a8c',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Regular-400',
  },
  forgotPasswordButton: {

    marginTop: 20,
    width: '95%',
    justifyContent: 'flex-end',
    alignContent: 'flex-end',
    alignItems: 'flex-end'
  },
  forgotPasswordText: {
    color: '#007a8c',
    fontSize: screenWidth*0.035,
    fontFamily: 'Inter-Regular-400',
  },
  modalContent: {
    backgroundColor: 'rgba(246, 246, 246, 0.9)',
    color: 'white',
    display:'flex',
    alignSelf:'center',
    flexDirection:'column',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '70%',
    height:'30%',
    justifyContent:'space-evenly'
  },
  modalMessage: {
    width:'100%',
    textAlign:'center',
    fontSize: 16,
    marginBottom: 20,
    fontWeight:'600',
    color: '#007a8c',
  },
  modalButton: {
    backgroundColor: '#007a8c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  versionText:{
    marginTop:20,
    fontSize: screenWidth*0.035,
    fontFamily: 'Inter-Regular-400',
    color: '#007a8c',
    fontWeight:'400'
  }
});

export default LoginScreen;