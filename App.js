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
import RNFS from 'react-native-fs';
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
      // const file = new FileReader();
      // file.onload = function (evt) {
      //   console.log('HERE ====>', evt.target.result);
      // };
      // file.readAsBinaryString(binfile);

      RNFS.readFileAssets('display-stm32f1.bin') // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
        .then(result => {
          console.log('GOT RESULT', result);
          // stat the first file
          // return Promise.all([RNFS.stat(result[0].path), result[0].path]);
        })
        // .then(statResult => {
        //   // if (statResult[0].isFile()) {
        //   // if we have a file, read it
        //   return RNFS.readFile('./display-stm32f1', 'base64');
        //   // }

        //   // return 'no file';
        // })
        .then(contents => {
          // log the file contents
          console.log(contents);
        })
        .catch(err => {
          console.log(err.message, err.code);
        });
    } catch (err) {
      console.log('==e-r-r==>', err);
    }
  };

  const startScanBt = () => {
    if (!isScanning) {
      BleManager.scan([], 3, true)
        .then(() => {
          console.log('Scanning...');
          setIsScanning(true);
        })
        .catch(err => {
          console.error(err);
        });
    }
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
    setConnected(false);
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
      if (connected) return;
      await BleManager.connect(peripheral);
      setConnected(true);
      console.log('connected');
    } catch (err) {
      console.log('CONNECTION ERROR ', err);
    }
  };

  const retreiveP = async peripheral => {
    try {
      if (connected) return;
      await BleManager.retrieveServices(peripheral);
      console.log('retrieved');
    } catch (error) {
      console.log('retrieve error => ', error);
    }
  };

  const readBytes = async () => {
    try {
      const result = await RNFS.readFileAssets('display-stm32f1.bin', 'base64');
      // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
      console.log('GOT RESULT', result);
      // stat the first file
      // return Promise.all([RNFS.stat(result[0].path), result[0].path]);
      return result;
    } catch (err) {
      console.log('Read bytes error => ', err);
      return '0';
    }
  };

  const writeBytes = async peripheral => {
    const bytes = await readBytes();
    const convertDataToBytes = stringToBytes(bytes);
    if (bytes === '0') return;
    BleManager.writeWithoutResponse(
      peripheral,
      '2cc83522-8192-4b6c-ad94-1f54123ed870',
      '2cc83522-8192-4b6c-ad94-1f54123ed871',
      convertDataToBytes,
      // 1024,
    )
      .then(data => {
        console.log('Write success');
      })
      .catch(err => {
        console.log('Write error => ', err);
      });
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

  const handleDiscoveredPeripheral = async peripheral => {
    if (peripheral.name === 'UN-Bolted Module Test') {
      console.log('yohoo', peripheral);
      await BleManager.stopScan();
      await connectP(peripheral.id);
      await retreiveP(peripheral.id);
      // await writeP(peripheral.id);
      return;
    }
  };

  useEffect(() => {
    BleManager.start({showAlert: false});

    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoveredPeripheral,
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

              <Button
                title={connected ? 'Start' : 'Connect'}
                color="#000000"
                onPress={connected ? writeBytes : startScanBt}
              />
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
