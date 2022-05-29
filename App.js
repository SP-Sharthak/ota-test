/**
 * Sample BLE React Native App
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Button,
  TouchableOpacity,
} from 'react-native';

import {Header, Colors} from 'react-native/Libraries/NewAppScreen';
import {stringToBytes, bytesToString} from 'convert-string';
import BleManager from 'react-native-ble-manager';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const App = () => {
  const [scan, setScan] = useState(false);
  const [result, setResult] = useState();
  const [number, setNumber] = useState('0');
  const [list, setList] = useState([]);
  const [connected, setConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map();

  const resultVal = useRef('');
  const numberVal = useRef('');

  useEffect(() => {
    resultVal.current = result;
    numberVal.current = number;
  });

  const startScan = () => {
    // setScan(true);
    setResult();
  };

  readBinary = () => {
    try {
      // Open a file for reading
      // const fd = await BinaryFile.open('./display-stm32f1.bin');
      // // // Read a byte
      // const byteValue = await BinaryFile.readByte(fd);
      // console.log('====BYTE-VALUE=====>', byteValue);
      // // // Read a byte
      // // const byteValue = await BinaryFile.readByte(fd);
      // // // Read a next integer (int32) - big endian
      // // const intValue = await BinaryFile.readInt32(fd);
      // // // Read a next integer (int64) - big endian
      // // const intValue = await BinaryFile.readInt64(fd);
      // // Seek to 1024
      // await BinaryFile.seek(fd, 1024);
      // // Read 512 bytes (uint8[])
      // const buffer = await BinaryFile.read(fd, 512);
      // console.log('========BUFFFER=======>', buffer);
      // // Close the file
      // await BinaryFile.close(fd);
      // Another file
      // const fd2 = await BinaryFile.open('path-to-file-2');
      // ...
      // await BinaryFile.close(fd2);
    } catch (err) {
      console.log('==e-r-r==>', err);
    }
  };

  const startScanBt = () => {
    // if (!isScanning) {
    //   BleManager.scan([], 3, true)
    //     .then(results => {
    //       console.log('Scanning...');
    //       setIsScanning(true);
    //     })
    //     .catch(err => {
    //       console.error(err);
    //     });
    // }
    readBinary();
  };

  const handleStopScan = () => {
    console.log('Scan is stopped');
    setIsScanning(false);
  };

  const startNot = async peripheral => {
    try {
      await BleManager.startNotification(
        peripheral,
        '2cc83522-8192-4b6c-ad94-1f54123ed827',
        '2cc83522-8192-4b6c-ad94-1f54123ed821',
      );
      console.log(`Started notification on ${peripheral.id}`);
    } catch (error) {
      console.log('Start Notification error => ', error);
    }
  };

  const handleDisconnectedPeripheral = data => {
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    }
    console.log('Disconnected from ' + data.peripheral);
  };

  const handleUpdateValueForCharacteristic = data => {
    console.log(
      'Received data from ' +
        data.peripheral +
        ' characteristic ' +
        data.characteristic,
      data.value,
    );
  };

  const connectP = async peripheral => {
    try {
      await BleManager.connect(peripheral);
    } catch (err) {
      console.log('CONNECTION ERROR ', err);
    }
  };

  const retreiveP = async peripheral => {
    try {
      await BleManager.retrieveServices(peripheral);
    } catch (error) {
      console.log('retrieve error => ', error);
    }
  };

  const writeP = async peripheral => {
    const convertDataToBytes = stringToBytes(numberVal.current);
    BleManager.write(
      peripheral,
      '2cc83522-8192-4b6c-ad94-1f54123ed870',
      '2cc83522-8192-4b6c-ad94-1f54123ed871',
      convertDataToBytes,
    )
      .then(() => {
        console.log('Write success');
      })
      .catch(err => {
        console.log('Write error => ', err);
      });
  };

  const readP = async peripheral => {
    try {
      const readData = await BleManager.read(
        peripheral.id,
        '2cc83522-8192-4b6c-ad94-1f54123ed860',
        '2cc83522-8192-4b6c-ad94-1f54123ed861',
      );
      const convertBytesToString = bytesToString(readData);

      console.log('READ DATA => ', convertBytesToString);
    } catch (error) {
      console.log('READ DATA ERROR => \n', error);
    }
  };

  const handleDiscoverPeripheral = async peripheral => {
    // console.log(peripheral);
    if (peripheral.name === 'UN-Bolted Module Test') {
      console.log('yohoo', peripheral);
      await BleManager.stopScan();
      await connectP(peripheral.id);
      await retreiveP(peripheral.id);
      await writeP(peripheral.id);
      return;
    }
  };

  useEffect(() => {
    BleManager.start({showAlert: false});

    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);
    bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      handleDisconnectedPeripheral,
    );
    bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      handleUpdateValueForCharacteristic,
    );
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Header />
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.centerText}>{result}</Text>
              <TextInput
                style={styles.input}
                onChangeText={newNumber => setNumber(newNumber)}
                value={number}
                placeholder="Enter minutes"
              />

              <Button title="Start" color="#000000" onPress={startScanBt} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
});

export default App;
