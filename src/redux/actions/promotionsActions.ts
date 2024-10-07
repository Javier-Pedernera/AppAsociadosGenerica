// src/actions/promotionActions.ts
import { Dispatch } from 'redux';
import axios from 'axios';
import { addPromotion, setConsumedPromotions, setPromotions, setPromotionsError, updateConsumedPromotion, updatePromotion } from '../reducers/promotionReducer';
import {  PromotionCreate, PromotionUpdate } from '../types/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const fetchPromotions = (partnerId: number) => {
  return async (dispatch: Dispatch) => {
    try {
      const response = await axios.get(`${API_URL}/partners/${partnerId}/promotions`);
      
      dispatch(setPromotions(response.data));
    } catch (firstError: any) {
      console.error('First attempt to fetch promotions failed:', firstError.message);
      if (axios.isAxiosError(firstError)) {
        console.error('Axios error details:', firstError.toJSON());
      }

      // Pequeño retraso antes del segundo intento
      await new Promise(resolve => setTimeout(resolve, 3000));

      // try {
      //   const retryResponse = await axios.get(`${API_URL}/promotions`);
      //   dispatch(setPromotions(retryResponse.data));
      // } catch (secondError: any) {
      //   console.error('Second attempt to fetch promotions failed:', secondError.message);
      //   if (axios.isAxiosError(secondError)) {
      //     console.error('Axios error details:', secondError.toJSON());
      //   }

      //   // Dispatch an error action or handle the error as needed
      //   dispatch(setPromotionsError('Failed to fetch promotions after retry.'));
      // }
    }
  };
};



export const createPromotion = (promotion: PromotionCreate) => {
  return async (dispatch: Dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/promotions`, promotion);
      dispatch(addPromotion(response.data));
    } catch (error) {
      console.error('Error creating promotion:', error);
    }
  };
};

export const modifyPromotion = (promotionId: number, data: any, deletedImageIds: number[]) => {
  return async (dispatch: Dispatch) => {
    try {
      if (deletedImageIds.length) {
        const imgDelete = { 'image_ids': deletedImageIds };
        console.log(imgDelete);
        const responseDeleted = await axios.post(`${API_URL}/promotion_images/delete`, imgDelete);
        console.log(responseDeleted);
      }
      const response = await axios.put(`${API_URL}/promotions/${promotionId}`, data);
      dispatch(updatePromotion(response.data));
    } catch (error) {
      console.error('Error updating promotion:', error);
    }
  };
};

export const deletePromotion = (promotionId: number, data: any) => {
  return async (dispatch: Dispatch) => {
    try {
      const dataSend = {status_id: data}
      // console.log("imprimo status",dataSend);
      
      const response = await axios.put(`${API_URL}/promotions/${promotionId}`, dataSend);
      dispatch(updatePromotion(response.data));
    } catch (error) {
      console.error('Error updating promotion:', error);
    }
  };
};

export const submitConsumption = (data: any) => {
  return async (dispatch: Dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/promotion_consumeds`, data);
      return response
      // Si es necesario, puedes despachar otra acción para actualizar el estado de las promociones
      // dispatch(someAction(response.data));
    } catch (error: any) {
      console.error('Error submitting consumption:', error.message);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.toJSON());
      }

      // Manejo de errores en caso de fallo
      dispatch(setPromotionsError('Failed to submit promotion consumption.'));
    }
  };
};

export const fetchConsumedPromotions = (partnerId: number) => {
  return async (dispatch: Dispatch) => {
    try {
      const response = await axios.get(`${API_URL}/promotion_consumeds/partner/${partnerId}`);
      dispatch(setConsumedPromotions(response.data));
    } catch (error: any) {
      console.error('Error fetching consumed promotions:', error.message);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.toJSON());
      }

      // Manejo de errores
      dispatch(setPromotionsError('Failed to fetch consumed promotions.'));
    }
  };
};

export const deletePromotionConsumed = (promconsumedId: number, data:any) => {
  return async (dispatch: Dispatch) => {
    try {
      const response = await axios.put(`${API_URL}/promotion_consumeds/${promconsumedId}`, data);
      dispatch(updateConsumedPromotion(response.data))
      return response 
    } catch (error: any) {
      console.error('Error fetching consumed promotions:', error.message);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.toJSON());
      }
      // Manejo de errores
      dispatch(setPromotionsError('Failed to fetch consumed promotions.'));
    }
  };
};
