import { Dispatch } from 'redux';
import { setBranches, clearBranches, fetchBranchRatingsRequest, fetchBranchRatingsSuccess, fetchBranchRatingsFailure, addBranchRating, editBranchRating, deleteBranchRating, clearBranchRatings, addBranchRequest, addBranchSuccess, addBranchFailure, updateBranchSuccess, updateBranchFailure, updateBranchRequest } from '../reducers/branchReducer';
import { RootState } from '../store/store';
import axios from 'axios';
import { Branch, Rating, RatingBranch } from '../types/types';
import { BranchCreate } from '../../components/BranchForm';


const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const fetchBranches = (partnerId: number) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      const state = getState();
      const token = state.user.accessToken;
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      const response = await axios.get<Branch[]>(`${API_URL}/partners/${partnerId}/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      dispatch(setBranches(response.data));
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error; 
    }
  };
};
export const addBranch = (branchData: any) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    dispatch(addBranchRequest());
    try {
      const state = getState();
      const token = state.user.accessToken;

      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.post<any>(`${API_URL}/branches`, branchData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log("respuesta en la action",response);
      
      dispatch(addBranchSuccess(response.data));
    } catch (error: any) {
      dispatch(addBranchFailure(error.toString()));
    }
  };
};
export const updateBranch = (branchId: number, branchData: BranchCreate) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    dispatch(updateBranchRequest());
    try {
      const state = getState();
      const token = state.user.accessToken;

      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.put(`${API_URL}/branches/${branchId}`, branchData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log('Respuesta de actualización de sucursal:', response);
      dispatch(updateBranchSuccess(response.data));
    } catch (error: any) {
      console.error('Error al actualizar la sucursal:', error);
      dispatch(updateBranchFailure(error.toString()));
    }
  };
};
export const clearAllBranches = () => {
  return (dispatch: Dispatch) => {
    dispatch(clearBranches());
  };
};

export const fetchBranchRatings = (branchId: number) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    dispatch(fetchBranchRatingsRequest());
    try {
      const response = await axios.get<{ ratings: RatingBranch[], average_rating: number }>(`${API_URL}/branches/${branchId}/ratings/all`);
      dispatch(fetchBranchRatingsSuccess(response.data));
    } catch (error:any) {
      dispatch(fetchBranchRatingsFailure(error.toString()));
    }
  };
};

export const addRating = (branchId: number, rating: RatingBranch) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      const response = await axios.post<RatingBranch>(`${API_URL}/branches/${branchId}/ratings`, rating);
      dispatch(addBranchRating(response.data));
    } catch (error) {
      throw error;
    }
  };
};

export const editRating = (branchId: number, rating: RatingBranch) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      const response = await axios.put<RatingBranch>(`${API_URL}/branches/ratings/${branchId}`, rating);
      dispatch(editBranchRating(response.data));
    } catch (error) {
      throw error;
    }
  };
};

export const deleteRating = (branchId: number, ratingId: number) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      await axios.delete(`${API_URL}/branches/ratings/${branchId}`, { data: { id: ratingId } });
      dispatch(deleteBranchRating(ratingId));
    } catch (error) {
      throw error;
    }
  };
};
export const clearBranchRatingsAction = () => {
  return (dispatch: Dispatch, getState: () => RootState) => {
    dispatch(clearBranchRatings());
  };
};