import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  NetInfo,
  SafeAreaView
} from 'react-native';

import DB from './src/services/Database';
import SyncEngine from './src/services/SyncEngine';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      newTodo: '',
      isSyncing: false,
      isConnected: true // Default to true, will update on mount
    };
  }

  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  handleConnectivityChange = (isConnected) => {
    console.log(`[Network] Connected: ${isConnected}`);
    this.setState({ isConnected });
    if (isConnected) {
      this.sync();
    }
  };

  async init() {
    await DB.initDB();
    this.loadTodos();

    // Check initial connection AFTER DB is ready
    NetInfo.isConnected.fetch().then(isConnected => {
      this.setState({ isConnected });
      if (isConnected) {
        this.sync();
      }
    });

    // Subscribe to network changes
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  async loadTodos() {
    const todos = await DB.getTodos();
    this.setState({ todos });
  }

  addTodo = async () => {
    if (!this.state.newTodo) return;

    const todo = {
      id: Date.now().toString(),
      title: this.state.newTodo,
      status: 'pending'
    };

    // Optimistic UI Update handled by loadTodos after DB insert
    await DB.addTodo(todo);
    this.setState({ newTodo: '' });
    this.loadTodos();

    // Auto-sync if online
    if (this.state.isConnected) {
      this.sync();
    }
  };

  sync = async () => {
    this.setState({ isSyncing: true });
    await SyncEngine.sync();
    this.setState({ isSyncing: false });
    this.loadTodos(); // Refresh in case Pull brought new items
  };

  renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.status}>{item.status}</Text>
    </View>
  );

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>PowerSync POC (RN 0.59)</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Todo..."
            value={this.state.newTodo}
            onChangeText={text => this.setState({ newTodo: text })}
          />
          <TouchableOpacity style={styles.addButton} onPress={this.addTodo}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={this.state.todos}
          renderItem={this.renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No Todos</Text>}
        />

        <TouchableOpacity style={styles.syncButton} onPress={this.sync} disabled={this.state.isSyncing}>
          <Text style={styles.syncButtonText}>
            {this.state.isSyncing ? "Syncing..." : "Sync Now"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
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
