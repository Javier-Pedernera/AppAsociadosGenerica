import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, FlatList, Dimensions, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapSingle from './MapSingle';
import { Branch, UserData } from '../redux/types/types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../redux/store/store';
import { addBranch, updateBranch } from '../redux/actions/branchActions';
import { getMemoizedUserData } from '../redux/selectors/userSelectors';
import * as Location from 'expo-location';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Loader from './Loader';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface BranchFormProps {
  branch: any;
  onClose: () => void;
}
export interface BranchCreate {
  partner_id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  status_id: number;
  image_url?: string;
  image_data?: string;
}
const initialRegion = {
  latitude: -36.133852565671226,
  longitude: -72.79750640571565,
  latitudeDelta: 0.035,
  longitudeDelta: 0.02,
};
export const BranchForm: React.FC<BranchFormProps> = ({ branch, onClose }) => {

  const dispatch: AppDispatch = useDispatch();
  const user = useSelector(getMemoizedUserData) as UserData;
  const [name, setName] = useState(branch?.name || '');
  const [address, setAddress] = useState(branch?.address || '');
  const [latitude, setLatitude] = useState(branch?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(branch?.longitude?.toString() || '');
  const [images, setImages] = useState<{ filename: string, data: string }[]>([]);
  const [branchSelect, setBranchSelect] = useState<any>(null);
  const [description, setDescription] = useState(branch?.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = async () => {

    setIsLoading(true);
    const image_data = images.length > 0 ? images[0].data : '';
    const branchData: BranchCreate = {
      partner_id: user.user_id,
      name,
      address,
      description,
      latitude:parseFloat(latitude),
      longitude: parseFloat(longitude),
      status_id: 1,
      image_data: image_data.length? image_data : undefined,
    };
     try {
    // console.log('Enviando datos de la sucursal:', branchData);
    // console.log('Tiene branch id:', branch.branch_id);
    // console.log('imagen nueva?:', image_data.length);
    let resp;
    if (branch.branch_id) {
      resp = await dispatch(updateBranch(branch.branch_id, branchData));
      console.log("respuesta del dispatch (update)", resp);
    } else {
      resp = await dispatch(addBranch(branchData));
      console.log("respuesta del dispatch (add)", resp);
    }
      Alert.alert('Éxito', 'La sucursal se ha creado/actualizado correctamente.');
      onClose();
    } catch (error) {
      console.error('Error al enviar los datos de la sucursal:', error);
      Alert.alert('Error', 'Hubo un problema al guardar la sucursal. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (branchSelect) {
      setLatitude(branchSelect.latitude.toString());
      setLongitude(branchSelect.longitude.toString());
    }
  }, [branchSelect]);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      aspect: [16, 9],
      quality: 0.7
    });

    if (!result.canceled) {
      const image = result.assets[0];
      const filename = image.uri.split('/').pop() || 'default_filename.jpg';
      setImages([{ filename, data: image.base64 || '' }]);
    }
  };
  const handleSetCurrentLocation = async () => {
    try {
      // Pedir permiso para acceder a la ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso para acceder a la ubicación denegado');
        return;
      }

      // Obtener la ubicación actual
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
    }
  };
  const formItems = [
    {
      id: 'image',
      component: (
        <View>
          {!isEditing? <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
              <MaterialCommunityIcons name="file-edit-outline" size={23} color="#fff" />
            </TouchableOpacity> : <View></View> }
          <TouchableOpacity onPress={handleImagePick} disabled={!isEditing}>
            {images.length > 0 ? (
              <Image source={{ uri: `data:image/jpeg;base64,${images[0].data}` }} style={styles.image} resizeMode="cover" />
            ) : (
              branch.image_url.length? <Image source={{ uri: branch.image_url }} style={styles.image} resizeMode='contain' /> :
              <View style={styles.placeholderImage}>
                <Text>No tienes ninguna imagen aún</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ),
    },
    {
      id: 'name',
      component: (
        isEditing?
        <>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la sucursal"
            value={name}
            onChangeText={setName}
          />
        </>: <Text style={styles.label}>{name}</Text>
      ),
    },
    {
      id: 'address',
      component: (
        isEditing?
        <>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={styles.input}
            placeholder="Dirección"
            value={address}
            onChangeText={setAddress}
          />
        </>:<Text style={styles.label}>{address}</Text>
      ),
    },
    {
      id: 'description',
      component: (
        isEditing?
        <>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={styles.input}
            placeholder="Descripción de la sucursal"
            value={description}
            onChangeText={setDescription}
          />
        </>: <Text style={styles.label}>{description}</Text>
      ),
    },
    {
      id: 'setCurrentLocation',
      component: (
        isEditing?
        <TouchableOpacity style={styles.locationButton} onPress={handleSetCurrentLocation}>
          <Text style={styles.locationButtonText}>Usar mi ubicación actual</Text>
        </TouchableOpacity>:
        <View></View>
      ),
    },
    {
      id: 'locationInputs',
      component: (
        <View style={styles.locationContainer}>
          <View style={styles.locationInputWrapper}>
            <Text style={styles.labellat}>Latitud</Text>
            <TextInput
              style={styles.inputLatLong}
              placeholder="Latitud"
              keyboardType="numeric"
              value={latitude}
              onChangeText={setLatitude}
              editable={false}
            />
          </View>
          <View style={styles.locationInputWrapper}>
            <Text style={styles.labellat}>Longitud</Text>
            <TextInput
              style={styles.inputLatLong}
              placeholder="Longitud"
              keyboardType="numeric"
              value={longitude}
              onChangeText={setLongitude}
              editable={false}
            />
          </View>
        </View>
      ),
    },
    {
      id: 'map',
      component: (
        <View>
          {isEditing? <Text style={styles.labelMap}>Elige la ubicación de la sucursal en el mapa</Text>:<></>} 
          <MapSingle
            branch={{ ...branch, latitude: parseFloat(latitude), longitude: parseFloat(longitude) }}
            currentPosition={null}
            destination={{ latitude: parseFloat(latitude), longitude: parseFloat(longitude) }}
            routeSelected={false}
            selectedBranch={branch}
            onMapPress={() => { }}
            handleGetDirections={() => { }}
            setSelectedBranch={isEditing? setBranchSelect: () => { }}
            routeLoading={false}
            setRouteLoading={() => { }}
            ratings={{ average_rating: 0 }}
            initialRegion={initialRegion}
            isEditing={isEditing}
            justSee={false}
          />
        </View>
      ),
    },
    {
      id: 'submitButton',
      component: (
        isEditing?
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {branch ? 'Guardar Cambios' : 'Crear Sucursal'}
            </Text>
          )}
        </TouchableOpacity> : <></>
      ),
    },
    {
      id: 'cancelButton',
      component: (
        isEditing?
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>: <></>
      ),
    },
  ];

  return (
    <View>
      {isLoading? <Loader />:<></>}
      <TouchableOpacity onPress={onClose} style={styles.backbutton}>
          <MaterialIcons name="arrow-back-ios-new" size={22} color="#fff" />
      </TouchableOpacity>
      <FlatList
        data={formItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <View>{item.component}</View>}
        contentContainerStyle={styles.container}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  backbutton:{
    position:'absolute',
    backgroundColor:'#007a8c',
    justifyContent:'center',
    textAlign:'center',
    alignItems:'center',
    top: 20,
    left:25,
    width:35,
    height:30,
    borderRadius:5,
    zIndex:1
  },
  image: {
    width: '100%',
    height: screenHeight * 0.3,
    marginBottom: 16,
    borderRadius: 10,
  },
  placeholderImage: {
    width: '100%',
    height: screenHeight * 0.3,
    marginBottom: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333'
  },
  input: {
    height: 35,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',

  },
  locationInputWrapper: {
    flex: 1,

    textAlign: 'center',
    marginRight: 10,
  },
  labellat: {
    marginTop: 20,
    textAlign: 'center',
    color: '#333'
  },
  inputLatLong: {
    textAlign: 'center',
    color: 'rgb(172, 208, 213)',
    // backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 5,
  },
  submitButton: {
    marginTop: 5,
    backgroundColor: 'rgb(0, 122, 140)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  locationButton: {
    backgroundColor: 'rgb(0, 122, 140)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  locationButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  labelMap: {
    marginTop: 30,
    marginBottom: -10,
    color: '#007a8c',
    alignSelf: 'center'
  },
  editButton: {
    position:'absolute',
    zIndex:1,
    top:screenHeight*0.27,
    right:screenHeight*0.04,
    width:40,
    height:40,
    padding:5,
    alignItems:'center',
    backgroundColor: '#007a8c',
    borderRadius: 25,
    alignSelf: 'flex-end',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
});

export default BranchForm;
// verde: #007a8c rgb(0, 122, 140)
// verde claro: #acd0d5 rgb(172, 208, 213)
//  verdeHoja: background: #336749;
// gris: #f6f6f6 rgb(246, 246, 246)