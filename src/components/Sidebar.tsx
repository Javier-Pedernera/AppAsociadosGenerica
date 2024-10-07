// import React from 'react';
// import { DrawerContentComponentProps } from '@react-navigation/drawer';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// import { useDispatch } from 'react-redux';
// import { logoutUser } from '../services/authService';
// import { SimpleLineIcons } from '@expo/vector-icons';

// const Sidebar: React.FC<DrawerContentComponentProps> = (props) => {

//   const dispatch = useDispatch();

//   const handleLogout = () => {
//     dispatch(logoutUser() as any);
//   };

//   const navigateToScreen = (screenName: string) => {
//     props.navigation.navigate('MainTabs', { screen: screenName });
//   };


//   return (
//     <View style={styles.container}>
//       <TouchableOpacity style={styles.option} onPress={() => navigateToScreen('Perfil')}>
//         <MaterialCommunityIcons style={styles.icon} name="account-box" size={24} color="#000" />
//         <Text style={styles.optionText}>Perfil de usuario</Text>
//       </TouchableOpacity>
//       <TouchableOpacity style={styles.option} onPress={() => navigateToScreen('Favoritos')}>
//         <MaterialCommunityIcons style={styles.icon} name="folder-heart-outline" size={24} color="#000" />
//         <Text style={styles.optionText}>Favoritos</Text>
//       </TouchableOpacity>
//       <TouchableOpacity style={styles.option} onPress={() => navigateToScreen('Contacto')}>
//         <MaterialCommunityIcons style={styles.icon} name="card-account-phone-outline" size={24} color="#000" />
//         <Text style={styles.optionText}>Contacto</Text>
//       </TouchableOpacity>
//       <TouchableOpacity style={styles.option} onPress={() => navigateToScreen('PuntosTuristicos')}>
//         <MaterialCommunityIcons style={styles.icon} name="map" size={24} color="#000" />
//         <Text style={styles.optionText}>Puntos Turísticos</Text>
//       </TouchableOpacity>
//       <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
//       <SimpleLineIcons style={styles.icon} name="logout" size={20} color="#fff" />
//       <Text style={styles.optionText}>Cerrar sesión</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: 40,
//   },
//   option: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//   },
//   icon: {
//     width:25,
//     marginRight: 15,
//     marginLeft: 10,
//     color:'#F1AD3E'
//   },
//   optionText: {
//     color:'rgb(38, 38, 38)',
//     fontSize: 17,
//   },
//   logoutButton: {
//     // backgroundColor: '#64C9ED', // Usar color celeste de la paleta
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     marginTop:"20%"
//     // borderRadius: 25,
//     // borderColor: '#fff',
//     // borderWidth: 0.5,
//     // marginRight:10
//   },
// });

// export default Sidebar;


// Paleta: naranja: #F1AD3E
//         mostaza: #d59831
//         azul: rgb(0, 122, 140)
//         celeste: #64C9ED