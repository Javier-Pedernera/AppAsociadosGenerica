import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import { Promotion, ImagePromotion as PromotionImage } from '../redux/types/types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../redux/store/store';
import { getMemoizedFavorites } from '../redux/selectors/userSelectors';
import * as Animatable from 'react-native-animatable';
import type { View as AnimatableView } from 'react-native-animatable';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { getMemoizedStates } from '../redux/selectors/globalSelectors';
import { formatDateToDDMMYYYY } from '../utils/formatDate';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal } from 'react-native';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

interface PromotionCardProps {
  promotion: Promotion;
  index: number;
  handlePress: (promotion: Promotion) => void;
  handleEdit: (promotion: Promotion) => void;
  handleDelete: (promotionId: number) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, index, handlePress, handleEdit, handleDelete }) => {
  const { t } = useTranslation();
  const dispatch: AppDispatch = useDispatch();
  const [loadingImg, setLoadingImg] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);


  const handleImageLoadStart = () => setLoadingImg(true);
  const handleImageLoadEnd = () => setLoadingImg(false);


  const showDeleteConfirmation = (promotionId: number) => {
    setSelectedPromotionId(promotionId); // Guarda la promoción seleccionada
    setIsModalVisible(true); // Muestra el modal
  };

  const confirmDelete = () => {
    if (selectedPromotionId) {
      handleDelete(selectedPromotionId); // Llama a la función handleDelete solo si hay confirmación
    }
    setIsModalVisible(false); // Oculta el modal
  };
  const cancelDelete = () => {
    setSelectedPromotionId(null); // Limpia la promoción seleccionada
    setIsModalVisible(false); // Oculta el modal
  };

  return (
    <>
    <TouchableOpacity
      key={promotion.promotion_id}
      style={styles.promotionCard}
      onPress={() => handlePress(promotion)}
    >
      <View style={styles.carouselItem}>
        <Image
          source={
            promotion.images.length > 0
              ? { uri: promotion.images[0].image_path }
              : require('../../assets/images/images.png')
          }
          style={styles.carouselImage}
          onLoadStart={handleImageLoadStart}
          onLoadEnd={handleImageLoadEnd}
        />
        <View style={styles.previewOverlay}>
          <Ionicons name="eye" size={24} color="rgba(244, 244, 244,0.7)" />
          <Text style={styles.previewText}>{t('promotionCard.preview')}</Text>
        </View>
      </View>
      <View style={styles.promotionContent}>
        <View style={styles.discountContainerText}>
          <Text style={styles.promotionTitle}>{promotion.title}</Text>
          <Text style={styles.promotionDates}>
          {t('promotionCard.from')}: {formatDateToDDMMYYYY(promotion.start_date)}
          </Text>
          <Text style={styles.promotionDates}>
          {t('promotionCard.to')}: {formatDateToDDMMYYYY(promotion.expiration_date) }
          </Text>
          <Text style={styles.promotionDates}>
          {t('promotionCard.available')}: {promotion.available_quantity? promotion.available_quantity : t('promotionCard.unlimited')}
          </Text>
        </View>
        <View style={styles.discountContainer}>
          <View style={styles.discountContText}>
            <Text style={styles.discountText}>{promotion.discount_percentage}%</Text>
          </View>
          <View style={styles.starCont}>
           
              <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => handleEdit(promotion)}>
                  <MaterialCommunityIcons name="square-edit-outline" size={28} color="rgb(0, 122, 140)" style={styles.actionIcon} />
                </TouchableOpacity>
                <TouchableOpacity  onPress={() => showDeleteConfirmation(promotion.promotion_id)}>
                  <Ionicons name="trash-outline" size={25} color="#e04545" />
                </TouchableOpacity>
              </View>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
    </TouchableOpacity>
    {/* Modal de confirmación */}
    <Modal visible={isModalVisible} transparent={true} animationType="slide">
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalText}>{t('promotionCard.confirmDelete')}</Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity onPress={confirmDelete} style={styles.confirmButton}>
            <Text style={styles.buttonText}>{t('promotionCard.yes')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={cancelDelete} style={styles.cancelButton}>
            <Text style={styles.buttonText}>{t('promotionCard.no')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  </>
  );
};

const styles = StyleSheet.create({
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
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    color: 'rgb(0, 122, 140)',
  },
  promotionDates: {
    marginTop: 3,
    fontSize: screenWidth * 0.035,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgb(172, 208, 213)',
    marginHorizontal: 15,
  },
  carouselItem: {
    height: 150,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '90%',
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
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '20%',
    height: 'auto'
  },
  discountContText: {
    backgroundColor: '#007a8c',
    width: '80%',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  discountText: {

    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  starCont: {
    marginTop: 20,
    zIndex: 10,
  },
  actionsContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    alignItems: 'flex-start'
  },
  actionIcon: {
    marginBottom: 10,
    marginLeft: 0,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: '5%',
    right: 0,
    height: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 10
  },
  previewText: {
    fontWeight: 'bold',
    color: " rgba(244, 244, 244,0.7)"
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    color:'#007a8b',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    padding: 10,
    backgroundColor: '#e04545',
    borderRadius: 5,
    marginRight: 10,
    width:50,
  },
  cancelButton: {
    padding: 10,
    width:50,
    textAlign:'center',
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  buttonText: {
    textAlign:'center',
    color: 'white',
    fontWeight: 'bold',
  },
});

export default React.memo(PromotionCard);
