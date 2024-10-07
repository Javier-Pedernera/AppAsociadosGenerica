import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { getMemoizedBranches } from '../redux/selectors/branchSelectors';
import { BranchForm } from '../components/BranchForm';
import SemicirclesOverlay from '../components/SemicirclesOverlay';
import { Dimensions } from 'react-native';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Branches: React.FC = () => {
  const branches = useSelector(getMemoizedBranches);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const handleView = (branch: any) => {
    setSelectedBranch(branch);
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    setSelectedBranch(null);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedBranch(null);
  };

  return (
    <View style={styles.container}>
      <SemicirclesOverlay/>
      <Text style={styles.nameTitle}>Tus sucursales activas</Text>
      <FlatList
        data={branches}
        keyExtractor={(item) => item.branch_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.branchContainer}>
            <Image source={{ uri: item.image_url }} style={styles.image} />
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => handleView(item)}
              >
                <Text style={styles.buttonText}>Ver</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      {!branches.length && (
        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Crear Sucursal</Text>
        </TouchableOpacity>
      )}

      <Modal visible={isModalVisible} animationType="slide">
        <BranchForm branch={selectedBranch} onClose={closeModal} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display:'flex',
    height: screenHeight ,
    padding: 16,
    backgroundColor: '#fff',
  },
  nameTitle:{
    height: screenHeight *0.25,
    fontSize: 16,
    color:'#fff',
    fontWeight:'600',
    textAlign:'center',
  },
  branchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
    paddingLeft:10,
    paddingRight:10
  },
  image: {
    width: 100,
    height: 50,
    marginRight: 16,
  },
  name: {
    fontSize: 16,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  viewButton: {
    backgroundColor: '#007a8c',
    padding: 8,
    borderRadius: 8,
    width:80,
    textAlign:'center'
  },
  buttonText: {

    textAlign:'center',
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#007a8c',
    padding: 16,
    
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Branches;
