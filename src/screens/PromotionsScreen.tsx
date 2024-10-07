import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Promotion, PromotionUpdate, ImagePromotion as UserData } from '../redux/types/types';
import { AppDispatch } from '../redux/store/store';
import { RootStackParamList } from '../navigation/AppNavigator';
import Modal from 'react-native-modal';
import { fetchAllCategories, fetchUserCategories } from '../redux/actions/categoryActions';
import { getMemoizedPromotions } from '../redux/selectors/promotionSelectors';
import { getMemoizedAllCategories, getMemoizedUserCategories } from '../redux/selectors/categorySelectors';
import { getMemoizedPartner, getMemoizedUserData } from '../redux/selectors/userSelectors';
import { fetchUserFavorites } from '../redux/actions/userActions';
import PromotionCard from '../components/PromotionCard';
import Loader from '../components/Loader';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import PromotionForm from '../components/PromotionForm';
import { getMemoizedCountries, getMemoizedRoles, getMemoizedStates } from '../redux/selectors/globalSelectors';
import { updatePromotion } from '../redux/reducers/promotionReducer';
import { deletePromotion } from '../redux/actions/promotionsActions';
import EditPromotionForm from '../components/EditPromotionForm';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width: screenWidth } = Dimensions.get('window');

const PromotionsScreen: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const promotions = useSelector(getMemoizedPromotions);
  // const categories = useSelector(getMemoizedAllCategories);
  const user_categories = useSelector(getMemoizedUserCategories);
  const user = useSelector(getMemoizedUserData);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>(promotions);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterByPreferences, setFilterByPreferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const statuses = useSelector(getMemoizedStates);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const partner = useSelector(getMemoizedPartner);
  // console.log("statuses en card", statuses);
  // console.log("countries en card", countries);
  // console.log("roles en card", roles);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (user?.user_id) {
          await dispatch(fetchUserCategories(user.user_id));
          await dispatch(fetchUserFavorites());
        }
        await dispatch(fetchAllCategories());
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dispatch, user]);

  useEffect(() => {
    const activePromotions = promotions.filter(promotion => promotion.status?.name !== 'deleted');
    setFilteredPromotions(activePromotions);
  }, [promotions]);

  const handlePress = useCallback((promotion: Promotion) => {
    navigation.navigate('PromotionDetail', { promotion });
  }, [navigation]);

  const formatDateString = useCallback((date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  const handleStartDateChange = useCallback((event: any, date?: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (date) {
      setStartDate(date);
    }
  }, []);

  const handleEndDateChange = useCallback((event: any, date?: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (date) {
      setEndDate(date);
    }
  }, []);

  const confirmStartDate = useCallback(() => {
    setShowStartDatePicker(false);
  }, []);

  const confirmEndDate = useCallback(() => {
    setShowEndDatePicker(false);
  }, []);

  const toggleCategory = useCallback((categoryId: number) => {
    setSelectedCategories((prevSelectedCategories) => {
      if (prevSelectedCategories.includes(categoryId)) {
        return prevSelectedCategories.filter(id => id !== categoryId);
      } else {
        return [...prevSelectedCategories, categoryId];
      }
    });
  }, []);

  const applyFilters = useCallback(() => {
    setLoading(true);
    let filtered = promotions;
    if (filterByPreferences && user && user.categories) {
      filtered = filtered.filter(promotion =>
        promotion.categories.some(c => user_categories.map(uc => uc.id).includes(c.category_id))
      );
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(promotion => {
        const categoryIds = promotion.categories.map(c => c.category_id);
        return selectedCategories.some(id => categoryIds.includes(id));
      });
    }

    if (keyword) {
      filtered = filtered.filter(promotion => promotion.title.toLowerCase().includes(keyword.toLowerCase()));
    }

    if (startDate) {
      filtered = filtered.filter(promotion =>
        new Date(promotion.start_date) >= startDate
      );
    }

    if (endDate) {
      filtered = filtered.filter(promotion =>
        new Date(promotion.expiration_date) <= endDate
      );
    }

    setFilteredPromotions(filtered);
    setLoading(false);
    setIsModalVisible(false);
  }, [filterByPreferences, user, user_categories, selectedCategories, keyword, startDate, endDate, promotions]);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setKeyword('');
    setStartDate(null);
    setEndDate(null);
    setFilterByPreferences(false);
    setFilteredPromotions(promotions);
  }, [promotions]);

  const handleEditPromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsEditModalVisible(true);
  };

  const handleDeletePromotion = async (promotionId: number) => {
    // Busca el estado "deleted"
    const deletedState = statuses.find(status => status.name === 'deleted');
    if (deletedState) {
      const status_id = deletedState.id;
      // Despacha la acción para actualizar la promoción con el estado "deleted"
      await dispatch(deletePromotion(promotionId, status_id));
    } else {
      console.error('Estado "deleted" no encontrado');
    }
  };
  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedPromotion(null);
  };
  const handleCreatePress = useCallback(() => {
    if (partner && partner.branches.length === 0) {
      Alert.alert("Error", "Primero debes crear una sucursal");
    } else {
      setIsCreateModalVisible(true);
    }
  }, [partner]);
  return (
    <View style={styles.gradient}
    >
      <View style={styles.btns}>
        <TouchableOpacity style={styles.createButton} onPress={handleCreatePress}>
          {/* <MaterialIcons name="assignment-add" size={24} color="#fff" /> */}
          <View style={styles.createButtonmas}>
            <Text style={styles.createButtonText}>+</Text>
          <MaterialCommunityIcons name="ticket-percent-outline" size={24} color="#fff" />
          </View>
          
          <Text style={styles.createButtonText}>Crear</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
      
        <Modal isVisible={isCreateModalVisible} style={styles.modal}>
          <View style={styles.modalContent}>
            <PromotionForm onClose={() => setIsCreateModalVisible(false)} />
          </View>
        </Modal>
        <Modal isVisible={isEditModalVisible} style={styles.modal}>
          <View style={styles.modalContent}>
            {selectedPromotion && (
              <EditPromotionForm
                promotion={selectedPromotion}
                onClose={handleCloseEditModal}
              />
            )}
          </View>
        </Modal>
        {loading ? (
          <Loader></Loader>
        ) : (filteredPromotions.length > 0 ? (
          filteredPromotions.map((promotion: Promotion, index: number) => (
            <PromotionCard
              key={promotion.promotion_id}
              promotion={promotion}
              index={index}
              handlePress={handlePress}
              handleEdit={handleEditPromotion}
              handleDelete={handleDeletePromotion}
            />
          ))
        ) : (
          <View style={styles.noPromotionsContainer}>
            <Text style={styles.noPromotionsText}>No hay promociones creadas.</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  filters: {
    marginBottom: 20,
  },
  btns: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    // right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center', // Fondo blanco para la barra de botones
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 1,
  },
  labelMisprefer: {
    color: '#f1ad3e',
    marginLeft: 8,
    fontWeight: 'bold'
  },
  misPrefe: {

    display: 'flex',
    flexDirection: 'row',
    width: '70%',
    marginBottom: 20,
    alignSelf: 'center'
  },
  checkbox: {
    borderRadius: 8,
    borderColor: 'rgb(172, 208, 213)',
  },
  checkboxContainer: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '50%',
    paddingHorizontal: 5,
  },
  label: {
    marginLeft: 8,
  },
  input: {
    alignSelf: 'center',
    width: '70%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderColor: 'rgb(172, 208, 213)',
    borderWidth: 1,
    color: "#000"
  },
  filteraplyButton: {
    width: '60%',
    alignSelf: 'center',
    backgroundColor: 'rgb(0, 122, 140)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 3,
  },
  filterButton: {
    width: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(49, 121, 187, 1)',
    padding: 4,
    borderRadius: 8,
    alignItems: 'center',
    // marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 5,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  createButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007a8c',
    padding: 10,
    height: 65,
    width: 65,
    borderRadius: 50,
  },
  createButtonmas:{
    display:'flex',
    flexDirection:'row',
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center'
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  promotionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderRadius: 10,
    marginBottom: 25,
  },
  promotionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgb(0, 122, 140)',
  },
  promotionDates: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgb(172, 208, 213)',
    marginHorizontal: 15,
  },
  carouselItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: screenWidth,
    height: '100%',
    borderRadius: 10,
  },
  carousel: {
    alignSelf: 'center',
  },
  discountContainerText: {
    width: '80%',

  },
  discountContainer: {
    // height:'50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignContent: 'center',
    alignItems: 'center',
    width: '20%',
  },
  discountContText: {
    backgroundColor: '#FF6347',
    width: '85%',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    textAlign: 'center'
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,

  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
  },
  closeButton: {
    width: '60%',
    alignSelf: 'center',
    backgroundColor: '#f1ad3e',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 3,
  },
  clearFiltersButton: {
    width: '45%',
    alignSelf: 'center',
    backgroundColor: '#f1ad3e',
    padding: 4,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 3,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  containerDate: {
    padding: 20,
  },
  inputdate: {
    alignSelf: 'center',
    width: '80%',
    padding: 10,
    borderRadius: 8,
    borderColor: 'rgb(172, 208, 213)',
    borderWidth: 1,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  textDate: {
    fontSize: 16,
  },
  confirmButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#64C9ED',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  loader: {
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  starCont: {
    marginTop: 20,
    zIndex: 10,
  },
  star: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 0.5,
    elevation: 1,
  },
  noPromotionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noPromotionsText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
});

export default PromotionsScreen;
