/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import {useState} from 'react';
import { NativeModules, Platform, StyleSheet, Text, View, Image, SafeAreaView, DeviceEventEmitter, NativeEventEmitter } from 'react-native';
import { ChatForm } from './ChatForm.js';
import theme from './theme.style'
import { Snackbar } from 'react-native-paper';

const { GenesysCloud } = NativeModules;

// On Android device, sets the screen orientation to be as on the activating App:
const orientation = Platform.OS === 'android' ? GenesysCloud.getConstants().SCREEN_ORIENTATION_LOCKED : undefined

// Create event emitter to subscribe to chat events
const eventEmitter = Platform.OS === 'android' ? DeviceEventEmitter : new NativeEventEmitter(GenesysCloud)


const listeners = {}

export default function App() {

  const [isSnackVisible, setIsSnackVisible] = useState(false)
  const [errorMessage, setMessage] = useState("");  

  // Error events are of the following format: {errorCode:"", reason:"", message:""}
  const onError = (error) => {
    const snackMessage = error.message ?? error.reason
    console.log(`onError: errorCode = ${error.errorCode}, message = ${snackMessage}`);  
    setMessage(snackMessage)
    setIsSnackVisible(true)
  };
  
  // State events are of the following format: {state:""} 
  const onStateChanged = (state) => {
    console.log(`onStateChanged: state = ${state.state}, listeners size = ${Object.keys(listeners).length}`);  

    if(state.state == 'ended'){
        Object.keys(listeners).forEach((key)=>{
          const listener = listeners[key]
          console.log(`removing listener: ${key}`);
          if(listener) listener.remove();
        })
    }
  };
  
  // data contains the fields content
  const onSubmit = (data) => {
    
    setIsSnackVisible(false)

    // Adds a listener to messenger chat errors.
    listeners['onMessengerError'] = eventEmitter.addListener('onMessengerError', onError);

    // Adds a listener to messenger chat state events.
    listeners['onMessengerState'] = eventEmitter.addListener('onMessengerState', onStateChanged);

    if(orientation != undefined) {
      GenesysCloud.requestScreenOrientation(orientation)
    }
    
    GenesysCloud.startChat(data.deploymentId, data.domain, data.tokenStoreKey, data.logging);
  }

  const onDismissSnackBar = () => setIsSnackVisible(false);


  return (
    <SafeAreaView style={styles.container}>
      <View style={{flexDirection: "row", justifyContent: 'center'}}>
      <Image style={{width:35, height:35,marginTop:5}} source={require('./img/genesys-logo-red-180.png')}/>
      <Text style={styles.title}>Genesys Chat</Text>
      </View>
      <Text style={styles.title_sub}>Fill the following parameters to start your chat</Text>
      <ChatForm onSubmit={onSubmit} />
      <Snackbar duration={5000}
        visible={isSnackVisible}
        style={{backgroundColor:'#454545'}}
        onDismiss={onDismissSnackBar}
        action={{
          label: 'ok',
          onPress: () => {
            setIsSnackVisible(false)
          },
        }}
      >{errorMessage}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.mainBack,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft:15,
    marginRight:15,
  },
  title: {
    color: theme.genesysOrange,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginTop:20,
    marginBottom: 10
  },
  title_sub: {
    color :'#6b6968',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop:10
  }
});
