import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
// import { getMemoizedCountries } from '../redux/selectors/countrySelectors';
import { AppDispatch, RootState } from '../redux/store/store';
import { getMemoizedCountries } from '../redux/selectors/globalSelectors';

interface CountryPickerProps {
  selectedCountry: string;
  onCountryChange: (value: string) => void;
  estilo: boolean
}

const CountryPicker: React.FC<CountryPickerProps> = ({ selectedCountry, onCountryChange, estilo }) => {
  const dispatch = useDispatch<AppDispatch>();
  const countries = useSelector((state: RootState) => getMemoizedCountries(state));

 

  return (
    <View style={styles.container}>
      <View style={estilo && styles.pickerWrapper}>
        <Picker
          selectedValue={selectedCountry}
          style={styles.picker}
          onValueChange={(itemValue: any) => onCountryChange(itemValue)}
        >
          <Picker.Item label="* Seleccione un país" value="" />
          {countries.map((country: any) => (
            <Picker.Item key={country.id} label={country.name} value={country.name} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 5,
  },
  label: {
   
    fontSize: 16,
    marginBottom: 8,
    textAlign:'left'
  },
  pickerWrapper: {
    display:'flex',
    justifyContent:'center',
    alignContent:'flex-start',
    alignItems:'flex-start',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 1,
    // paddingHorizontal: 15,
    backgroundColor: '#fff',
    // marginBottom: 15,
  },
  picker: {
    color: '#aaa',
    height: 45,
    width: '100%',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 1,
    
  },
});

export default CountryPicker;
