import React from "react";
import "./App.css";
//import BoardComponent from "./components/chess_board";
//import { PieceColor, NUM_OF_PLAYERS } from "./game_flow_util/game_elements";
//import { ClientFlowEngine } from "./client_side/client_flow_engine";
//import { ServerFlowEngine } from "./server_side/server_flow_engine";

/*
import { useEffect, useState, useReducer } from 'react'
import Gun from 'gun'

// initialize gun locally
const gun = Gun({
  peers: [
    'http://localhost:3030/gun'
  ]
})

// create the initial state to hold the messages
const initialState = {
  messages: []
}

// Create a reducer that will update the messages array
function reducer(state: any, message: any) {
  return {
    messages: [message, ...state.messages]
  }
}
*/

import TestComponent from "./components/test_component"

export default function App() {
  

  


  return <TestComponent />;

  /*
  // the form state manages the form input for creating a new message
    const [formState, setForm] = useState({
    name: '', message: ''
  })

  // initialize the reducer & state for holding the messages array
  const [state, dispatch] = useReducer(reducer, initialState)

  // when the app loads, fetch the current messages and load them into the state
  // this also subscribes to new data as it changes and updates the local state
  useEffect(() => {
    const messages = gun.get('messages')
    messages.map().on(m => {
      dispatch({
        name: m.name,
        message: m.message,
        createdAt: m.createdAt
      })
    })
  }, [])

  // set a new message in gun, update the local state to reset the form field
  function saveMessage() {
    const messages = gun.get('messages')
    messages.set({
      name: formState.name,
      message: formState.message,
      createdAt: Date.now()
    })
    setForm({
      name: '', message: ''
    })
  }

  // update the form state as the user types
  function onChange(e: any) {
    setForm({ ...formState, [e.target.name]: e.target.value  })
  }

  return (
    <div style={{ padding: 30 }}>
      <input
        onChange={onChange}
        placeholder="Name"
        name="name"
        value={formState.name}
      />
      <input
        onChange={onChange}
        placeholder="Message"
        name="message"
        value={formState.message}
      />
      <button onClick={saveMessage}>Send Message</button>
      {
        state.messages.map(message => (
          <div key={message.createdAt}>
            <h2>{message.message}</h2>
            <h3>From: {message.name}</h3>
            <p>Date: {message.createdAt}</p>
          </div>
        ))
      }
    </div>
  );
  */
}

/*
function App() {

  
  
































  /*
  let serverFlowEngine: ServerFlowEngine = new ServerFlowEngine();
  let clientFlowEngines: ClientFlowEngine[] = [...Array(NUM_OF_PLAYERS)].map(
    (_, i) => new ClientFlowEngine()
  );
  */
//return <h1>hello</h1>
/*
  return (
    <div className="centered">
      <BoardComponent
        size={850}
        lightColor="#9999bb"
        darkColor="#454545"
        povColor={PieceColor.white}
        clientFlowEngine={new ClientFlowEngine()}
      />
  
      <button
        onClick={() => {
          serverFlowEngine.acceptConnections(8000, "127.0.0.1");
          for (let clientFlowEngine of clientFlowEngines) {
            clientFlowEngine.connect(8000, "127.0.0.1");
          }
        }}
      >
        start
      </button>
    </div>
  );
  
}

export default App;
*/
