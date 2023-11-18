package mywsocket

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

type Server struct {
	sessions Sessions
}

func StartServer(port string) *Server {
	server := Server{
		Create(),
	}

	http.HandleFunc("/", server.handleReq)
	go http.ListenAndServe(":"+port, nil)
	fmt.Printf("[WS] Opened websocket server on port %v\n", port)

	return &server
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Пропускаем любой запрос
	},
}

func (server *Server) handleReq(w http.ResponseWriter, r *http.Request) {
	connection, _ := upgrader.Upgrade(w, r, nil)
	go server.init(connection)
}

func (server *Server) init(connection *websocket.Conn) {
	fmt.Println("Detected connection")
	for {
		mt, msg, err := connection.ReadMessage()
		if err != nil || mt == websocket.CloseMessage {
			break
		}
		message := string(msg)
		if string(msg) == "init" {
			fmt.Println("started initialization")
			id, _ := server.sessions.CreateSession([]*websocket.Conn{connection})
			connection.WriteMessage(websocket.TextMessage, []byte(id))
			fmt.Printf("initialized: %v session\n", id)
			go server.sessions.AddMessageHandler(id, echo)
			break
		} else if server.sessions.FindSession(message) != nil {
			server.sessions.AddListener(message, connection)
			fmt.Println(server.sessions.FindSession(message).History)
			connection.WriteJSON(ExternalMsg{MsgType: "history", Content: server.sessions.FindSession(message).History})
			fmt.Printf("connected to %v session\n", message)
			break
		}

	}
}

func echo(message Message) {
	var msg ExternalMsg
	err := json.Unmarshal(message.Msg, &msg)
	if err != nil {
		fmt.Println("[WS][ERROR] Error parsing message")
		return
	}
	if msg.MsgType == "drawing" {
		var drawMsg DrawMessage
		err := json.Unmarshal(message.Msg, &drawMsg)
		if err != nil {
			fmt.Println("[WS][ERROR] Error parsing draw message")
			return
		}
		message.Session.History = append(message.Session.History, drawMsg.Content)
	}
	if msg.MsgType == "getHistory" {
		message.Sender.WriteJSON(ExternalMsg{MsgType: "history", Content: message.Session.History})
		return
	}
	message.Session.SendMessage(message)
}
