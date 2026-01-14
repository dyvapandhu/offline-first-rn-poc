import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import DB from './src/services/Database';
import SyncEngine from './src/services/SyncEngine';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Define helper functions first so they are available in useEffect
  const loadTodos = async () => {
    const loadedTodos = await DB.getTodos();
    setTodos(loadedTodos);
  };

  const sync = async () => {
    setIsSyncing(true);
    await SyncEngine.sync();
    setIsSyncing(false);
    loadTodos(); // Refresh in case Pull brought new items
  };

  const addTodo = async () => {
    if (!newTodo) return;

    const todo = {
      id: Date.now().toString(),
      title: newTodo,
      status: 'pending'
    };

    // Optimistic UI Update handled by loadTodos after DB insert
    await DB.addTodo(todo);
    setNewTodo('');
    loadTodos();

    // Auto-sync if online
    if (isConnected) {
      sync();
    }
  };

  useEffect(() => {
    let isMounted = true;

    const handleConnectivityChange = (connectionInfo) => {
      // In v3/Legacy, connectionInfo might be an object { type: 'wifi', ... }
      // We need to determine 'isConnected'.
      // Usually type !== 'none' && type !== 'unknown'
      const connected = connectionInfo.type !== 'none' && connectionInfo.type !== 'unknown';
      console.log(`[Network] Connected: ${connected} (${connectionInfo.type})`);

      if (isMounted) {
        setIsConnected(connected);
        if (connected) {
          sync();
        }
      }
    };

    const init = async () => {
      await DB.initDB();
      if (!isMounted) return;

      loadTodos();

      // Check initial connection
      // Use getConnectionInfo() for v3/Legacy compatibility
      NetInfo.getConnectionInfo().then(connectionInfo => {
        if (isMounted) {
          const connected = connectionInfo.type !== 'none' && connectionInfo.type !== 'unknown';
          setIsConnected(connected);
          if (connected) {
            sync();
          }
        }
      });

      // Subscribe to network changes
      // v3 requires event name 'connectionChange'
      NetInfo.addEventListener('connectionChange', handleConnectivityChange);
    };

    init();

    return () => {
      isMounted = false;
      NetInfo.removeEventListener('connectionChange', handleConnectivityChange);
    };
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.status}>{item.status}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>PowerSync POC (RN 0.59)</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New Todo..."
          value={newTodo}
          onChangeText={setNewTodo}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No Todos</Text>}
      />

      <TouchableOpacity style={styles.syncButton} onPress={sync} disabled={isSyncing}>
        <Text style={styles.syncButtonText}>
          {isSyncing ? "Syncing..." : "Sync Now"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  header: {
    padding: 20,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 20,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
    marginBottom: 5,
    borderRadius: 5
  },
  title: {
    fontSize: 16,
  },
  status: {
    fontSize: 12,
    color: 'gray',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: 'gray',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
