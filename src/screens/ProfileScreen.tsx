import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, ScrollView, Modal, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store/store';
import RNPickerSelect from 'react-native-picker-select';
import { UserData } from '../redux/types/types';
import { updatePartner, updateUserAction } from '../redux/actions/userActions';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchUserCategories, fetchAllCategories } from '../redux/actions/categoryActions';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { getMemoizedPartner, getMemoizedUserData } from '../redux/selectors/userSelectors';
import { getMemoizedAllCategories, getMemoizedUserCategories } from '../redux/selectors/categorySelectors';
import { formatDateToDDMMYYYY } from '../utils/formatDate';
import CountryPicker from '../components/CountrySelect';
import ImageCompressor from '../components/ImageCompressor';
import SemicirclesOverlay from '../components/SemicirclesOverlay';
import AntDesign from '@expo/vector-icons/AntDesign';
import { logoutUser } from '../services/authService';

const { width: screenWidth } = Dimensions.get('window');
// const screenHeight = Dimensions.get('window').height;

const ProfileScreen: React.FC = () => {
  const user = useSelector(getMemoizedUserData) as UserData;
  const categories = useSelector(getMemoizedUserCategories);
  const allCategories = useSelector(getMemoizedAllCategories);
  const partner = useSelector(getMemoizedPartner);
  const dispatch: AppDispatch = useDispatch();
  // console.log("categorias de usuario",categories);
  // console.log("partner en el profile", partner);
  const [selectedCategories, setSelectedCategories] = useState<any>(categories.map(cat => cat.id)
  );
  // console.log("categorias seleccionadas",selectedCategories);
  // console.log("allCategories",allCategories);
  useEffect(() => {
    if (user?.user_id) {
      dispatch(fetchUserCategories(user.user_id));
    }
    dispatch(fetchAllCategories());
  }, [dispatch, user?.user_id]);

  useEffect(() => { 
    setSelectedCategories(categories.map(cat => cat.id));
  }, [categories]);
  console.log(user);

  const [formData, setFormData] = useState({
    user_id: user?.user_id || 0,
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    country: user?.country || '',
    city: user?.city || '',
    phone_number: user?.phone_number || '',
    gender: user?.gender || '',
    birth_date: user?.birth_date || '',
    image_data: user?.image_url || null,
    subscribed_to_newsletter: user?.subscribed_to_newsletter || false,
    //partner
    address: partner?.address || '',
    contact_info: partner?.contact_info || '',
    business_type: partner?.business_type || '',
  });
  // console.log("datos a cambiar en el perfil y la imagen",formData, formData.image_data);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalError, setModalError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCategoriesModalVisible, setCategoriesModalVisible] = useState(false);

  // console.log(formData);


  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };
  useEffect(() => {
    if (formData.birth_date) {
      const [year, month, day] = formData.birth_date.split('-');
      setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
    }
  }, [formData.birth_date]);
  const formatDateToYYYYMMDD = (dateString: string): string => {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const formattedDate = formatDateToYYYYMMDD(
        `${selectedDate.getDate()}-${selectedDate.getMonth() + 1}-${selectedDate.getFullYear()}`
      );
      handleInputChange('birth_date', formattedDate);
    }
  };

  const confirmDate = () => {
    if (selectedDate) {
      const formattedDate = formatDateToYYYYMMDD(
        `${selectedDate.getDate()}-${selectedDate.getMonth() + 1}-${selectedDate.getFullYear()}`
      );
      handleInputChange('birth_date', formattedDate);
    }
    setShowDatePicker(false);
  };

  const handleImageCompressed = (uri: string) => {
    console.log("imagencomprimida");

    handleInputChange('image_data', uri);
  };

  const handleUpdate = async () => {
    try {
      const { user_id, address, contact_info, business_type, image_data, ...dataToSend } = formData;
      const updatedDataToSend = {
        ...dataToSend,
        image_data: image_data && image_data.startsWith('http') ? null : image_data,
      };
      console.log("formulario de actualizacion de usuario, ver imagen", updatedDataToSend);

      const response = await dispatch<any>(updateUserAction({ ...updatedDataToSend, user_id }));
      // console.log("resouesta de la actualizacion del usuario", response);
      // console.log("resouesta de la actualizacion del usuario ver status", response.status);
      if (response.status == 200) {
        const categoriesResponse = await dispatch<any>(updatePartner(user_id, {
          address: address,
          contact_info: contact_info,
          business_type: business_type,
          category_ids: selectedCategories,
        }))
        // console.log("categoriesResponse",categoriesResponse);
        // console.log("categoriesResponse ver status",categoriesResponse.status);
        if (categoriesResponse.status == 200) {
          // dispatch(fetchUserCategories())
          setModalMessage('Datos actualizados con éxito');
          setModalError(false);
        } else {
          setModalMessage('Error al actualizar las categorías');
          setModalError(true);
        }
      } else {
        setModalMessage('Error al actualizar los datos');
        setModalError(true);
      }
    } catch (error) {
      setModalMessage('Error al actualizar los datos');
      setModalError(true);
    } finally {
      setIsEditing(false)
      setModalVisible(true);
    }
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategories((prevState: any) => {
      if (prevState.includes(categoryId)) {
        return prevState.filter((id: any) => id !== categoryId);
      } else {
        return [...prevState, categoryId];
      }
    });
  };
  const handleCountryChange = (value: string) => {
    handleInputChange('country', value);
  };
  const handleSaveCategories = () => {
    setCategoriesModalVisible(false);
  };
    const handleLogout = () => {
    dispatch(logoutUser() as any);
    setIsEditing(false)
  };
  return (
    <View
    >
      <SemicirclesOverlay />
      <ScrollView contentContainerStyle={styles.container}>
        <ImageCompressor onImageCompressed={handleImageCompressed} initialImageUri={formData.image_data || undefined} isButtonDisabled={isEditing}/>
        <View style={styles.iconContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <AntDesign name="edit" size={24} color="#007a8b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleLogout} 
            >
              <MaterialIcons name="logout" size={24} color="#007a8b" />
            </TouchableOpacity>
          </View>
          {isEditing ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={formData.first_name}
            onChangeText={(value) => handleInputChange('first_name', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Apellido"
            value={formData.last_name}
            onChangeText={(value) => handleInputChange('last_name', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Correo Electrónico"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            editable={false}
          />
          <View style={styles.inputSelect}>
            <CountryPicker
              selectedCountry={formData.country}
              onCountryChange={handleCountryChange}
              estilo={false}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ciudad"
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Número de Teléfono"
            value={formData.phone_number}
            onChangeText={(value) => handleInputChange('phone_number', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Dirección"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Información de Contacto"
            value={formData.contact_info}
            onChangeText={(value) => handleInputChange('contact_info', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Tipo de Negocio"
            value={formData.business_type}
            onChangeText={(value) => handleInputChange('business_type', value)}
          />
          <View style={styles.datePickerContainer}>
            {!showDatePicker && (
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputdate}>
                <Text style={styles.textDate}>
                  {formData.birth_date ? formatDateToDDMMYYYY(formData.birth_date) : 'Fecha de Nacimiento (DD-MM-YYYY)'}
                </Text>
              </TouchableOpacity>
            )}
            {showDatePicker && (
              <View>
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity onPress={confirmDate} style={styles.confirmButton}>
                    <Text style={styles.confirmButtonText}>Confirmar fecha</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          {Platform.OS === 'web' ? (
            <View style={styles.selectView}>
              <select
                style={styles.select}
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
              >
                <option value="" disabled>Seleccione Género</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </View>
          ) : (
            <View>
              <RNPickerSelect
                onValueChange={(value) => handleInputChange('gender', value)}
                value={formData.gender}
                items={[
                  { label: 'Masculino', value: 'Masculino' },
                  { label: 'Femenino', value: 'Femenino' },
                  { label: 'Otro', value: 'Otro' },
                ]}
                placeholder={{ label: 'Seleccione Género', value: '' }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
              />
            </View>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={() => setCategoriesModalVisible(true)}
          >
            <MaterialIcons name="category" size={22} color="white" />
            <Text style={styles.buttonText}>Mis categorías</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <MaterialIcons name="send" size={22} color="white" />
            <Text style={styles.buttonText}>Actualizar datos</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.Containertext}>
          <Text style={styles.text}>{formData.first_name} {formData.last_name}</Text>
          <Text style={styles.text}>{formData.email}</Text>
          <Text style={styles.text}>{formData.country}, {formData.city}</Text>
          <Text style={styles.text}>{formData.phone_number}</Text>
          <Text style={styles.text}>{formData.address}</Text>
          <Text style={styles.text}>{formData.contact_info}</Text>
          <Text style={styles.text}>{formData.business_type}</Text>
          <Text style={styles.text}>{formData.birth_date ? formatDateToDDMMYYYY(formData.birth_date) : 'Fecha de Nacimiento'}</Text>
          <Text style={styles.text}>{formData.gender}</Text>
        </View>
      )}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, modalError ? styles.modalError : styles.modalSuccess]}>
              {modalError ? (
                <Icon name="close-circle" size={50} color="red" />
              ) : (
                <Icon name="checkmark-circle" size={50} color="green" />
              )}
              <Text style={styles.modalText}>{modalMessage}</Text>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>

        </Modal>
        <Modal visible={isCategoriesModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Categorías</Text>
              <ScrollView>
                {allCategories.map((category) => (
                  <View key={category.category_id} style={styles.checkboxContainer}>
                    <Checkbox
                      value={selectedCategories.includes(category.category_id)}
                      onValueChange={() => handleCategoryChange(category.category_id)}
                    />
                    <Text style={styles.label}>{category.name}</Text>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={handleSaveCategories} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Guardar Categorías</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCategoriesModalVisible(false)} style={styles.modalButtonCancel}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 35,
    width: Platform.OS === 'web' ? '50%' : screenWidth,
    maxWidth: Platform.OS === 'web' ? 400 : screenWidth * 0.8,
    borderColor: 'rgb(172, 208, 213)',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    alignSelf: 'center',
  },
  inputAndroid: {
    height: 35,
    width: Platform.OS === 'web' ? '50%' : screenWidth,
    maxWidth: Platform.OS === 'web' ? '30%' : screenWidth * 0.8,
    borderColor: 'rgb(172, 208, 213)',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    alignSelf: 'center',
  },
});

const styles = StyleSheet.create({
  Containertext:{
    padding:20,
    paddingTop:80
  },
  text:{
    fontSize:14,
    color:'#007a8c',
    fontWeight:'600',
    padding:5
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight:20
    // backgroundColor: '#f7f7f7',
  },
  iconContainer:{
    position:'absolute',
    top:0
  },
  editButton:{
    position:'absolute',
    alignContent:'center',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:25,
    backgroundColor:'rgb(232, 232, 232)',
    top:45,
    right:90,
    height:40,
    width:40
  },
  exitButton:{
    position:'absolute',
    alignContent:'center',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:25,
    backgroundColor:'rgb(232, 232, 232)',
    height:40,
    width:40,
    top:45,
    left:90
  },
  inputSelect: {
    height: 35,
    width: '90%',
    borderColor: 'rgb(172, 208, 213)',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'center',

    // paddingHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  input: {
    height: 35,
    width: '90%',
    borderColor: 'rgb(172, 208, 213)',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 5,
    alignSelf: 'center',
    borderColor: 'rgba(0, 122, 140)',
    borderWidth: 1,

  },
  button: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: 'rgb(0, 122, 140)',
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
    width: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectView: {
    width: screenWidth,
    borderColor: 'rgb(172, 208, 213)',
    borderWidth: 1,
    borderRadius: 8,
  },
  select: {
    height: 50,
    width: screenWidth,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    // outLineColor: 'rgb(172, 208, 213)',
    borderColor: 'rgb(172, 208, 213)',
    fontSize: 16,
    color: '#595959',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
    alignContent: 'center'
  },
  modalText: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  label: {
    marginLeft: 8,
  },
  modalButton: {
    backgroundColor: 'rgb(0, 122, 140)',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  modalButtonCancel: {
    backgroundColor: '#ba2f09',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalError: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
    // backgroundColor: '#f8d7da',
  },
  modalSuccess: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
    // backgroundColor: '#d4edda',
  },
  datePickerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center'
  },
  textDate: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center'
  },
  inputdate: {
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    height: 40,
    width: '90%',
    borderColor: 'rgb(172, 208, 213)',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,

  },
  confirmButton: {
    backgroundColor: 'rgb(0, 122, 140)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 10,
    width: 250,
    alignSelf: 'center'
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 16,
    marginVertical: 5,
  },
});

export default ProfileScreen;
