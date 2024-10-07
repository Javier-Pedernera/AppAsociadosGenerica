import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImageCompressor from './ImageCompressor';
import MultiImageCompressor from './MultiImageCompressor';
import { useDispatch, useSelector } from 'react-redux';
import { getMemoizedPartner, getMemoizedUserData } from '../redux/selectors/userSelectors';
import { Category } from '../redux/types/types';
import CategoryPicker from './CategoryPicker';
import { getMemoizedAllCategories } from '../redux/selectors/categorySelectors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { formatDateToDDMMYYYY, formatDateToYYYYMMDD } from '../utils/formatDate';
import { AppDispatch } from '../redux/store/store';
import { createPromotion } from '../redux/actions/promotionsActions';
import Loader from './Loader';

interface PromotionFormProps {
  onClose: () => void;
}

const PromotionForm: React.FC<PromotionFormProps> = ({ onClose }) => {
  const dispatch: AppDispatch = useDispatch();
  const user = useSelector(getMemoizedUserData);
  const allCategories = useSelector(getMemoizedAllCategories);
  const partner = useSelector(getMemoizedPartner);
  // console.log("partner actual", partner?.branches);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number | null>(null);
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null);
  const [imagePaths, setImagePaths] = useState<{ filename: string; data: string }[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isCategoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const handleImagesCompressed = useCallback((images: { filename: string; data: string }[]) => {
    setImagePaths(images);
  }, []);
  const handleSelectCategories = (newSelectedCategories: number[]) => {
    console.log("categorias seleccionadas", newSelectedCategories);

    setSelectedCategories(newSelectedCategories);
  };

  const handleSubmit = async () => {
    // console.log(title, description, startDate?.toISOString().split('T')[0], endDate?.toISOString().split('T')[0], discountPercentage, availableQuantity, selectedCategories, imagePaths.length);
setLoading(true)
    if (!user?.user_id || !partner?.branches[0].branch_id) {
      Alert.alert('Error', 'No se pudo obtener el ID del socio o la sucursal. Intente de nuevo.');
      return;
    }
    if (!title || !description || !startDate || !endDate || discountPercentage === null || selectedCategories.length === 0 || imagePaths.length === 0) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }
    const promotionData = {
      branch_id: partner?.branches[0].branch_id,
      title,
      description,
      start_date: startDate.toISOString().split('T')[0],
      expiration_date: endDate.toISOString().split('T')[0],
      discount_percentage: discountPercentage,
      available_quantity: availableQuantity,
      partner_id: user?.user_id || 0,
      category_ids: selectedCategories,
      images: imagePaths
    };
    console.log(promotionData);

    await dispatch(createPromotion(promotionData))
      .then(() => {
        setLoading(false)
        Alert.alert('Éxito', 'La promoción ha sido creada correctamente.');
        onClose(); // Puedes cerrar el modal o hacer alguna otra acción
      })
      .catch((error: any) => {
        Alert.alert('Error', 'Hubo un problema al crear la promoción. Intente de nuevo.');
        console.error("Error al crear la promoción: ", error);
      });

  };

  const handleStartDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'ios') {
      setStartDate(date || startDate);
    } else {
      if (date) {
        setStartDate(date);
      }
      setShowStartDatePicker(false);
    }
  };

  const handleEndDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'ios') {
      setEndDate(date || endDate);
    } else {
      if (date) {
        setEndDate(date);
      }
      setShowEndDatePicker(false);
    }
  };

  const confirmStartDate = () => {
    if (startDate) {
      setStartDate(startDate);
    }
    setShowStartDatePicker(false);
  };

  const confirmEndDate = () => {
    if (endDate) {
      setEndDate(endDate);
    }
    setShowEndDatePicker(false);
  };
  return (
    
    <ScrollView contentContainerStyle={styles.formContainer}>
      {loading&& <Loader/>}
      <TextInput
        style={styles.input}
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.descriptionInput}
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Porcentaje de Descuento"
        keyboardType="numeric"
        value={typeof discountPercentage === 'number' ? discountPercentage.toString() : ''}
        onChangeText={(text) => setDiscountPercentage(Number(text))}
      />
      <TextInput
        style={styles.input}
        placeholder="Cantidad Disponible"
        keyboardType="numeric"
        value={typeof availableQuantity === 'number' ? availableQuantity.toString() : ''}
        onChangeText={(text) => setAvailableQuantity(Number(text))}
      />
      {/* Agregar lógica para seleccionar categorías */}
      <TouchableOpacity
        style={styles.categoryButton}
        onPress={() => setCategoriesModalVisible(true)}
      >
        <MaterialIcons name="category" size={24} color="#fff" />
        <Text style={styles.submitButtonText}>Seleccionar Categorías</Text>
      </TouchableOpacity >
      <CategoryPicker
        categories={allCategories}
        selectedCategories={selectedCategories}
        onSelectCategories={handleSelectCategories}
        isVisible={isCategoriesModalVisible}
        onClose={() => setCategoriesModalVisible(false)}
      />
      <MultiImageCompressor onImagesCompressed={handleImagesCompressed} />

      {/* Mostrar las fechas */}
      <View style={styles.datePickerContainer}>
        {!showStartDatePicker && (
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.inputdate}>
            {startDate ? <Text style={styles.textDate}>Inicia</Text> : <Text></Text>}
            <Text style={styles.textDate}>
              {startDate ? formatDateToDDMMYYYY(startDate.toISOString().split('T')[0]) : 'Fecha de Inicio (DD-MM-YYYY)'}
            </Text>
          </TouchableOpacity>
        )}
        {showStartDatePicker && (
          <View>
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="spinner"
              onChange={handleStartDateChange}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity onPress={confirmStartDate} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Confirmar fecha</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.datePickerContainer}>
        {!showEndDatePicker && (
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.inputdate}>
            {endDate ? <Text style={styles.textDate}>Finaliza</Text> : <Text></Text>}
            <Text style={styles.textDate}>
              {endDate ? formatDateToDDMMYYYY(endDate.toISOString().split('T')[0]) : 'Fecha de Fin (DD-MM-YYYY)'}
            </Text>
          </TouchableOpacity>
        )}
        {showEndDatePicker && (
          <View>
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="spinner"
              onChange={handleEndDateChange}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity onPress={confirmEndDate} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Confirmar fecha</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Crear Promoción</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contTextSucursal:{
    width: '100%',
    height:'80%',
    display:'flex',
    justifyContent:'center',
    alignContent:'center',
    textAlign:'center',
    alignItems:'center',
    backgroundColor: 'rgba(172, 208, 213,0.5)'
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    flexGrow: 1,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
    padding: 10,
  },
  descriptionInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
    padding: 10,
    height: 100, // Ajusta la altura según sea necesario
    textAlignVertical: 'top',
  },
  inputdate: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
    padding: 10,
  },
  textDate: {
    color: '#888',
  },
  submitButton: {
    backgroundColor: 'rgb(0, 122, 140)',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#8e8e8e',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  categoryButton: {
    backgroundColor: 'rgb(0, 122, 140)',
    width: '80%',
    alignSelf: 'center',
    display: 'flex',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  datePickerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center'
  },
});

export default PromotionForm;
