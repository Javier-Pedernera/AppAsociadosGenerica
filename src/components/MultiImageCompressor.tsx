import React, { useState } from 'react';
import { View, Button, Image, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface MultiImageCompressorProps {
    onImagesCompressed: (images: { filename: string; data: string }[]) => void;
}

const MultiImageCompressor: React.FC<MultiImageCompressorProps> = ({ onImagesCompressed }) => {
    const [imageUris, setImageUris] = useState<string[]>([]);

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true, // Permite seleccionar varias imágenes
            quality: 1,
        });

        if (!result.canceled) {
            const { assets } = result;
            if (assets) {
                const uris = assets.map(asset => asset.uri);
                // Agregar nuevas imágenes sin eliminar las anteriores
                setImageUris(prevUris => [...prevUris, ...uris]);
                compressImages([...imageUris, ...uris]);
            }
        }
    };

    const compressImages = async (uris: string[]) => {
        try {
            const compressedImages = await Promise.all(
                uris.map(async (uri) => {
                    const { base64 } = await ImageManipulator.manipulateAsync(
                        uri,
                        [{ resize: { width: 800 } }],
                        { base64: true }
                    );
                    const filename = `image_${new Date().getTime()}.jpg`;

                    if (base64 === undefined) {
                        throw new Error(`No se pudo obtener base64 para la imagen: ${uri}`);
                    }

                    return { filename, data: base64 };
                })
            );
            onImagesCompressed(compressedImages);
        } catch (error) {
            Alert.alert('Error', 'No se pudo comprimir las imágenes.');
        }
    };

    const removeImage = (uri: string) => {
        setImageUris(prevUris => prevUris.filter(imageUri => imageUri !== uri));
    };

    return (
        <View style={styles.container}>
       <TouchableOpacity style={styles.submitButton} onPress={pickImages}>
       <MaterialCommunityIcons name="image-plus" size={24} color="#fff" />
        <Text style={styles.submitButtonText}>Agregar Imágenes</Text>
      </TouchableOpacity>
        <View style={styles.imagesGrid}>
            {imageUris.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(uri)}>
                        <Ionicons name="trash-outline" size={22} color="#e04545" />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        display:'flex',

    },
    imagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    imageContainer: {
        display:'flex',
        width:'45%',
        justifyContent:'center',
        alignContent:'center',
        paddingTop:10,        
        position: 'relative',
        marginBottom: 10,
    },
    image: {
        width: 70,
        height: 70,
        marginRight: 10,
    },
    removeButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(178, 171, 171,0.3)',
        padding: 5,
        borderRadius: 10,
    },
    submitButton: {
        backgroundColor: '#F1AD3E',
        width:'85%',
        alignSelf:'center',
        display:'flex',
        justifyContent:'space-evenly',
        flexDirection:'row',
        alignItems:'center',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
      },
      submitButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight:'bold'
      },
});

export default MultiImageCompressor;
