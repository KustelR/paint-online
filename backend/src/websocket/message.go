package mywsocket

import "github.com/gorilla/websocket"

type Message struct {
	Sender  *websocket.Conn
	Session *Session
	Msg     []byte
	Mt      int
}
